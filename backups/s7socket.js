const s7comm = require("./s7comm");
const net = require('net');
const events = require('events');
var alock = require('async-lock');

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
        this.lock = new alock({timeout: this.rwTimeout});
    }
    
    connect() {
        this._connect();
    }

    connected() {
        return (this._socket && this._socket.readyState == "open");
    }

    read(tag) {    
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this._onError(e);
        } else { 
            this.lock.acquire('socket', async() => {
                return await this._read(tag);
            }).then((result) => {
                this._onRead(result);
            }).catch((err) => {
                this._onError(err); 
            });
        }    
    }

    write(tag, value) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this._onError(e);
        } else {
            this.lock.acquire('socket', async() => {
                return await this._write(tag, value);
            }).then((result) => {
                this._onWrite(result);
            }).catch((err) => {                
                this._onError(err); 
            });
        }        
    }

    multiRead(tags) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this._onError(e);
        } else {
            this.lock.acquire('socket', async() => {
                return await this._multiRead(tags);
            }).then((result) => {
                this._onRead(result);
            }).catch((err) => {
                this._onError(err); 
            });
        }   
    }

    multiWrite(tags, values) {
        if (!this.connected()) {
            let e = new Error("Invalid socket status.");
            this._onError(e);
        } else {
            this.lock.acquire('socket', async() => {
                return await this._multiWrite(tags, values);
            }).then((result) => {
                this._onRead(result);
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
            self._socket.on('error', (error) => { self._onError(error); return; });
            self._socket.setTimeout(self.timeout);
            self._socket.setKeepAlive(true, self.timeout); 
            self._socket.connect(self.port, self.ip, () => {
                let request = Uint8Array.from(s7comm.RegisterSessionRequest(self.rack, self.slot));
                let result = self._socket.write(request, (e) => {
                    if (e) {
                        self._onError(e);
                        reject(e);
                        return;
                    };
                    self._socket.once('data', buffer => {                    
                        let response = Uint8Array.from(buffer);
                        if (response.length != 22) {
                            let e = new Error("Error registering session!");
                            self._onError(e); 
                            reject(e);
                            return;
                        }
                        let request = Uint8Array.from(s7comm.NegotiatePDULengthRequest());
                        let result = self._socket.write(request, (e) => {
                            if (e) { 
                                self._onError(e); 
                                reject(e);
                                return;
                            };
                            self._socket.once('data', buffer => {
                                let response = Uint8Array.from(buffer);
                                if (response.length != 27) {
                                    let e = new Error("Error negotiating PDU!");
                                    self._onError(e);
                                    reject(e);
                                    return;
                                }
                                self._onConnect();
                                resolve(true);
                            });
                        });
                    });                
                });
            });  
        });                
    }    

    _read(tag) {
        let self = this;
        return new Promise((resolve, reject) => {
            // assert s7comm.MAXREADBYTES
            if (tag.bytesSize > s7comm.MAXREADBYTES) {
                let e = new Error("Tag's bytesSize is greater than Read Maximum (" + s7comm.MAXREADBYTES + ")");
                reject(e);
                return;
            }
            let request = Uint8Array.from(s7comm.ReadRequest([tag]));
            let result = self._socket.write(request, (e) => {
                if (e) { 
                    reject(e);
                    return;
                };
                self._socket.once('data', buffer => {
                    if (buffer.length != 25+tag.bytesSize) {
                        let e = new Error("Error on data bytes read response!");
                        reject(e);
                        return;  
                    }                                              
                    if (buffer[21] != 0xFF) {
                        let e = new Error("Error reading data: " + buffer[response.prototype.length-1]);
                        reject(e);
                        return;
                    }                    
                    let data = Uint8Array.from(buffer.subarray(25, 25+tag.bytesSize));                                    
                    resolve(data);
                    return;
                }); 
            });
        });        
    }

    _write(tag, value) {
        let self = this;
        return new Promise((resolve, reject) => {
            // assert bytesLength
            if (tag.bytesSize != value.length) {
                let e = new Error("Tag's size and value size are different. Tag = " + tag.bytesSize + ", Value = " + value.length);
                reject(e);
                return;
            }   
            // assert s7comm.MAXWRITEBYTES
            if (tag.bytesSize > s7comm.MAXWRITEBYTES) {
                let e = new Error("Tag's bytesSize is greater than Write Maximum (" + s7comm.MAXWRITEBYTES + ")");
                reject(e);
                return;
            }            
            let request = Uint8Array.from(s7comm.WriteRequest([tag], [value]));
            let result = self._socket.write(request, (e) => {
                if (e) {
                    reject(e);
                    return;
                };
                self._socket.once('data', buffer => {                    
                    if (buffer.length != 22) {
                        let e = new Error("Error on data write response!");
                        reject(e);
                        return;
                    }                    
                    if (buffer[21] != 0xFF) {
                        let e = new Error("Error writing data: " + buffer[buffer.prototype.length-1]);
                        reject(e);
                        return;
                    }                                        
                    resolve(value);
                    return;
                }); 
            });
        });        
    }

    _multiRead(tags)
    {    
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
                    let values = [];
                    let offset = 21;
                    tags.forEach((tag) => {
                        let tagResponse = buffer.slice(offset, offset + tag.bytesSize + 4);
                        // assert tag result
                        if (tagResponse[0] != 0xFF) {
                            let e = new Error("Error reading tag " + tag.path);
                            reject(e);
                            return;
                        }
                        // ATT: in tagResponse[1] there is the DataType to know how to manage the SIZE.
                        // I supposed to read only bytes > the SIZE is in bits
                        let itemBitsLength = tagResponse[2] * 256 + tagResponse[3];
                        let itemBytesLength = itemBitsLength / 8;
                        // assert tag result bytes length
                        if (itemBytesLength != tag.bytesSize) {
                            let e = new Error("Error reading tag bytes size " + tag.path);
                            reject(e);
                            return;
                        }
                        // takes value
                        let tagValue = tagResponse.slice(4, 4 + tag.bytesSize);
                        values.push(tagValue);
                        offset += tag.bytesSize + 4;
                    });            
                    resolve(values);
                    return;
                });                
            });            
        }); 
    }

    /* TODO */
    _multiWrite(tags, values)
    {
        let self = this;
        return new Promise((resolve, reject) => {
            resolve(null);
            return;
        }); 
    }

    _onConnect() {
        this.emit('connect');
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