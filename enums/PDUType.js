var PDUType = {
    Request: 0x01,
    Unknown: 0x02,
    Response: 0x03,
    UserData: 0x07,
};

if (Object.freeze)
  Object.freeze(PDUType);

module.exports = PDUType;