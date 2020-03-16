/*
Sample: how to reference to BitSize
console.log(DataType.BitSize[DataType.Word].value);
*/

var DataType = {
    Bit: 0x01,
    Byte: 0x02,
    Char: 0x03,
    Word: 0x04,
    Int: 0x05,
    DWord: 0x06,
    DInt: 0x07,
    Real: 0x08,
    UByte: 0x09, // NOT DEFINE IN PROTOCOL
    UInt: 0x0A, // NOT DEFINE IN PROTOCOL
    UDInt: 0x0B, // NOT DEFINE IN PROTOCOL
    String: 0x0C, // NOT DEFINE IN PROTOCOL
    Counter: 0x1C,
    Timer: 0x1D,
    Info: {
      "%": {index: 0x01, name: "Bit", size: 1},
      "B": {index: 0x02, name: "Byte", size: 8},
      "C": {index: 0x03, name: "Char", size: 8},
      "W": {index: 0x04, name: "Word", size: 16},
      "I": {index: 0x05, name: "Int", size: 16},
      "DW": {index: 0x06, name: "DWord", size: 32},
      "DI": {index: 0x07, name: "DInt", size: 32},
      "R": {index: 0x08, name: "Real", size: 32},
      "UB": {index: 0x09, name: "UByte", size: 8}, 
      "UI": {index: 0x0A, name: "UInt", size: 16},
      "UD": {index: 0x0B, name: "UDInt", size: 32}, 
      "S": {index: 0x0C, name: "String", size: 8}, 
      "CN": {index: 0x1C, name: "Counter", size: 16},
      "TM": {index: 0x1D, name: "Timer", size: 16},
    }
};

if (Object.freeze)
  Object.freeze(DataType);

module.exports = DataType;