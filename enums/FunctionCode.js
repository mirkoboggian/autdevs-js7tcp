var FunctionCode = {
    RegisterSessionResp: 0xD0,
    RegisterSessionReq: 0xE0,
    OpenS7Connection: 0xF0,
    Read: 0x04,
    Write: 0x05,
    RequestDownload: 0x1A,
    DownloadBlock: 0x1B,
    DownloadEnded: 0x1C,
    StartUpload: 0x1D,
    Upload: 0x1E,
    EndUpload: 0x1F,
    InsertBlock: 0x28
};

if (Object.freeze)
  Object.freeze(FunctionCode);

module.exports = FunctionCode;