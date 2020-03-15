const s7comm = require("./s7comm");
const events = require('events');

module.exports = class S7Tag extends events{

    constructor(area, db, start, elements, len) {  
        super();
        this.area = area;
        this.db = db;
        this.start = start;
        this.elements = elements;
        this.len = len;
    }

}