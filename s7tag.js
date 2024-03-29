const events = require('events');
const util = require('util');
const ParameterArea = require("./enums/ParameterArea");
const DataType = require("./enums/DataType");
const ArrayUtils = require("./utils/array");

/**
 * S7Tag Class provide a safe mechanism to manage tags as S7 device needs.
 */
class S7Tag extends events {    

    /**
     * The S7Tag constructor
     * @param {number} db The DB number: only if areaCode is DB
     * @param {string} areaCode The string that represent the DataType (necessary)
     * @param {string} typeCode The string that represent the tag's value type (necessary)
     * @param {number} offset The address offset (necessary)
     * @param {number} bit The bit number: only if typeCode is B (byte) and the tag is a Bit
     * @param {number} array The array size or string length: cannot be used when type is Bit
     */
    constructor(symbol, db, areaCode, typeCode, offset, bit, array) {
        super();
        this.#symbol = symbol;
        this.#db = db != null ? parseInt(db) : null;
        this.#areaCode = areaCode != null ? areaCode.toUpperCase() : areaCode;
        this.#typeCode = typeCode != null ? typeCode.toUpperCase() : typeCode;
        this.#offset = offset != null ? parseInt(offset) : null;        
        this.#bit = bit != null ? parseInt(bit) : null; 
        this.#array = array != null ? parseInt(array) : null;

        // area, type and offset must setted!
        if (this.#areaCode == null || this.#typeCode == null || this.#offset == null) {
            let err = new Error("Invalid S7Path: area, type, offset must be always setted and bit must be in range 0-7!");
            throw err;
        }

        if (this.#typeCode == "X" && this.#bit == null) {
            let err = new Error("Invalid S7Path: bit must be set in BIT type");
            throw err;
        }

        // Id db has value then type must be DB!
        if (this.#db != null && this.#areaCode != "DB") {
            let err = new Error("Invalid S7Path: when define a DB the type must be 'DB' and not '" + this.#areaCode + "'");
            throw err;
        }         

        // bit and array cannot be both set!
        if (this.#bit!= null && this.#array!= null) {
            let err = new Error("Invalid S7Path: bit and array cannot be both set!");
            throw err;
        }

        // string must be define an array size!
        if (this.#typeCode == "S" && this.#array == null) {
            let err = new Error("Invalid S7Path: string must be define an array size (string len)!");
            throw err;
        }
    }

    /**
     * S7Tag string to print on console
     * @param {*} depth 
     * @param {*} opts 
     */
    [util.inspect.custom](depth, opts) {
        return this.path;
    }

    /**
     * From a well formatted path is possibile to define all S7Tag paramters
     * Sample:
     * DB10.DBR40[20] > { DB: 10, AreaCode: "DB", typeCode: "R" (real), offset: 40, bit: null, array: 20
     * @param {string} path the well formatted S7Tag's path
     * @returns S7Tag
     */
    static fromPath(symbol, path) {
        let re_db = "(db(?<db>[0-9]+).)?";
        let re_area = "(?<area>db{1}|m{1}|e{1}|a{1}){1}";
        let re_type = "(?<type>x{1}|b{1}|c{1}|w{1}|i{1}|r{1}|s{1}|ub{1}|ui{1}|dw{1}|di{1}|ud{1}){1}";
        let re_offset = "(?<offset>[0-9]+){1}";    
        let re_bit = "(.(?<bit>[0-7]{1})){1}"
        let re_array = "(\\[(?<array>[0-9]+)\\]){1}"
        let re_bit_array = "(" + re_bit + "|" + re_array + ")?";
        let re_end = "$"
        let re_db_area_type_offset = RegExp(re_db+re_area+re_type+re_offset+re_bit_array+re_end, "i");
        let match = path.match(re_db_area_type_offset);
        if (match) {
            let groups = match.groups;
            return new S7Tag(symbol, groups.db, groups.area, groups.type, groups.offset, groups.bit, groups.array);
        } else {
            return new S7Tag(symbol);
        }    
    }

    /**
     * Create a S7Tag instance using a config object
     * @param {object} config object with parameters like {"symbol":"Tag1", "path":"DB1.DBW10", .. }
     */
    static fromConfig(config) {
        try {
            let s7Tag = S7Tag.fromPath(config.symbol, config.path);
            return s7Tag;
        } catch(e) {
            let err = new Error("This config is not a valid config for S7tag.", e.message);
            throw err;
        }
    }

    /**
     * Return the tag's symbol
     * @returns {string} The tag's symbol
     */
    getSymbol() {
        return this.#symbol;
    }

    /**
     * Return the tag's db
     * @returns {numeric} The tag's db
     */
    getDB() {
        return this.#db;
    }

    /**
     * Return the tag's areaCode
     * @returns {string} The tag's areaCode
     */
    getAreaCode() {
        return this.#areaCode;
    }

    /**
     * Return the tag's typeCode
     * @returns {string} The tag's typeCode
     */
    getTypeCode() {
        return this.#typeCode;
    }

    /**
     * Return the tag's offset
     * @returns {numeric} The tag's offset
     */
    getOffset() {
        return this.#offset;
    }

    /**
     * Return the tag's offset
     * @returns {numeric} The tag's offset
     */
    getBit() {
        return this.#bit;
    }

    /**
     * Return the tag's array
     * @returns {numeric} The tag's array
     */
    getArray() {
        return this.#array;
    }
    
    /**
     * Return a well formatted tag's path
     * @returns {string} The tag's path
     */
    getPath() {
        let toRet = "";
        toRet += this.#db != null ? "DB" + this.#db + "." : "";
        toRet += this.#areaCode;
        toRet += this.#typeCode;
        toRet += this.#offset;
        toRet += this.#bit != null ? "." + this.#bit : "";
        toRet += this.#array != null ? "[" + this.#array + "]" : "";
        return toRet;
    }

    /**
     * From areaCode return the ParameterArea value
     * @returns {ParameterArea} The ParameterArea value
     */
    getParameterArea() {
        let dti = ParameterArea.Info[this.#areaCode].index;
        return dti;
    }

    /**
     * From typeCode return the DataType value
     * @returns {DataType} The DataType value
     */
    getDataType() {
        if (this.#bit) return DataType.Bit;
        let dti = DataType.Info[this.#typeCode].index;
        return dti;
    }

    /**
     * From typeCode return the DataType size in bits
     * @returns {numeric} The DataType size in bits
     */
    getBitsSize() {
        let bitsSize = DataType.Info[this.#typeCode].size(this.#array ? this.#array : 1);
        return bitsSize;
    }

    /**
     * From typeCode return the DataType size in bytes
     * @returns {numeric} The DataType size in bytes
     */
    getBytesSize() {
        let bitsSize = this.getBitsSize();
        return bitsSize / 8;
    }

    /**
     * From typeCode return the the defualt value
     * @returns {object} The default value for s7tag dataType
     */
    getDefault() {        
        let dv = DataType.Info[this.#typeCode].default;
        return dv;
    }

    /**
     * Convert an array of bytes to a value of typeCode
     * @param {Array} bytes Array of bytes representation of value
     * @returns {object} The value conversion
     */
    fromBytes(bytes) {
        let func = DataType.Info[this.#typeCode].fromBytes;
        if(this.#bit!=null) return func(bytes, this.#bit);
        if(this.#typeCode=="S") return func(bytes);        
        if (this.#array) {
            let ret = [];
            let len = this.bytesSize / this.#array;
            for(let i=0;i<this.#array;i++){
                let subBytes = bytes.slice((len*i), (len*i)+len)
                let item = func(subBytes);
                ret.push(item);
            }
            return ret;
        }
        return func(bytes);
    }

    /**
     * Convert a value of typeCode to an array of bytes
     * @param {object} value The value to convert
     * @returns {Array} The Array of bytes conversion
     */
    toBytes(value) {
        let func = DataType.Info[this.#typeCode].toBytes;
        if(this.#typeCode=="S") return func(value, this.#array);                
        if (this.#array) {
            let ret = [];
            for(let i=0;i<this.#array;i++){
                let buffer = func(value[i]);
                let itemArray = Array.prototype.slice.call(buffer, 0);
                ret = ret.concat(itemArray);                
            }
            return ret;
        }
        return func(value);        
    }

    /**
     * Tags sorter by Device memory position
     * @param {S7Tag} t1 First tag
     * @param {S7Tag} t2 Second tag
     * @returns {number} The sort result
     */
    static sorter(t1, t2) {
        // DB
        if (t1.getDB() != null && t2.getDB() == null) return -1;
        if (t1.getDB() == null && t2.getDB() != null) return 1;
        if (t1.getDB() != null && t2.getDB() != null && t1.getDB() != t2.getDB()) return t1.getDB() - t2.getDB(); // ascending
        // AREA
        if (t1.getAreaCode() < t2.getAreaCode()) return -1;
        if (t1.getAreaCode() > t2.getAreaCode()) return 1;
        // OFFSET
        if (t1.getOffset() < t2.getOffset()) return -1;
        if (t1.getOffset() > t2.getOffset()) return 1;
        // TYPE CODE
        if (t1.getTypeCode() < t2.getTypeCode()) return -1;
        if (t1.getTypeCode() > t2.getTypeCode()) return 1;
        // BIT
        if (t1.getBit() != null && t2.getBit() == null) return 1;
        if (t1.getBit() == null && t2.getBit() != null) return -1;
        if (t1.getBit() != null && t2.getBit() != null) return t1.getBit() - t2.getBit(); // ascending
        // ARRAY
        if (t1.getArray() != null && t2.getArray() == null) return -1;
        if (t1.getArray() == null && t2.getArray() != null) return 1;
        if (t1.getArray() != null && t2.getArray() != null) return t1.getArray() - t2.getArray(); // ascending
        // ELSE
        return 0;
    }

    /**
     * This function groups a list of tags by its areaCode
     * Sample use: let tagsAreaGroups = groupTagsByArea(tags);
     * Loop through groups: Object.keys(tagsAreaGroups).forEach(tagsArea => {
     *  let tagsInGroup = tagsAreaGroups[tagsArea];
     * }
     * 
     * @param {Array} tags Array of Tags
     * @returns {Object} Keys with grouped list of tags
     */
    static groupTagsByArea = ArrayUtils.groupBy(['areaCode', 'db']);

}

module.exports = S7Tag;