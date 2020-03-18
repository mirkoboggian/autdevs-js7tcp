const S7Socket = require('./s7socket');
const S7Tag = require('./s7tag');
const events = require('events');

module.exports = class S7Tcp extends events{

    constructor(name, ip = "127.0.0.1", port = 102, rack = 0, slot = 2, 
                autoreconnect = 10000, timeout = 60000, rwTimeout = 5000) {  
        super();   
        // properties     
        this.name = name;
        this.ip = ip;
        this.port = port;
        this.rack = rack;
        this.slot = slot;
        this.autoreconnect = autoreconnect;
        this.timeout = timeout;
        this.rwTimeout = rwTimeout; 
        // internal
        this.socket = new S7Socket(this.ip, this.port, this.rack, this.slot, this.autoreconnect, this.timeout, this.rwTimeout);
        this.socket.on('connect', () => this._onConnect());
        this.socket.on('read', (result) => this._onRead(result));
        this.socket.on('write', (result) => this._onWrite(result));
        this.socket.on('multiRead', (result) => this._onMultiRead(result));
        this.socket.on('multiWrite', (result) => this._onMultiWrite(result));
        this.socket.on('error', (error) => this._onError(error));
    }

    static fromConfig(config) {
        try {
            let plc = new S7Tcp(config.name, config.ip, config.port, config.rack, 
                config.slot, config.autoreconnect, config.timeout, config.rwTimeout);
            return plc;
        } catch(e) {
            let err = new Error("This config is not a valid config for S7Tcp.", e.message);
            throw err;
        }
    }

    connected() {
        return this.socket.connected();
    }

    _onConnect() {
        this.emit('connect');
    }

    _onRead(results) {
        this.emit('read', results);
    }

    _onWrite(results) {
        this.emit('write', results);
    }

    _onMultiRead(results) {
        this.emit('multiRead', results);
    }

    _onMultiWrite(results) {
        this.emit('multiWrite', results);
    }

    _onError(error) {
        this.emit('error', error);
    }

}