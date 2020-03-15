const s7comm = require("./s7comm");
const events = require('events');

module.exports = class S7Tag extends events{

    constructor(parArea, areaNumber, start, len, isBit) {  
        super();
        this.parArea = parArea;
        this.areaNumber = areaNumber;
        this.start = start;
        this.len = len;
        this.isBit = isBit;
    }

}