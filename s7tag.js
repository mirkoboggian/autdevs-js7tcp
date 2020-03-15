const s7comm = require("./s7comm");
const events = require('events');

module.exports = class S7Tag extends events{

    constructor(parArea, areaNumber, start, len, isBit) {  
        super();
        this.parArea = parArea;
        this.areaNumber = areaNumber;
        this.dataType = 
        this.start = start;
        this.len = len;
        this.isBit = isBit;
    }

    static getDataType(char) {
        switch(char.toLowerCase())
        {
            case 'b':
                return s7comm.DataType.Bit;
            case 'w':
                return s7comm.DataType.Word;
            case 'd':
                return s7comm.DataType.DWord;
        }
    }

    static fromPath(path) {        

        const re_db = /^db(\d+).db([bwd])(\d+)(\[(\d+)\])?$/i;
        const re_dbx = /^db(\d+).db([bwd])(\d+).%([0-7])$/i;
        const re_m = /^m([bwd])(\d+)(\[(\d+)\])?$/i;
        const re_mx = /^m([bwd])(\d+).%([0-7])$/i;
        const re_e = /^e([bwd])(\d+)(\[(\d+)\])?$/i;
        const re_ex = /^e([bwd])(\d+).%([0-7])$/i;
        const re_a = /^a([bwd])(\d+)(\[(\d+)\])?$/i;
        const re_ax = /^a([bwd])(\d+).%([0-7])$/i;

        if (re_db.test(path)){
            let match = path.match(re_db);
            console.log(match);
        } else if (re_dbx.test(path)) {
            let match = path.match(re_dbx);
            console.log(match);
        } else if (re_m.test(path)) {
            let match = path.match(re_m);
            console.log(match);
        } else if (re_mx.test(path)) {
            let match = path.match(re_mx);
            console.log(match);
        } else if (re_e.test(path)) {
            let match = path.match(re_e);
            console.log(match);
        } else if (re_ex.test(path)) {
            let match = path.match(re_ex);
            console.log(match);
        } else if (re_a.test(path)) {
            let match = path.match(re_a);
            console.log(match);
        } else if (re_ax.test(path)) {            
            let match = path.match(re_ax);
            console.log(match);
        } else {
            // invalid path
            let err = new Error("Invalid path for S7 tag");
            throw err;
        }
        
        return new S7Tag();
    }

}