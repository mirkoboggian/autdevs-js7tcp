const net = require('net');
const events = require('events');
const s7comm = require("./s7comm");
var rwlock = require('readwrite-lock');

class S7Socket extends events{

    constructor(ip = "127.0.0.1", port = 102, rack = 0, slot = 2, autoreconnect = 10000, timeout = 60000) {  
        super();        
        this.lock = new rwlock();
        this.ip = ip;
        this.port = port;
        this.rack = rack;
        this.slot = slot;        
        this.autoreconnect = autoreconnect;
        this.timeout = timeout;
    }
    
    connect() {
        this._connect();
    }

    read(parArea, areaNumber, start, len, isBit) {        
        this.lock.acquireRead('socket', async() => {
            return await this._read(parArea, areaNumber, start, len, isBit);
        }).then((result) => {

        }).catch((err) => {

        });
    }

    write(parArea, areaNumber, start, isBit, values) {
        this.lock.acquireWrite('socket', async() => {
            return await this._write(parArea, areaNumber, start, isBit, values);
        }).then((result) => {

        }).catch((err) => {

        });
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
                    if (buffer.length != 25+len) {
                        let e = new Error("Error on data read request!");
                        self._onError(e); 
                        reject(e);
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


var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000);

s7socket.on('connected', () => {
    console.log("CONESSOOOOO!");
    setInterval(() => {
          let data = s7socket.read(s7comm.ParameterArea.DB, 1, 0, 10, false);
    }, 500);
    setInterval(() => {
        let now = new Date(Date.now());
        let values = [1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds()];
        let data = s7socket.write(s7comm.ParameterArea.DB, 1, 0, false, values);
    }, 500);
});

s7socket.on('error', (error) => {
    console.error(error);
});

s7socket.on('read', (data) => {
    console.info("READ: ", data);
});

s7socket.on('write', (data) => {
    console.warn("WRITE: ", data);
});

s7socket.connect();