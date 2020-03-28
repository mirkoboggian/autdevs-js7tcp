const events = require('events');
const { S7Socket } = require("./s7socket");
const S7Tag = require("./s7tag");

class S7Tcp extends events {

    /**
     * The server that manage read/write request, notify subscriptions on tag changes.
     * @param {S7Socket} socket The S7Tcp socket used to Read/Write data 
     * @param {Array} tags An array of S7Tag
     */
    constructor(socket, tags) {
        // events
        super();
        // local
        this.requestId = 0;
        //socket
        this.socket = socket;
        this.socket.on('connect', this.#onSocketConnect);
        this.socket.on('error', this.#onSocketError);
        this.socket.on('read', (result, seqNumber) => {});
        this.socket.on('write', (result, seqNumber) => {});
        // tags
        this.tags = tags;
    }

    static fromConfig(config) {
        try {
            // socket
            let confSocket = config.socket;
            let socket = S7Socket.fromConfig(confSocket);
            // tags            
            let confTags = config.tags;
            let tags = [];
            confTags.forEach(confTag => {
                tags.push(S7Tag.fromConfig(confTag));
            });
            let s7tcp = new S7Tcp(socket, tags);
            return s7tcp;
        } catch(e) {
            let err = new Error("This config is not a valid config for S7Tcp.", e.message);
            throw err;
        }
    }



    #onSocketConnect = (seqNumber) => {
        console.log(`(${seqNumber}) : SOCKET CONNESSA!`);
        // start polling tasks
    }

    #onSocketError = (error) => {
        console.error(error);
    }



}

module.exports = S7Tcp;