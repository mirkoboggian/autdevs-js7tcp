var ErrorCode = {
    NoError: 0,
    WrongCPU_Type: 1,
    ConnectionError: 2,
    IPAdressNotAvailable: 3,
    WrongVarFormat: 10,
    WrongNumberReceivedBytes: 11,
    SendData: 20,
    ReadData: 30,
    WriteData: 50
};

if (Object.freeze)
  Object.freeze(ErrorCode);

module.exports = ErrorCode;