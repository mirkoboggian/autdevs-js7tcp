const s7comm = require("./s7comm");
const net = require('net');
const events = require('events');
const alock = require('async-lock');

// Local Consts
const MAXPENDING = 20;
if (Object.freeze) {
    Object.freeze(MAXPENDING);
}
exports.MAXPENDING = MAXPENDING;

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

        this.lock = new alock({timeout: this.rwTimeout, maxPending: this.MAXPENDING});

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
     * @returns {S7Socket} a S7Socket instance
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

    sequenceNumber = 0;
    /**
     * Generate a Sequence number for connect/read/write request 
     * @returns {Number} the next sequence number
     */
    #nextSequenceNumber = () => {
        this.sequenceNumber = ++this.sequenceNumber % 65535;
        return this.sequenceNumber;
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
     * @returns {Boolean} 'true' if connect, else 'false'
     */
    connected() {
        return (this._socket && this._socket.readyState == "open");
    }

    /**
     * Read from S7 CPU a list of tags (MAX. 20 tags)
     * @param {Array} tags The array of S7Tags to read
     * @returns {Array} Array of Tags and their values
         */
    read(tags) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this.#onError(e);
        } else {
            this.lock.acquire('socket', async() => {
                return await this.#read(tags);
            }).then((result) => {
                this.#onRead(result);
            }).catch((err) => {
                this.#onError(err); 
            });
        }   
    }

    /**
     * Write to S7 CPU a list of tags/values (MAX. 20 tags)
     * @param {Array} tags The array of S7Tags to write
     * @param {Array} values The array of values to write
     * @returns {Array} Array of Tags and their write results
     */
    write(tags, values) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this.#onError(e);
        } else {
            this.lock.acquire('socket', async() => {
                return await this.#write(tags, values);
            }, {skipQueue: true}).then((result) => {
                this.#onWrite(result);
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
                let result = s7comm.RegisterSessionResponse(response);
                resolve(result);
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
                let result = s7comm.NegotiatePDULengthResponse(response);
                resolve(result);
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
     * This function send a data read request
     * @param {Array} tags Array of S7tag
     * @returns {Promise} Response as array of bytes or Reject as Error
     */
    #readSendRequest = (tags) => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let request = Uint8Array.from(s7comm.ReadRequest(tags, self.#nextSequenceNumber()));
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
    #readSendResponse = (tags, data) => {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                let results = s7comm.ReadResponse(tags, data);
                resolve(results);
            } catch(e) {
                reject(e);
            }         
        });
    }

    /**
     * This function send a data read request and return data in Raw format
     * @param {Array} tags Array of S7tag
     * @returns {Promise} Response as array {S7tag, value) or Reject as Error
     */
    #read = (tags) => {    
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                let dataRead = await self.#readSendRequest(tags);
                let result = await self.#readSendResponse(tags, dataRead);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        }); 
    }

    /**
     * This function send a data write request
     * @param {Array} tags Array of S7tag
     * @param {Array} values Array of Array of byte
     * @returns {Promise} Response as true or Reject as Error
     */
    #writeSendRequest = (tags, values) => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let request = Uint8Array.from(s7comm.WriteRequest(tags, values));
            // ATT! important to register on socket error too!
            // If n error on socket occour the lock is never release
            // To avoid too many listener Error remove it before return promise
            let onceSocketError = (e) => { reject(e); }
            self._socket.once('error', onceSocketError);
            try {
                let writeRequestResponse = await self.#socketSendReceive(request, self.#nextSequenceNumber());                
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
    #writeSendResponse = (tags, data) => {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                let results = s7comm.WriteResponse(tags, data);
                resolve(results);
            } catch(e) {
                reject(e);
            }         
        });
    }

    /**
     * This function capture data after a read request
     * @param {Array} tags Array of S7tag
     * @param {Array} values Array of Array of byte
     * @returns {Promise} Response as array {S7tag, Byte) or Reject as Error
     */
    #write = (tags, values) => {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                let dataRead = await self.#writeSendRequest(tags, values);
                let result = await self.#writeSendResponse(tags, dataRead);
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

    #onError = (error) => {        
        this.lock = new alock({timeout: this.rwTimeout, maxPending: this.MAXPENDING});
        this._socket.destroy();
        this.connecting = false;
        this.emit('error', error);
    }
}


module.exports = S7Socket;