const s7comm = require("./s7comm");
const events = require('events');

module.exports = class S7Tag extends events {

    constructor(db, areaCode, typeCode, offset, bit, array) {
        super(); 
        this.db = db;
        this.areaCode = areaCode ? areaCode.toUpperCase() : areaCode;
        this.typeCode = typeCode ? typeCode.toUpperCase() : typeCode;
        this.offset = offset;
        this.bit = bit;
        this.array = array;

        // area, type and offset must setted!
        if (!this.areaCode || !this.typeCode || !this.offset) {
            let err = new Error("Invalid S7Path: area, type, offset must be always setted and bit must be in range 0-7!");
            throw err;
        }

        // Id db has value then type must be DB!
        if (this.db && this.areaCode != "DB") {
            let err = new Error("Invalid S7Path: when define a DB the type must be 'DB' and not '" + this.areaCode + "'");
            throw err;
        } 

        // Can access bits only from Byte type
        if (this.bit && this.typeCode != "B") {
            let err = new Error("Invalid S7Path: %bit must be an 'B' and not a '" + this.typeCode + "'");
            throw err;
        }

        // Id db has value then type must be DB!
        if (this.bit && this.array) {
            let err = new Error("Invalid S7Path: bit and array cannot be both set!");
            throw err;
        }

        // Id db has value then type must be DB!
        if (this.typeCode == "S" && !this.array) {
            let err = new Error("Invalid S7Path: string must be define an array size (string len)!");
            throw err;
        }

        this.path = this.getPath();
        this.parameterArea = this.getParameterArea();
        this.dataType = this.getDataType();
        this.bitsSize = this.getBitsSize();
        this.bytesSize = this.getBytesSize();
    }

    static fromPath(path) {
        let re_db = "(db(?<db>[0-9]+).)?";
        let re_area = "(?<area>db{1}|m{1}|e{1}|a{1}){1}";
        let re_type = "(?<type>b{1}|c{1}|w{1}|i{1}|r{1}|s{1}|ub{1}|ui{1}|dw{1}|di{1}|ud{1}){1}";
        let re_offset = "(?<offset>[0-9]+){1}";    
        let re_bit = "(.%(?<bit>[0-7]{1})){1}"
        let re_array = "(\\[(?<array>[0-9]+)\\]){1}"
        let re_bit_array = "(" + re_bit + "|" + re_array + ")?";
        let re_end = "$"
        let re_db_area_type_offset = RegExp(re_db+re_area+re_type+re_offset+re_bit_array+re_end, "i");
        let match = path.match(re_db_area_type_offset);
        if (match) {
            let groups = match.groups;
            return new S7Tag(groups.db, groups.area, groups.type, groups.offset, groups.bit, groups.array);
        } else {
            return new S7Tag();
        }    
    }

    getPath() {
        let toRet = "";
        toRet += this.db ? "DB" + this.db + "." : "";
        toRet += this.areaCode;
        toRet += this.typeCode;
        toRet += this.offset;
        toRet += this.bit ? ".%" + this.bit : "";
        toRet += this.array ? "[" + this.array + "]" : "";
        return toRet;
    }

    getParameterArea() {
        let dti = s7comm.ParameterArea.Info[this.areaCode].index;
        return dti;
    }

    getDataType() {
        if (this.bit) return s7comm.DataType.Bit;
        let dti = s7comm.DataType.Info[this.typeCode].index;
        return dti;
    }

    getBitsSize() {        
        if (this.typeCode == "S") 
            return s7comm.DataType.Info[this.typeCode].size * this.array + 16; // max length (b1) and length (b2)
        return this.array ? 
            s7comm.DataType.Info[this.typeCode].size * this.array : 
            s7comm.DataType.Info[this.typeCode].size;
    }

    getBytesSize() {        
        return this.getBitsSize() / 8;
    }
}