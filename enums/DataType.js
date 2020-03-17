/*
Sample: how to reference to BitSize
console.log(DataType.BitSize[DataType.Word].value);
*/

var DataType = {
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
    String: 0xFF, // NOT DEFINE IN PROTOCOL
    Info: {
      "%": {index: 0x01, name: "Bit", size: 8}, // S7 sends 1 byte per bit
      "B": {index: 0x02, name: "Byte", size: 8},
      "UB": {index: 0x02, name: "UByte", size: 8},
      "C": {index: 0x03, name: "Char", size: 8},
      "W": {index: 0x04, name: "Word", size: 16},
      "I": {index: 0x05, name: "Int", size: 16},
      "UI": {index: 0x05, name: "UInt", size: 16},
      "DW": {index: 0x06, name: "DWord", size: 32},
      "DI": {index: 0x06, name: "DInt", size: 32},
      "R": {index: 0x06, name: "Real", size: 32},
      "UD": {index: 0x06, name: "UDInt", size: 32},              
      "CN": {index: 0x1C, name: "Counter", size: 16},
      "TM": {index: 0x1D, name: "Timer", size: 16},
      "S": {index: 0xFF, name: "String", size: 8}, 
    }
};

if (Object.freeze)
  Object.freeze(DataType);

module.exports = DataType;