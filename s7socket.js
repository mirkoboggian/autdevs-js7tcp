const s7comm = require("./s7comm");
const net = require('net');
const events = require('events');
var rwlock = require('readwrite-lock');

module.exports = class S7Socket extends events{

    constructor(ip = "127.0.0.1", port = 102, rack = 0, slot = 2, autoreconnect = 10000, timeout = 60000, rwTimeout = 5000) {  
        super();        
        this.ip = ip;
        this.port = port;
        this.rack = rack;
        this.slot = slot;        
        this.autoreconnect = autoreconnect;
        this.timeout = timeout;
        this.rwTimeout = rwTimeout;
        this.lock = new rwlock({timeout: this.rwTimeout});
    }
    
    connect() {
        this._connect();
    }

    connected() {
        return (this._socket && this._socket.readyState == "open");
    }

    read(parArea, areaNumber, start, len, isBit) {    
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this._onError(e);
        } else {
            this.lock.acquireRead('socket', async() => {
                return await this._read(parArea, areaNumber, start, len, isBit);
            }).then((result) => {
                // read completed
            }).catch((err) => {
                this._onError(err); 
            });
        }    
    }

    write(parArea, areaNumber, start, isBit, values) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this._onError(e);
        } else {
            this.lock.acquireWrite('socket', async() => {
                return await this._write(parArea, areaNumber, start, isBit, values);
            }).then((result) => {
                // write completed
            }).catch((err) => {
                this._onError(err); 
            });
        }        
    }

    _connect() {
        let self = this;
        return new Promise((resolve, reject) => {
            if (self._socket) {
                self._socket.removeAllListeners();
                self._socket.destroy();
            }                    
            self._socket = new net.Socket();
            self._socket.on('error', (error) => { self._onError(error); });
            self._socket.setTimeout(self.timeout);
            self._socket.setKeepAlive(true, self.timeout); 
            self._socket.connect(self.port, self.ip, () => {
                let request = Uint8Array.from(s7comm.RegisterSessionRequest(self.rack, self.slot));
                let result = self._socket.write(request, (e) => {
                    if (e) {
                        self._onError(e);
                        reject(e);
                    };
                    self._socket.once('data', buffer => {                    
                        let response = Uint8Array.from(buffer);
                        if (response.length != 22) {
                            let e = new Error("Error registering session!");
                            self._onError(e); 
                            reject(e);
                        }
                        let request = Uint8Array.from(s7comm.NegotiatePDULengthRequest());
                        let result = self._socket.write(request, (e) => {
                            if (e) { 
                                self._onError(e); 
                                reject(e);
                            };
                            self._socket.once('data', buffer => {
                                let response = Uint8Array.from(buffer);
                                if (response.length != 27) {
                                    let e = new Error("Error negotiating PDU!");
                                    self._onError(e);
                                    reject(e);
                                }
                                self.emit('connected');
                                resolve(true);
                            });
                        });
                    });                
                });
            });  
        });                
    }    

    _read(parArea, areaNumber, start, len, isBit) {
        let self = this;
        return new Promise((resolve, reject) => {
            if (len > s7comm.MAX_READ_BYTES) {
                let e = new Error("'len' is greater than Read Maximum (" + s7comm.MAX_READ_BYTES + ")");
                self._onError(e); 
                reject(e); 
            }
            let request = Uint8Array.from(s7comm.ReadRequest(parArea, areaNumber, start, len, isBit));
            let result = self._socket.write(request, (e) => {
                if (e) { 
                    self._onError(e); 
                    reject(e);
                };
                self._socket.once('data', buffer => {
                    if (isBit) {
                        if (buffer.length != 25+len) {
                            let e = new Error("Error on data bits read request!");
                            self._onError(e); 
                            reject(e);
                        }   
                    } else {
                        if (buffer.length != 25+len) {
                            let e = new Error("Error on data bytes read request!");
                            self._onError(e); 
                            reject(e);
                        }   
                    }                                              
                    if (buffer[21] != 0xFF) {
                        let e = new Error("Error reading data: " + buffer[response.prototype.length-1]);
                        self._onError(e);
                        reject(e);
                    }                    
                    let data = Uint8Array.from(buffer.subarray(25, 25 + len));                
                    self._onRead(data);
                    resolve(data);
                }); 
            });
        });        
    }

    _write(parArea, areaNumber, start, isBit, values) {
        let self = this;
        return new Promise((resolve, reject) => {
            let len = values.length;
            if (len > s7comm.MAX_WRITE_BYTES) {
                let e = new Error("'len' is greater than Write Maximum (" + s7comm.MAX_WRITE_BYTES + ")");
                self._onError(e); 
                reject(e);
            }            
            let request = Uint8Array.from(s7comm.WriteRequest(parArea, areaNumber, start, isBit, values));
            let result = self._socket.write(request, (e) => {
                if (e) {
                    self._onError(e); 
                    reject(e);
                };
                self._socket.once('data', buffer => {                    
                    if (buffer.length != 22) {
                        let e = new Error("Error on data write request!");
                        self._onError(e); 
                        reject(e);
                    }                    
                    if (buffer[21] != 0xFF) {
                        let e = new Error("Error writing data: " + buffer[response.prototype.length-1]);
                        self._onError(e);
                        reject(e);
                    }                    
                    self._onWrite(values);
                    resolve(values);
                }); 
            });
        });        
    }

    _onRead(data) {
        this.emit('read', data);
    }

    _onWrite(data) {
        this.emit('write', data);
    }

    _onError(error) {
        this.emit('error', error);
    }
}