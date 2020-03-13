// logger
const pino = require('pino');
const logger = pino({ prettyPrint: true });

// libs
const events = require('events');
const net = require('net');



class s7tcp {
    
    //#region ctors

    constructor(ip, port, slot, rack, autoreconnect = 0, timeout = 0) {  
        this.ip = ip;
        this.port = port;
        this.slot = slot;
        this.rack = rack;
        this.autoreconnect = autoreconnect;
        this.timeout = timeout;

        this._alreadyConnected = false;
        this._autoriconnect();
    }

    //#endregion

    //#region methods

    init() {
        this.socket = new net.Socket();
        this.socket.setTimeout(this.timeout);
        this.socket.setKeepAlive(true, this.timeout);

        // managed events
        this.socket.on('connect', () => this.onConnect(this));
        this.socket.on('close', hadError => this.onClose(this, hadError));  
        this.socket.on('end', () => this.onEnd(this));
        this.socket.on('ready', () => this.onReady(this));
        this.socket.on('timeout', () => this.onTimeout(this));
        this.socket.on('error', err => this.onError(this, err));

        // custom events
        this.socket.on('registerSession', this.onRegisterSession.bind(this));
        this.socket.on('negotiatePDU', this.onNegotiatePDU.bind(this));
        this.socket.on('valuesRead', this.onValuesRead.bind(this));
        this.socket.on('valuesWritten', this.onValuesWritten.bind(this));     
    }

    dispose() {   
        this.socket.end();        
        this.socket.destroy(new Error('dispose'));
    }

    connect() {
        logger.info("Try to connect..");
        this.socket.connect(this.port, this.ip);
    }

    _autoriconnect() {        
        if (this.autoreconnect) {     
            if (this._alreadyConnected) {
                setTimeout(() => {            
                    this.init();
                    this.connect();
                }, this.autoreconnect);
            } else {
                this.init();
                this.connect();
                this._alreadyConnected = true;
            }                   
        } 
    }

    //#endregion

    //#region events

    onConnect(event) {
        logger.info("Connected!");
    }

    onClose(event, hadError) {
        logger.info("Close " + (hadError ? "with" : "without") + " errors!");
        this._autoriconnect();
    }

    onEnd(event) {
        logger.info("Ended!");
    }

    onReady(event) {
        logger.info("Ready!");
    }

    onTimeout(event) {
        logger.info("Timeout!");
        this.dispose();
    }

    onError(event, err) {
        logger.info("Errors: " + err.message);
        this.dispose();
    }

    onRegisterSession(event) {
        logger.info("Session registered!");
    }

    onNegotiatePDU(event) {
        logger.info("PDU negotiated!");
    }

    onValuesRead(event) {
        logger.info("Values read!");
    }
    
    onValuesWritten(event) {
        logger.info("Values written!");
    }

    //#endregion

}


// TEST PURPOSE
var plc = new s7tcp("192.168.1.91", 102, 0, 1, 10000, 60000);