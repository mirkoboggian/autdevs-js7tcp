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
    Counter: 0x1C,
    Timer: 0x1D,
    BitSize: {
      0x01: {name: "Bit", value: 1},
      0x02: {name: "Byte", value: 8},
      0x03: {name: "Char", value: 8},
      0x04: {name: "Word", value: 16},
      0x05: {name: "Int", value: 16},
      0x06: {name: "DWord", value: 32},
      0x07: {name: "DInt", value: 32},
      0x08: {name: "Real", value: 32},
      0x1C: {name: "Counter", value: 16},
      0x1D: {name: "Timer", value: 16},
    }
};

if (Object.freeze)
  Object.freeze(DataType);

module.exports = DataType;