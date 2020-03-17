// helpers functions
const get8BitSize = (len=1) => { return 8 * len }
const get16BitSize = (len=1) => { return 16 * len }
const get32BitSize = (len=1) => { return 32 * len }
const getStringSize = (len=1) => { return 8 * len + 2}

var DataType = {
    // S7 type protocol
    Bit: 0x01,
    Byte: 0x02,
    UByte: 0x02,
    Char: 0x03,
    Word: 0x04,
    Int: 0x05,
    UInt: 0x05,
    DWord: 0x06,
    DInt: 0x06,
    UDInt: 0x06,
    Real: 0x06,            
    Counter: 0x1C,
    Timer: 0x1D,
    String: 0xFF, // NOT DEFINE IN S7 PROTOCOL
    // Utils
    Info: {
      "%": {index: 0x01, name: "Bit", size: get8BitSize, default: 0x00}, // S7 sends 1 byte per bit
      "B": {index: 0x02, name: "Byte", size: get8BitSize, default: 0x00},
      "UB": {index: 0x02, name: "UByte", size: get8BitSize, default: 0x00},
      "C": {index: 0x03, name: "Char", size: get8BitSize, default: ''},
      "W": {index: 0x04, name: "Word", size: get16BitSize, default: 0},
      "I": {index: 0x05, name: "Int", size: get16BitSize, default: 0},
      "UI": {index: 0x05, name: "UInt", size: get16BitSize, default: 0},
      "DW": {index: 0x06, name: "DWord", size: get32BitSize, default: 0},
      "DI": {index: 0x06, name: "DInt", size: get32BitSize, default: 0},
      "UD": {index: 0x06, name: "UDInt", size: get32BitSize, default: 0},
      "R": {index: 0x06, name: "Real", size: get32BitSize, default: 0.0},           
      "CN": {index: 0x1C, name: "Counter", size: get16BitSize, default: null},
      "TM": {index: 0x1D, name: "Timer", size: get16BitSize, default: null},
      "S": {index: 0xFF, name: "String", size: getStringSize, default: ""}, 
    }
};

if (Object.freeze)
  Object.freeze(DataType);

module.exports = DataType;
