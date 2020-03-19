const S7Socket = require('./s7socket');
const S7Tag = require('./s7tag');
const events = require('events');

/**
 * S7Tcp is a server and it has the task of handling all read/write requests.
 * It's a Gateway between clients (who needs data) and S7 Device (where data are).
 */
class S7Tcp extends events{

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
    constructor(name, s7socket) {  
        super();   
        // properties     
        this.name = name;      
        // internal
        this.socket = s7socket;
        this.socket.on('connect', () => this.#onConnect());
        this.socket.on('read', (result) => this.#onRead(result));
        this.socket.on('write', (result) => this.#onWrite(result));
        this.socket.on('multiRead', (result) => this.#onMultiRead(result));
        this.socket.on('multiWrite', (result) => this.#onMultiWrite(result));
        this.socket.on('error', (error) => this.#onError(error));
    }

    /**
     * Create a S7Tcp instance using a config object
     * @param {object} config object with parameters like {"name": "s7tcp", "socket": {ip:"192.168.1.1", .. } }
     */
    static fromConfig(config) {
        try {
            // socket
            let configSocket = config.socket;
            let s7socket = S7Socket.fromConfig(configSocket);
            // server (complete)
            return new S7Tcp(config.name, s7socket);
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

module.exports = S7Tcp;