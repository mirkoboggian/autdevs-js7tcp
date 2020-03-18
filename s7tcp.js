const S7Socket = require('./s7socket');
const S7Tag = require('./s7tag');
const fs = require('fs');
const events = require('events');

module.exports = class S7Tcp extends events{

    constructor(name, ip = "127.0.0.1", port = 102, rack = 0, slot = 2, 
                autoreconnect = 10000, timeout = 60000, rwTimeout = 5000,
                tasks = [], tags = []) {  
        
        super();        

        this.name = name;
        this.ip = ip;
        this.port = port;
        this.rack = rack;
        this.slot = slot;
        this.autoreconnect = autoreconnect;
        this.timeout = timeout;
        this.rwTimeout = rwTimeout; 
        this.task = tasks;
        this.tags = tags;

        this.socket = new S7Socket(this.ip, this.port, this.rack, this.slot, this.autoreconnect, this.timeout, this.rwTimeout);
        this.socket.on('connect', () => this._onConnect());
        this.socket.on('read', (result) => this._onRead(result));
        this.socket.on('write', (result) => this._onWrite(result));
        this.socket.on('multiRead', (result) => this._onMultiRead(result));
        this.socket.on('multiWrite', (result) => this._onMultiWrite(result));
        this.socket.on('error', (error) => this._onError(error));
        
    }

    static fromConfigJSON(configPath) {

        if (!fs.existsSync(configPath)) {
            let err = new Error("config.json " + configPath + " not found.");
            throw err;
        }        

        // read JSON
        let jsonFile = fs.readFileSync(configPath);
        let config = {};
        try {
            config = JSON.parse(jsonFile);
        } catch (e) {            
            console.error("There was a problem reading your config.json file.");
            console.error("Please try pasting your config.json file here to validate it: http://jsonlint.com");
            throw e;
        }
                    
        try {
            // create S7 reference
            let tags = [], tasks = [];

            // Create PLC Socket
            let plc = new S7Tcp(config.name, config.ip, config.port, config.rack, 
                config.slot, config.autoreconnect, config.timeout, config.rwTimeout, 
                tasks, tags);

            // Create Tags
            config.tags.forEach((tagConf) => {
                let s7tag = S7Tag.fromPath(tagConf.path);
                tags.push({config: tagConf, tag: s7tag });
            });
                        
            // Create Task
            config.tasks.forEach((taskConf) => {
                let intervallTask = setInterval((conf) => {
                    if (plc.connected()) {
                        console.log("TASK: " + conf.msCycle);
                    }                    
                }, taskConf.msCycle, taskConf);
                tasks.push(intervallTask);
            });

            // return device
            return plc;
        } catch(e) {
            console.error("Verify your config.json file.");
            console.error("Some parameters are incorrect.");
            throw e;
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