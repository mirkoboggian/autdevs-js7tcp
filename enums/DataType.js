/*
Sample: how to reference to BitSize
console.log(DataType.BitSize[DataType.Word].value);
*/

var DataType = {
    Bit: 0x01,
    Byte: 0x02,
    Word: 0x04,
    DWord: 0x08,
    BitSize: {
      0x01: {name: "Bit", value: 1},
      0x02: {name: "Byte", value: 8},
      0x04: {name: "Word", value: 16},
      0x08: {name: "DWord", value: 32}
    }
};

if (Object.freeze)
  Object.freeze(DataType);

module.exports = DataType;