const net = require('net');
const events = require('events');
const { S7Comm } = require("./s7comm");
const FunctionCode = require("./enums/FunctionCode")

/**
 * S7Socket Class encapsulate a TCP single socket to manage connection to device, read tags and write tags.
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
    constructor(ip = "127.0.0.1", port = 102, rack = 0, slot = 2, autoreconnect = 10000, timeout = 60000, rwtimeout = 3000) {          
        // Events
        super();                
        // Local settigns
        this.ip = ip;
        this.port = port;
        this.rack = rack;
        this.slot = slot;        
        this.autoreconnect = autoreconnect;
        this.timeout = timeout;
        this.rwtimeout = rwtimeout;  
        // Default settings  
        this.connecting = false;
        this.sequenceNumber = 0;
        this.pendingRequests = [];
        // TCP socket + events subscriptions
        this.socket = new net.Socket();
        this.socket.on('close', this.#onClose);
        this.socket.on('connect', this.#onConnect);
        this.socket.on('data', this.#onData);
        this.socket.on('drain', this.#onDrain);
        this.socket.on('end', this.#onEnd);
        this.socket.on('error', this.#onError);
        this.socket.on('lookup', this.#onLookup);
        this.socket.on('ready', this.#onReady);
        this.socket.on('timeout', this.#onTimeout);
    }
    
    /**
     * Create a S7Socket instance using a config object
     * @param {object} config object with parameters like {"ip":"192.168.1.1", "port":102, .. }
     * @returns {S7Socket} a S7Socket instance
     */
    static fromConfig(config) {
        try {
            let s7socket = new S7Socket(config.ip, config.port, config.rack, 
                config.slot, config.autoreconnect, config.timeout, config.rwtimeout);
            return s7socket;
        } catch(e) {
            let err = new Error("This config is not a valid config for S7socket.", e.message);
            throw err;
        }
    }
    
    /**
     * Generate a Sequence number for connect/read/write request 
     * @returns {Number} the next sequence number
     */
    #nextSequenceNumber = () => {
        this.sequenceNumber = ++this.sequenceNumber % 65535;
        return this.sequenceNumber;
    }

    /**
     * Open connection to socket
     */
    connect = () => {
        this.socket.connect( { port: this.port, host: this.ip });
    }


    /**
     * Send RegisterSession Request to server
     */
    #registerSessionRequest = () => {
        let request = Uint8Array.from(S7Comm.registerSessionRequest(this.rack, this.slot));
        this.socket.write(request, (error) => {
            if (error) this.#onError(error);
            this.pendingRequests.push({                
                type: FunctionCode.RegisterSessionReq,
                seqNumber: null,
                tags: null,
                timeout: setTimeout(() => {
                    let err = new Error(`(${mySeqNumber}) RegisterSession timeout`);
                    this.#onError(er);
                }, this.rwtimeout)
            });
        });
    }

    /**
     * Send NegotiatePDULength Request to server
     */
    #negotiatePDULengthRequest = () => {
        let mySeqNumber = this.#nextSequenceNumber();
        let request = Uint8Array.from(S7Comm.negotiatePDULengthRequest(mySeqNumber));
        this.socket.write(request, (error) => {
            if (error) this.#onError(error);
            this.pendingRequests.push({                
                type: FunctionCode.OpenS7Connection,
                seqNumber: mySeqNumber,
                tags: null,
                timeout: setTimeout(() => {
                    let err = new Error(`(${mySeqNumber}) negotiatePDULength timeout`);
                    this.#onError(er);
                }, this.rwtimeout)
            });
        });
    }

    /**
     * Send Read Request to server
     * @param {Array} tags The list of S7Tag to read
     */
    read = (tags) => {
        let mySeqNumber = this.#nextSequenceNumber();
        let request = Uint8Array.from(S7Comm.readRequest(tags, mySeqNumber));
        this.socket.write(request, (error) => {
            if (error) this.#onError(error);
            this.pendingRequests.push({                
                type: FunctionCode.Read,
                seqNumber: mySeqNumber,
                tags: tags,
                timeout: setTimeout(() => {
                    let err = new Error(`(${mySeqNumber}) Read timeout`);
                    this.#onError(er);
                }, this.rwtimeout)
            });
        });
    }

    /**
     * Send Write Request to server
     * @param {Array} tags The list of S7Tag to read
     * @param {Array} values The list of value to write
     */
    write = (tags, values) => {
        let mySeqNumber = this.#nextSequenceNumber();
        let request = Uint8Array.from(S7Comm.writeRequest(tags, values, mySeqNumber));
        this.socket.write(request, (error) => {
            if (error) this.#onError(error);
            this.pendingRequests.push({                
                type: FunctionCode.Write,
                seqNumber: mySeqNumber,
                tags: tags,
                timeout: setTimeout(() => {
                    let err = new Error(`(${mySeqNumber}) Write timeout`);
                    this.#onError(er);
                }, this.rwtimeout)
            });
        });
    }

    /**
     * Analyse data received in socket buffer
     */
    #evaluateBuffer = (buffer) => {
        let responses = S7Comm.getResponses(buffer);
        responses.forEach(response => {
            
            try {
                // read response info            
                let type = response.type;
                let code = response.code;
                let seqNumber = response.seqNumber;
                let data = response.data;
                // common data
                let reqIndex, request, result;
                // manage response
                switch(code) {
                    case FunctionCode.RegisterSessionResp:
                        reqIndex = this.pendingRequests.findIndex(req => req.type == FunctionCode.RegisterSessionReq);
                        request = this.pendingRequests.splice(reqIndex, 1)[0];
                        // clear timeout
                        clearTimeout(request.timeout);
                        // get response info
                        result = S7Comm.registerSessionResponse(data);
                        if (result) this.#negotiatePDULengthRequest();
                        break;
                    case FunctionCode.OpenS7Connection:
                        reqIndex = this.pendingRequests.findIndex(req => req.type == code && req.seqNumber == seqNumber);
                        request = this.pendingRequests.splice(reqIndex, 1)[0];
                        // clear timeout
                        clearTimeout(request.timeout);
                        // get response info
                        result = S7Comm.negotiatePDULengthResponse(data);
                        // result == MAX PDU LENGTH
                        this.MAX_PDU_LENGTH = result;
                        if (result) this.#emitConnect(seqNumber);
                        break;
                    case FunctionCode.Read:
                        reqIndex = this.pendingRequests.findIndex(req => req.type == code && req.seqNumber == seqNumber);
                        request = this.pendingRequests.splice(reqIndex, 1)[0];
                        // clear timeout
                        clearTimeout(request.timeout);
                        // get response info
                        result = S7Comm.readResponse(request.tags, data);
                        this.#emitRead(seqNumber, result);
                        break;
                    case FunctionCode.Write:
                        reqIndex = this.pendingRequests.findIndex(req => req.type == code && req.seqNumber == seqNumber);
                        request = this.pendingRequests.splice(reqIndex, 1)[0];
                        // clear timeout
                        clearTimeout(request.timeout);
                        // get response info
                        result = S7Comm.writeResponse(request.tags, data);
                        this.#emitWrite(seqNumber, result);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                this.#onError(error);
            }
            
        });
    }

    #emitConnect = (seqNumber) => {
        this.emit('connect', seqNumber)
    }

    #emitRead = (seqNumber, result) => {
        this.emit('read', result, seqNumber);
    }

    #emitWrite = (seqNumber, result) => {
        this.emit('write', result, seqNumber);
    }

    /**
     * Emitted once the socket is fully closed. 
     * @param {string} hadError boolean which says if the socket was closed due to a transmission error
     */
    #onClose = (hadError) => {
        if (hadError) console.error("Socket closed with errors!");
        else console.warn("Scoket closed!");
    }

    /**
     * Emitted when a socket connection is successfully established
     */
    #onConnect = () => {
        console.info("Socket connected!");
        this.#registerSessionRequest();        
    }

    /**
     * Emitted when data is received
     * @param {Buffer|string} data data received
     */
    #onData = (data) => {
        console.info("New data received!");
        this.#evaluateBuffer(data);
    }

    /**
     * Emitted when the write buffer becomes empty
     */
    #onDrain = () => {
        console.info("Socket send buffer drained!");
    }

    /**
     * Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.
     */
    #onEnd = () => {
        console.warn("Socket closed by server");
    }

    /**
     * Emitted when an error occurs. 
     * The 'close' event will be called directly following this event.
     * @param {Error} error The error object
     */
    #onError = (error) => {
        console.error(error);
    }

    /**
     * Emitted after resolving the host name but before connecting. 
     * Not applicable to Unix sockets.
     * @param {Error} error The error object
     * @param {string} address The IP address.
     * @param {string|null} family The address type
     * @param {string} host The host name.
     */
    #onLookup = (error, address, family, host) => {
        console.warn(`Lookup: ${error}, ${address}, ${family}, ${host}, `);
    }

    /**
     * Emitted when a socket is ready to be used. 
     * Triggered immediately after 'connect'.
     */
    #onReady = () => {
        console.info("Socket is ready!");
    }

    /**
     * Emitted if the socket times out from inactivity. 
     * This is only to notify that the socket has been idle. 
     * The user must manually close the connection.
     */
    #onTimeout= () => {
        console.error("Socket timeout!");
    }
}

module.exports = {
    S7Socket
}