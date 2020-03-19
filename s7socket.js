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
        this.lock = new alock({timeout: this.rwTimeout});

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
        }).catch((e) => {
            this.connecting = false;
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

    #connect = () => {
        let self = this;
        return new Promise((resolve, reject) => {
            if (self._socket) {
                self._socket.removeAllListeners();
                self._socket.destroy();
            }                    
            self._socket = new net.Socket();
            self._socket.on('error', (error) => { self.#onError(error); return; });
            self._socket.setTimeout(self.timeout);
            self._socket.setKeepAlive(true, self.timeout); 
            self._socket.connect(self.port, self.ip, () => {
                let request = Uint8Array.from(s7comm.RegisterSessionRequest(self.rack, self.slot));
                let result = self._socket.write(request, (e) => {
                    if (e) {
                        self.#onError(e);
                        reject(e);
                        return;
                    };
                    self._socket.once('data', buffer => {                    
                        let response = Uint8Array.from(buffer);
                        if (response.length != 22) {
                            let e = new Error("Error registering session!");
                            self.#onError(e); 
                            reject(e);
                            return;
                        }
                        let request = Uint8Array.from(s7comm.NegotiatePDULengthRequest());
                        let result = self._socket.write(request, (e) => {
                            if (e) { 
                                self.#onError(e); 
                                reject(e);
                                return;
                            };
                            self._socket.once('data', buffer => {
                                let response = Uint8Array.from(buffer);
                                if (response.length != 27) {
                                    let e = new Error("Error negotiating PDU!");
                                    self.#onError(e);
                                    reject(e);
                                    return;
                                }
                                self.#onConnect();
                                resolve(true);
                            });
                        });
                    });                
                });
            });  
        });                
    }    

    #multiRead = (tags) => {    
        let self = this;
        return new Promise((resolve, reject) => {
            // assert s7comm.MAXITEMSLIST
            if (tags.length > s7comm.MAXITEMSLIST) {
                let e = new Error("Tags count is greater than Maximum (" + s7comm.MAXITEMSLIST + ")");
                reject(e);
                return;
            }
            // assert s7comm.MAXREADBYTES
            let totalLength = tags.reduce((total, item) => total + (item['bytesSize'] || 0), 0);
            if (totalLength > s7comm.MAXREADBYTES) {
                let e = new Error("Tags total length is greater than Maximum (" + s7comm.MAXREADBYTES + ")");
                reject(e);
                return;
            }
            let request = Uint8Array.from(s7comm.ReadRequest(tags));
            let result = self._socket.write(request, (e) => {
                if (e) { 
                    reject(e);
                    return;
                };
                self._socket.once('data', buffer => {
                    // assert ISO length
                    if (buffer.length < 22) {
                        let e = new Error("Error on data bytes read response!");
                        reject(e);
                        return;  
                    } 
                    // assert Operation result
                    if (buffer[17] != 0 || buffer[18] != 0) {
                        let e = new Error("Read response return an error: " + buffer[17] + "/" + buffer[18]);
                        reject(e);
                        return;  
                    } 
                    // assert Items Count
                    if (buffer[20] != tags.length || buffer[20] > s7comm.MAXITEMSLIST) {
                        let e = new Error("Read response return invalid items count");
                        reject(e);
                        return;  
                    }
                    let results = [];
                    let offset = 21;
                    tags.forEach((tag) => {
                        let normalizeByteSize = tag.bytesSize%2 ? (tag.bytesSize+1) : tag.bytesSize;
                        let tagResponse = buffer.slice(offset, offset + normalizeByteSize + 4);
                        // assert tag result
                        if (tagResponse[0] != 0xFF) {
                            // Error on read.
                            // add a null in tag value response
                            results.push({Tag: tag, Value: null});
                            return;
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
                            return;
                        }
                        // takes value
                        let tagValue = tagResponse.slice(4, 4 + tag.bytesSize);
                        results.push({Tag: tag, Value: Uint8Array.from(tagValue)});
                        offset += normalizeByteSize + 4;
                    });            
                    resolve(results);
                    return;
                });                
            });            
        }); 
    }

    #multiWrite = (tags, values) => {
        let self = this;
        return new Promise((resolve, reject) => {
            // assert tags count and values count
            if (tags.length != values.length) {
                let e = new Error("Tags count (" + tags.length + ") different from values count (" + values.length + ")");
                reject(e);
                return;
            }
            // assert s7comm.MAXITEMSLIST
            if (tags.length > s7comm.MAXITEMSLIST) {
                let e = new Error("Tags count is greater than Maximum (" + s7comm.MAXITEMSLIST + ")");
                reject(e);
                return;
            }
            // assert s7comm.MAXWRITEBYTES
            let totalLength = tags.reduce((total, item) => total + (item['bytesSize'] || 0), 0);
            if (totalLength > s7comm.MAXWRITEBYTES) {
                let e = new Error("Tags total length is greater than Maximum (" + s7comm.MAXWRITEBYTES + ")");
                reject(e);
                return;
            }
            let request = Uint8Array.from(s7comm.WriteRequest(tags, values));
            let result = self._socket.write(request, (e) => {
                if (e) { 
                    reject(e);
                    return;
                };                
                self._socket.once('data', buffer => {
                    // assert Operation result
                    if (buffer[17] != 0 || buffer[18] != 0) {
                        let e = new Error("Write response return an error: " + buffer[17] + "/" + buffer[18]);
                        reject(e);
                        return;  
                    } 
                    // assert Items Count
                    if (buffer[20] != tags.length || buffer[20] > s7comm.MAXITEMSLIST) {
                        let e = new Error("Write response return invalid items count");
                        reject(e);
                        return;  
                    } 
                    let results = [];
                    let offset = 21;
                    tags.forEach((tag) => {
                        results.push({Tag: tag, Value: buffer[offset]});
                        offset += 1;
                    });
                    resolve(results);
                    return;
                });
            });
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
        this.emit('error', error);
    }
}


module.exports = S7Socket;