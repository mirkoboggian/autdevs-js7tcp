const s7comm = require("./s7comm");
const events = require('events');

module.exports = class S7Tag extends events {

    constructor(db, areaCode, typeCode, offset, bit, array, value = null) {
        super(); 
        this.db = parseInt(db);
        this.areaCode = areaCode ? areaCode.toUpperCase() : areaCode;
        this.typeCode = typeCode ? typeCode.toUpperCase() : typeCode;
        this.offset = parseInt(offset);
        this.bit = parseInt(bit);
        this.array = parseInt(array);

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
        let bitsSize = s7comm.DataType.Info[this.typeCode].size(this.array);
        return bitsSize;
    }

    getBytesSize() {
        let bitsSize = this.getBitsSize();
        return bitsSize / 8;
    }

    getDefault() {        
        let dv = s7comm.DataType.Info[this.typeCode].default;
        return dv;
    }

    fromBytes(bytes) {
        let func = s7comm.DataType.Info[this.typeCode].fromBytes;        
        if(this.typeCode=="S") return func(bytes);
        if (this.array) {
            let ret = [];
            let len = this.bytesSize / this.array;
            for(let i=0;i<this.array;i++){
                let subBytes = bytes.slice((len*i), (len*i)+len)
                let item = func(subBytes);
                ret.push(item);
            }
            return ret;
        }
        return func(bytes);
    }

    toBytes(value) {
        let func = s7comm.DataType.Info[this.typeCode].toBytes;
        if(this.typeCode=="S") return func(value, this.array);                
        if (this.array) {
            let ret = [];
            for(let i=0;i<this.array;i++){
                let buffer = func(value[i]);
                let itemArray = Array.prototype.slice.call(buffer, 0);
                ret = ret.concat(itemArray);                
            }
            return ret;
        }
        return func(value);        
    }
}