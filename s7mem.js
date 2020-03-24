const events = require('events');
const util = require('util');
const s7comm = require("./s7comm");

/**
 * S7Mem Class provide a mechanism to cache locally a read-only Device memory copy
 */
class S7Mem extends events {   

    constructor(socket, db, areaCode, offset, refresh) {
        super();
        this.socket = socket;
        this.db = db;
        this.areaCode = areaCode;
        this.offset = offset;
        this.refresh = refresh;

        this.timestamp = new Date();
        this.quality = "never read";
        this.cache = new Array(s7comm.MAXREADBYTES).fill(0x00);

        this.socket.on('connect', this.socketConnected)
        this.socket.on('error', this.socketError)
        if (this.socket.connected()) 
            this.startGetData();
    }

    socketConnected = () => {
        this.emit("connect");
        this.startGetData();
    }

    startGetData = () => {
        this.running = true;
        this.getData();
    }

    stopGetData = () => {
        this.running = false;
        if (this.currentTimeout != null) clearTimeout(this.currentTimeout);
    }

    getData = () => {
        let start = Date.now();
        if (this.running)
        {   
            // JOB 
            let time = Date.now() - start;
            let timeToWait = this.refresh - time;
            if (timeToWait < 0) timeToWait = 0;
            console.log("SLEEP: " + timeToWait);
            this.currentTimeout = setTimeout(this.getData, this.refresh);
            this.currentTimeout = null;
        }
    }

    refreshBuffer = (data) => {
        try {
            this.timestamp = Date.now();
            this.quality = "good";
            this.cache = data.slice();
        } catch (err) {            
            this.onError(err.message);
        }
    }

    socketNotConnected = () => {
        this.onError("socket not connected");        
    }

    socketError = (error) => {
        this.onError(error.message);
    }

    onError = (message) => {
        this.stopGetData();
        this.timestamp = Date.now();
        this.quality = message;
        this.emit("badquality", this.quality);
    }

}

module.exports = S7Mem;