var ErrorCode = {
    NoError: 0x00,
    WrongCPU_Type: 0x01,
    ConnectionError: 0x02,
    IPAdressNotAvailable: 0x03,
    AddressOutOfRange: 0x05,
    InvalidTransportSize: 0x06,
    WriteDataSizeMismatch: 0x07,
    WrongVarFormat: 0x0A,
    WrongNumberReceivedBytes: 0x0B,
    SendData: 20,
    ReadData: 30,
    WriteData: 50
};

if (Object.freeze)
  Object.freeze(ErrorCode);

module.exports = ErrorCode;