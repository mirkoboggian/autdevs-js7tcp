const s7comm = require("./s7comm");
const net = require('net');
const events = require('events');
var alock = require('async-lock');

/**
 * S7Socket Class encapsulate a TCP socket to manage connection to device, read tags and write tags.
 * The socket is protect from concurrent request by lock.
 */
class S7Socket extends events{

    /**
     * S7Socket constructor. This class manages connection/read and write operations using a TCP socket
     * @param {string} ip The CPU TCP address (xxx.xxx.xxx.xxx)
     * @param {number} port The CPU TPC port
     * @param {number} rack The CPU rack
     * @param {number} slot The CPU slot
     * @param {number} autoreconnect milliseconds to wait before try to reconnect
     * @param {number} timeout milliseconds of socket inactivity before close
     * @param {number} rwTimeout milliseconds of waiting before acquire socket's lock for read/write operations
     */
    constructor(ip = "127.0.0.1", port = 102, rack = 0, slot = 2, autoreconnect = 10000, timeout = 60000, rwTimeout = 5000) {  
        super();        
        this.ip = ip;
        this.port = port;
        this.rack = rack;
        this.slot = slot;        
        this.autoreconnect = autoreconnect;
        this.timeout = timeout;
        this.rwTimeout = rwTimeout;

        this.lock = new alock({timeout: this.rwTimeout, maxPending: 20});

        // internal use
        this.connecting = false;
        this.reconnectIntervall = null;
        if(this.autoreconnect > 0) {
            this.connect();
            this.reconnectIntervall = setInterval(() => {
                if (!this.connected() && !this.connecting) {
                    this.connect();
                }
            }, this.autoreconnect);
        }        
    }
    
    /**
     * Create a S7Socket instance using a config object
     * @param {object} config object with parameters like {"ip":"192.168.1.1", "port":102, .. }
     */
    static fromConfig(config) {
        try {
            let s7socket = new S7Socket(config.ip, config.port, config.rack, 
                config.slot, config.autoreconnect, config.timeout, config.rwTimeout);
            return s7socket;
        } catch(e) {
            let err = new Error("This config is not a valid config for S7socket.", e.message);
            throw err;
        }
    }

    /**
     * Try to connect the Socket to CPU
     */
    async connect() {
        this.connecting = true;
        this.#connect().then(() => {
            this.connecting = false;
            this.#onConnect();
        }).catch((e) => {
            this.connecting = false;
            this.#onError(e);
        });        
    }

    /**
     * Check if S7socket is connected
     */
    connected() {
        return (this._socket && this._socket.readyState == "open");
    }

    /**
     * Read from S7 CPU a single tag (MAX. 942 bytes)
     * @param {S7Tag} tag The tag to read
     */
    read(tag) {    
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this.#onError(e);
        } else { 
            this.lock.acquire('socket', async() => {
                return await this.#multiRead([tag]);
            }).then((result) => {
                this.#onRead(result[0]);
            }).catch((err) => {
                this.#onError(err); 
            });
        }    
    }

    /**
     * Write to S7 CPU a single tag (MAX. 932 bytes)
     * @param {S7Tag} tag The tag to write
     * @param {object} value The value to write
     */
    write(tag, value) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this.#onError(e);
        } else {
            this.lock.acquire('socket', async() => {
                return await this.#multiWrite([tag], [value]);
            }).then((result) => {
                this.#onWrite(result[0]);
            }).catch((err) => {                
                this.#onError(err);
            });
        }        
    }

    /**
     * Read from S7 CPU a list of tags (MAX. 20 tags)
     * @param {Array} tags The array of S7Tags to read
     */
    multiRead(tags) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this.#onError(e);
        } else {
            this.lock.acquire('socket', async() => {
                return await this.#multiRead(tags);
            }).then((result) => {
                this.#onMultiRead(result);
            }).catch((err) => {
                this.#onError(err); 
            });
        }   
    }

    /**
     * Write to S7 CPU a list of tags/values (MAX. 20 tags)
     * @param {Array} tags The array of S7Tags to write
     * @param {Array} values The array of values to write
     */
    multiWrite(tags, values) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this.#onError(e);
        } else {
            this.lock.acquire('socket', async() => {
                return await this.#multiWrite(tags, values);
            }).then((result) => {
                this.#onMultiWrite(result);
            }).catch((err) => {
                this.#onError(err); 
            });
        }
    }

    /**
     * This function send a message to socket and return the response.
     * @param {Array} sendMessage Array of bytes to send through the socket
     * @returns {Promise} Response as Array of bytes or Reject as Error
     */
    #socketSendReceive = (sendMessage) => {
        let self = this;
        return new Promise((resolve, reject) => {
            // check socket status
            if (!self.connected()) {
                let e = new Error("Socket not connected");
                reject(e);
            }
            let onData = (buffer) => {
                self._socket.off("error", onError);
                resolve(buffer);
            }
            let onError = (e) => {
                self._socket.off("data", onData);
                reject(e);                
            }
            self._socket.once("error", onError);
            self._socket.once("data", onData);
            self._socket.write(sendMessage, (e) => {
                // write done, check for errors
                if (e != null) {
                    reject(e);
                }
            })
        });
    }

    /**
     * This function try to open the socket communication.
     * @returns {Promise} Response as readyState or Reject as Error
     */
    #openSocket = () => {
        let self = this;
        return new Promise((resolve, reject) => {
            // if socket already exists destroy it
            if (self._socket) {
                self._socket.removeAllListeners();
                self._socket.destroy();
            } 
            // new socket instance
            self._socket = new net.Socket();
            self._socket.setTimeout(self.timeout);
            self._socket.setKeepAlive(true, self.timeout); 
            let onceSocketError = (e) => { 
                reject(e); 
            }
            let onSocketConnect = () => {
                self._socket.off('error', onceSocketError);
                resolve(self._socket.readyState);
            }
            self._socket.once('error', onceSocketError);
            self._socket.connect(self.port, self.ip, onSocketConnect);
        });
    }

    /**
     * This function try to register session to device
     * @returns {Promise} Response as true or Reject as Error
     */
    #registerSession = () => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let request = Uint8Array.from(s7comm.RegisterSessionRequest(self.rack, self.slot));
            try {
                let registerSessionResponse = await self.#socketSendReceive(request);
                let response = Uint8Array.from(registerSessionResponse);
                if (response.length != 22) {
                    let e = new Error("Error registering session!");
                    reject(e);
                }
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * This function try to negotiate PDU with device
     * @returns {Promise} Response as true or Reject as Error
     */
    #NegotiatePDULength = () => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let request = Uint8Array.from(s7comm.NegotiatePDULengthRequest());
            try {
                let negotiatePDULengthResponse = await self.#socketSendReceive(request);
                let response = Uint8Array.from(negotiatePDULengthResponse);
                if (response.length != 27) {
                    let e = new Error("Error negotiating PDU!");
                    reject(e);
                }
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * This function try to connect, register session and negotiate PDU with device
     * @returns {Promise} Response as true or Reject as Error
     */
    #connect = () => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                await self.#openSocket();
                await self.#registerSession();
                await self.#NegotiatePDULength();
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * This function validates the tags for Read Requests
     * @param {Array} tags Array of S7tag
     * @returns {Promise} Response as true or Reject as Error
     */
    #multiReadAssertInput = (tags) => {
        let self = this;
        return new Promise((resolve, reject) => {
            // assert s7comm.MAXITEMSLIST
            if (tags.length > s7comm.MAXITEMSLIST) {
                let e = new Error("Tags count is greater than Maximum (" + s7comm.MAXITEMSLIST + ")");
                reject(e);
            }
            // assert s7comm.MAXREADBYTES
            let totalLength = tags.reduce((total, item) => total + (item['bytesSize'] || 0), 0);
            if (totalLength > s7comm.MAXREADBYTES) {
                let e = new Error("Tags total length is greater than Maximum (" + s7comm.MAXREADBYTES + ")");
                reject(e);
            }
            // all goods
            resolve(true);
        })
    }

    /**
     * This function send a data read request
     * @param {Array} tags Array of S7tag
     * @returns {Promise} Response as array of bytes or Reject as Error
     */
    #multiReadSendRequest = (tags) => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let request = Uint8Array.from(s7comm.ReadRequest(tags));
            // ATT! important to register on socket error too!
            // If n error on socket occour the lock is never release
            // To avoid too many listener Error remove it before return promise
            let onceSocketError = (e) => { reject(e); }
            self._socket.once('error', onceSocketError);
            try {
                let readRequestResponse = await self.#socketSendReceive(request);                
                self._socket.off('error', onceSocketError);
                resolve(readRequestResponse);
            } catch (e) {
                self._socket.off('error', onceSocketError);
                reject(e);
            }
        })
    }

    /**
     * This function capture data after a read request
     * @param {Array} tags Array of S7tag
     * @param {Array} data Array of byte
     * @returns {Promise} Response as array {S7tag, Array of bytes) or Reject as Error
     */
    #multiReadSendResponse = (tags, data) => {
        let self = this;
        return new Promise((resolve, reject) => {
            // assert ISO length
            if (data.length < 22) {
                let e = new Error("Error on data bytes read response!");
                reject(e);
            } 
            // assert Operation result
            if (data[17] != 0 || data[18] != 0) {
                let e = new Error("Read response return an error: " + data[17] + "/" + data[18]);
                reject(e);
            } 
            // assert Items Count
            if (data[20] != tags.length || data[20] > s7comm.MAXITEMSLIST) {
                let e = new Error("Read response return invalid items count");
                reject(e);
            }
            // Read data result
            let results = [];
            let offset = 21;
            tags.forEach((tag) => {
                let normalizeByteSize = tag.bytesSize%2 ? (tag.bytesSize+1) : tag.bytesSize;
                let tagResponse = data.slice(offset, offset + normalizeByteSize + 4);
                // assert tag result
                if (tagResponse[0] != 0xFF) {
                    // Error on read.
                    // add a null in tag value response
                    results.push({Tag: tag, Value: null});
                }
                // ATT: in tagResponse[1] there is the DataType to know how to manage the SIZE.
                // I supposed to read only bytes > the SIZE is in bits
                let itemBitsLength = tagResponse[2] * 256 + tagResponse[3];
                let itemBytesLength = itemBitsLength / 8;
                // assert tag result bytes length
                if (itemBytesLength != tag.bytesSize) {
                    // Error reading tag bytes size
                    // add a null in tag value response
                    results.push({Tag: tag, Value: null});
                }
                // takes value
                let tagValue = tagResponse.slice(4, 4 + tag.bytesSize);
                results.push({Tag: tag, Value: Uint8Array.from(tagValue)});
                offset += normalizeByteSize + 4;
            });
            resolve(results);
        })
    }

    /**
     * This function send a data read request and return data in Raw format
     * @param {Array} tags Array of S7tag
     * @returns {Promise} Response as array {S7tag, value) or Reject as Error
     */
    #multiRead = (tags) => {    
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                let multiReadAssert = await self.#multiReadAssertInput(tags);
                let dataRead = await self.#multiReadSendRequest(tags);
                let result = await self.#multiReadSendResponse(tags, dataRead);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        }); 
    }

    /**
     * This function validates the tags/values for Write Requests
     * @param {Array} tags Array of S7tag
     * @param {Array} values Array of Array of byte
     * @returns {Promise} Response as true or Reject as Error
     */
    #multiWriteAssertInput = (tags, values) => {
        let self = this;
        return new Promise((resolve, reject) => {
            // assert tags count and values count
            if (tags.length != values.length) {
                let e = new Error("Tags count (" + tags.length + ") different from values count (" + values.length + ")");
                reject(e);
            }
            // assert s7comm.MAXITEMSLIST
            if (tags.length > s7comm.MAXITEMSLIST) {
                let e = new Error("Tags count is greater than Maximum (" + s7comm.MAXITEMSLIST + ")");
                reject(e);
            }
            // assert s7comm.MAXWRITEBYTES
            let totalLength = tags.reduce((total, item) => total + (item['bytesSize'] || 0), 0);
            if (totalLength > s7comm.MAXWRITEBYTES) {
                let e = new Error("Tags total length is greater than Maximum (" + s7comm.MAXWRITEBYTES + ")");
                reject(e);
            }
            resolve(true);
        })
    }

    /**
     * This function send a data write request
     * @param {Array} tags Array of S7tag
     * @param {Array} values Array of Array of byte
     * @returns {Promise} Response as true or Reject as Error
     */
    #multiWriteSendRequest = (tags, values) => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let request = Uint8Array.from(s7comm.WriteRequest(tags, values));
            // ATT! important to register on socket error too!
            // If n error on socket occour the lock is never release
            // To avoid too many listener Error remove it before return promise
            let onceSocketError = (e) => { reject(e); }
            self._socket.once('error', onceSocketError);
            try {
                let writeRequestResponse = await self.#socketSendReceive(request);                
                self._socket.off('error', onceSocketError);
                resolve(writeRequestResponse);
            } catch (e) {
                self._socket.off('error', onceSocketError);
                reject(e);
            }
        })
    }

    /**
     * This function capture data after a read request
     * @param {Array} tags Array of S7tag
     * @param {Array} data Array of byte
     * @returns {Promise} Response as array {S7tag, Byte) or Reject as Error
     */
    #multiWriteSendResponse = (tags, data) => {
        let self = this;
        return new Promise((resolve, reject) => {
            // assert Operation result
            if (data[17] != 0 || data[18] != 0) {
                let e = new Error("Write response return an error: " + data[17] + "/" + data[18]);
                reject(e);
            } 
            // assert Items Count
            if (data[20] != tags.length || data[20] > s7comm.MAXITEMSLIST) {
                let e = new Error("Write response return invalid items count");
                reject(e);
            } 
            let results = [];
            let offset = 21;
            tags.forEach((tag) => {
                results.push({Tag: tag, Value: data[offset]});
                offset += 1;
            });
            resolve(results);
        })
    }

    /**
     * This function capture data after a read request
     * @param {Array} tags Array of S7tag
     * @param {Array} values Array of Array of byte
     * @returns {Promise} Response as array {S7tag, Byte) or Reject as Error
     */
    #multiWrite = (tags, values) => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                let multiReadAssert = await self.#multiWriteAssertInput(tags, values);
                let dataRead = await self.#multiWriteSendRequest(tags, values);
                let result = await self.#multiWriteSendResponse(tags, dataRead);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        }); 
    }

    #onConnect = () => {
        this.emit('connect');
    }

    #onRead = (results) => {
        this.emit('read', results);
    }

    #onWrite = (results) => {
        this.emit('write', results);
    }

    #onMultiRead = (results) => {
        this.emit('multiRead', results);
    }

    #onMultiWrite = (results) => {
        this.emit('multiWrite', results);
    }

    #onError = (error) => {        
        // this.lock = new alock({timeout: this.rwTimeout, maxPending: 20});
        this._socket.destroy();
        this.connecting = false;
        this.emit('error', error);
    }
}


module.exports = S7Socket;