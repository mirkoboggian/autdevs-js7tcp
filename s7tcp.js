const S7Socket = require('./s7socket');
const S7Tag = require('./s7tag');
const events = require('events');

module.exports = class S7Tcp extends events{

    /**
     * S7Tcp class constructor
     * @param {string} name An unique name
     * @param {string} ip The CPU TCP address (xxx.xxx.xxx.xxx)
     * @param {number} port The CPU TPC port
     * @param {number} rack The CPU rack
     * @param {number} slot The CPU slot
     * @param {number} autoreconnect milliseconds to wait before try to reconnect
     * @param {number} timeout milliseconds of socket inactivity before close
     * @param {number} rwTimeout milliseconds of waiting before acquire socket's lock for read/write operations
     */
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
        this.socket.on('connect', () => this.#onConnect());
        this.socket.on('read', (result) => this.#onRead(result));
        this.socket.on('write', (result) => this.#onWrite(result));
        this.socket.on('multiRead', (result) => this.#onMultiRead(result));
        this.socket.on('multiWrite', (result) => this.#onMultiWrite(result));
        this.socket.on('error', (error) => this.#onError(error));
    }

    /**
     * Create a S7Tcp instance using a config object
     * @param {object} config object with parameters like {name: "s7tcp", ip:"192.168.1.1", .. }
     */
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

    /**
     * Function to check if S7Socket is connected
     */
    connected() {
        return this.socket.connected();
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