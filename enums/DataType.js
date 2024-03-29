// helpers functions

// Size
const get8BitSize = (len) => { return 8 * len; }
const get16BitSize = (len) => { return 16 * len; }
const get32BitSize = (len) => { return 32 * len; }
const getStringSize = (len) => { return 8 * (len + 2);}

//#region Null
const RetNull = () => {return null}
//#endregion

//#region bits utils
const ClearBit = (byte, bit) => {
  const mask = ~(1 << bit);
  return byte & mask;
}
const SetBit = (byte, bit) => {
  return byte | (1 << bit);
}
//#endregion

//#region Conversions to Bytes
const BitToBytes = (val) => {
  let ret = val? [0x01]: [0x00];
  return ret;
}
const ByteToBytes = (val) => {
  let buf = new Buffer.alloc(1);
  buf[0] = val;
  return Array.from(buf);
};
const CharToBytes = (val) => {
  let buf = new Buffer.alloc(1);
  let ret = buf.write(val);
  return Array.from(buf);
};
const WordToBytes = (val) => {
  let buf = new Buffer.alloc(2);
  let ret = buf.writeInt16BE(val);
  return Array.from(buf);
};
const IntToBytes = (val) => {
  let buf = new Buffer.alloc(2);
  let ret = buf.writeInt16BE(val);
  return Array.from(buf);
};
const UIntToBytes = (val) => {
  let buf = new Buffer.alloc(2);
  let ret = buf.writeUInt16BE(val);
  return Array.from(buf);
};
const DWordToBytes = (val) => {
  let buf = new Buffer.alloc(2);
  let ret = buf.writeInt32(val);
  return Array.from(buf);
};
const DIntToBytes = (val) => {
  let buf = new Buffer.alloc(4);
  let ret = buf.writeInt32BE(val);
  return Array.from(buf);
};
const UDIntToBytes = (val) => {
  let buf = new Buffer.alloc(4);
  let ret = buf.writeUInt32BE(val);
  return Array.from(buf);
};
const RealToBytes = (val) => {  
  let buf = new Buffer.alloc(4);
  let ret = buf.writeFloatBE(val);
  return Array.from(buf);
};
const StringToBytes = (val, maxLen) => {
  let len = maxLen + 2;
  let buf = Buffer.alloc(len);
  buf[0] = maxLen;
  buf[1] = val.length;  
  let strBytes = Buffer.from(val, 'utf8');
  strBytes.copy(buf, 2);
  return Array.from(buf);
};
//#endregion

//#region Bytes to Type
const BytesToBit = (val) => {
  let ret = Boolean(val[0]);
  return ret;
}
const BytesToByte = (array) => {
  return array[0];
};
const BytesToChar = (array) => {
  let buf = Buffer.from(array);
  let ret = buf.toString();
  return ret;
};
const BytesToWord = (array) => {
  let buf = Buffer.from(array);
  let ret = buf.readInt16BE();
  return ret;
};
const BytesToInt = (array) => {
  let buf = Buffer.from(array);
  let ret = buf.readInt16BE();
  return ret;
};
const BytesToUInt = (array) => {
  let buf = Buffer.from(array);
  let ret = buf.readUInt16BE();
  return ret;
};
const BytesToDWord = (array) => {
  let buf = Buffer.from(array);
  let ret = buf.readInt32BE();
  return ret;
};
const BytesToDInt = (array) => {
  let buf = Buffer.from(array);
  let ret = buf.readInt32BE();
  return ret;
};
const BytesToUDInt = (array) => {
  let buf = Buffer.from(array);
  let ret = buf.readUInt32BE();
  return ret;
};
const BytesToReal = (array) => {
  let buf = Buffer.from(array);
  let ret = buf.readFloatBE();
  return ret;
};
const BytesToString = (array) => {
  let maxLen = array[0];
  let len = array[1];  
  let strBuf = Buffer.from(array.slice(2, array.length));
  let buf = new Buffer.alloc(maxLen);
  strBuf.copy(buf, 0);
  let ret = strBuf.toString('utf8');
  return ret;
};
//#endregion

var DataType = {
    // S7 type protocol
    Bit: 0x01,
    Byte: 0x02,
    UByte: 0x02,
    Char: 0x03,
    Word: 0x04,
    Int: 0x05,
    UInt: 0x06,
    DWord: 0x06,
    DInt: 0x07,
    UDInt: 0x07,
    Real: 0x08,            
    Counter: 0x1C,
    Timer: 0x1D,
    String: 0xFF, // NOT DEFINED IN S7 PROTOCOL
    // Utils
    Info: {
      "X":  {index: 0x01, name: "Bit",      size: get8BitSize,    toBytes: BitToBytes,    fromBytes: BytesToBit,     default: 0x00  }, // S7 sends 1 byte per bit
      "B":  {index: 0x02, name: "Byte",     size: get8BitSize,    toBytes: ByteToBytes,   fromBytes: BytesToByte,    default: 0x00  },
      "UB": {index: 0x02, name: "UByte",    size: get8BitSize,    toBytes: ByteToBytes,   fromBytes: BytesToByte,    default: 0x00  },
      "C":  {index: 0x03, name: "Char",     size: get8BitSize,    toBytes: CharToBytes,   fromBytes: BytesToChar,    default: ''    },
      "W":  {index: 0x04, name: "Word",     size: get16BitSize,   toBytes: WordToBytes,   fromBytes: BytesToWord,    default: 0     },
      "I":  {index: 0x05, name: "Int",      size: get16BitSize,   toBytes: IntToBytes,    fromBytes: BytesToInt,     default: 0     },
      "UI": {index: 0x05, name: "UInt",     size: get16BitSize,   toBytes: UIntToBytes,   fromBytes: BytesToUInt,    default: 0     },
      "DW": {index: 0x06, name: "DWord",    size: get32BitSize,   toBytes: DWordToBytes,  fromBytes: BytesToDWord,   default: 0     },
      "DI": {index: 0x07, name: "DInt",     size: get32BitSize,   toBytes: DIntToBytes,   fromBytes: BytesToDInt,    default: 0     },
      "UD": {index: 0x07, name: "UDInt",    size: get32BitSize,   toBytes: UDIntToBytes,  fromBytes: BytesToUDInt,   default: 0     },
      "R":  {index: 0x08, name: "Real",     size: get32BitSize,   toBytes: RealToBytes,   fromBytes: BytesToReal,    default: 0.0   },           
      "CN": {index: 0x1C, name: "Counter",  size: get16BitSize,   toBytes: RetNull,       fromBytes: RetNull,        default: null  },
      "TM": {index: 0x1D, name: "Timer",    size: get16BitSize,   toBytes: RetNull,       fromBytes: RetNull,        default: null  },
      "S":  {index: 0xFF, name: "String",   size: getStringSize,  toBytes: StringToBytes, fromBytes: BytesToString,  default: ""    }, 
    }
};

if (Object.freeze)
  Object.freeze(DataType);

module.exports = DataType;