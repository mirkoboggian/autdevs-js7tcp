// Enums
const CPUType = require("./enums/CPUType");
const ErrorCode = require("./enums/ErrorCode");
const FunctionCode = require("./enums/FunctionCode");
const ParameterArea = require("./enums/ParameterArea");
const PDUType = require("./enums/PDUType");
const DataType = require("./enums/DataType");

// Enums exports
exports.CPUType = CPUType;
exports.ErrorCode = ErrorCode;
exports.FunctionCode = FunctionCode;
exports.ParameterArea = ParameterArea;
exports.PDUType = PDUType;
exports.DataType = DataType;

// Global scope constants
const MAX_PDU_LENGTH = 240;
const MAX_READ_BYTES = 222;
const MAX_WRITE_BYTES = 212;

if (Object.freeze)
    Object.freeze(MAX_PDU_LENGTH);
    Object.freeze(MAX_READ_BYTES);
    Object.freeze(MAX_WRITE_BYTES);

function _EIPHeader(dataLen) {
    // Header bytes
    let header = [];

    // set header
    header[0] = 0x03;
    header[1] = 0x00;
    // length: length of data attached to EIP header
    header[2] = Math.floor((0x04 + dataLen) / 0x100);
    header[3] = ((0x04 + dataLen) % 0x100);

    // Result
    return header;
}

function _COTPHeader() {
    // COTP bytes
    let cotp = [];

    // ...
    cotp[0] = 0x02;
    cotp[1] = 0xF0; // Connect on S7comm layer (s7comm.param.func = 0xf0, Setup communication)
    // ...
    cotp[2] = 0x80;

    // result
    return cotp;
}

function _PDUHeader(pduType, seqNumber, parsLen, dataLen) {
    // PDU bytes
    let pdu = [];

    // basic bytes
    pdu[0] = 0x32; // protocol identifier
    pdu[1] = pduType;
    pdu[2] = 0x00;
    pdu[3] = 0x00;
    pdu[4] = Math.floor(seqNumber / 0x100);
    pdu[5] = (seqNumber % 0x100);
    pdu[6] = Math.floor(parsLen / 0x100);
    pdu[7] = (parsLen % 0x100);
    pdu[8] = Math.floor(dataLen / 0x100);
    pdu[9] = (dataLen % 0x100);

    // add bytes only if ..
    if (pduType == PDUType.Unknown || pduType == PDUType.Response)
    {
        pdu[10] = 0x00;
        pdu[11] = 0x00;
    }

    // results
    return pdu;
}

function _PDUParameters() {
        // pduPars bytes
        let pduPars = [];

        // ...
        pduPars[0] = 0xF0;
        pduPars[1] = 0x00;
        pduPars[2] = 0x00;
        pduPars[3] = 0x03;
        pduPars[4] = 0x00;
        pduPars[5] = 0x03;
        pduPars[6] = 0x01;
        pduPars[7] = 0x00;
    
        // result
        return pduPars;
}

function _RegisterSessionParameters(rack, slot) {
    // Session bytes
    let session = []; 

    // Packet length after this byte
    session[0] = 0x11;
    // TDPU Type CR = Connection Request (see RFC1006/ISO8073)
    session[1] = 0xE0;
    // TPDU Destination Reference (unknown)
    session[2] = 0x00;
    session[3] = 0x00;
    // TPDU Source-Reference
    session[4] = 0x00;
    session[5] = 0x2E; // OLD: 0x01;
    // TPDU Class 0 and no Option 
    session[6] = 0x00;

    // S7300 Only
    // Parameter Source-TSAP
    session[7] = 0xC1;
    // Length of this parameter 
    session[8] = 0x02;
    session[9] = 0x01;
    session[10] = 0x00;
    // Parameter Destination-TSAP
    session[11] = 0xC2;
    // Length of this parameter 
    session[12] = 0x02;
    // Communication Type: 1=PG Communication, 2=OP Communication, 3=Step7Basic Communication
    session[13] = 0x03;
    // Slot - Rack (ISO over TCP)
    session[14] = (rack * 2 * 16 + slot);

    // Parameter requested TPDU-Size
    session[15] = 0xC0;
    // Length of this parameter 
    session[16] = 0x01;
    // requested TPDU-Size 8=256 Bytes, 9=512 Bytes 
    session[17] = 0x09;

    // Result
    return session;
}

function _ReadParameters(parArea, areaNumber, start, len, isBit) {
    // ReadPars bytes
    let readPars = []; 

    // ...
    readPars[0] = FunctionCode.Read;
    readPars[1] = 0x01;
    readPars[2] = 0x12;
    readPars[3] = 0x0A;
    readPars[4] = 0x10;
    switch (parArea)
    {
        case ParameterArea.S7200AnalogInput:
        case ParameterArea.S7200AnalogOutput:
            readPars[5] = DataType.Word;
            start *= 8;
            break;
        case ParameterArea.S7Timer:
        case ParameterArea.S7Counter:
        case ParameterArea.S7200Timer:
        case ParameterArea.S7200Counter:
            readPars[5] = parArea;
            break;
        default:
            readPars[5] = (isBit ? DataType.Bit : DataType.Byte);
            start *= (isBit) ? 1 : 8;
            break;
    }
    // length in bytes
    readPars[6] = Math.floor(len / 0x100);
    readPars[7] = (len % 0x100);
    // DB Number
    readPars[8] = Math.floor(areaNumber / 0x100);
    readPars[9] = (areaNumber % 0x100);
    // Area Code
    readPars[10] = parArea;
    // Start address in bits
    readPars[11] = Math.floor(start / 0x10000);
    readPars[12] = Math.floor(start / 0x100);
    readPars[13] = (start % 0x100);

    // Result
    return readPars;
}

function _WriteParameters(parArea, areaNumber, start, isBit, valuesLen) {
    // WritePars bytes
    let writePars = [];

    //..
    writePars[0] = FunctionCode.Write;
    writePars[1] = 0x01;
    writePars[2] = 0x12;
    writePars[3] = 0x0A;
    writePars[4] = 0x10;

    switch (parArea)
    {
        case ParameterArea.S7200AnalogInput:
        case ParameterArea.S7200AnalogOutput:
            writePars[5] = DataType.Word;
            writePars[6] = Math.floor(((valuesLen + 1) / 2) / 0x100);
            writePars[7] = (((valuesLen + 1) / 2) % 0x100);
            break;
        case ParameterArea.S7Timer:
        case ParameterArea.S7Counter:
        case ParameterArea.S7200Timer:
        case ParameterArea.S7200Counter:
            writePars[5] = area;
            writePars[6] = Math.floor(((valuesLen+ 1) / 2) / 0x100);
            writePars[7] = (((valuesLen+ 1) / 2) % 0x100);
            break;
        default:
            writePars[5] = (isBit ? DataType.Bit : DataType.Byte);
            writePars[6] = Math.floor(valuesLen / 0x100);
            writePars[7] = (valuesLen % 0x100);
            break;
    }

    // DB Number
    writePars[8] = Math.floor(areaNumber / 0x100);
    writePars[9] = (areaNumber % 0x100);
    // Area Code
    writePars[10] = parArea;
    // Start address in bits
    writePars[11] = Math.floor(start * 0x08 / 0x10000);
    writePars[12] = Math.floor(start * 0x08 / 0x100);
    writePars[13] = (start * 0x08 % 0x100);

    // Result
    return writePars;
}

function _WriteValuesHeader(valuesLen) {
    // Values Header Bytes
    let valHeader = [];

    //..
    valHeader[0] = 0x00;
    valHeader[1] = 0x04;
    valHeader[2] = Math.floor(valuesLen * 8 / 0x100);
    valHeader[3] = (valuesLen* 8 % 0x100);

    // Result
    return valHeader;
}

function _WriteValues(values) {
    // Only Even bytes of values
    if (values.length % 2 == 1)
    {
        values.push(0x00);
    }

    // Result
    return values;
}

exports.RegisterSessionRequest = (rack, slot) => {
    let regSessionPars = _RegisterSessionParameters(rack, slot);
    let eipHeader = _EIPHeader(regSessionPars.length);
    return eipHeader.concat(regSessionPars);
}

exports.NegotiatePDULengthRequest = () => {
    let pduPars = _PDUParameters();
    let pduReference = 65535;
    let pduHeader = _PDUHeader(PDUType.Request, pduReference, pduPars.length, 0);
    let cotpHeader = _COTPHeader();
    let eipHeader = _EIPHeader(cotpHeader.length + pduHeader.length + pduPars.length);
    return eipHeader.concat(cotpHeader).concat(pduHeader).concat(pduPars);
}

exports.ReadRequest = (parArea, areaNumber, start, len, isBit) => {
    let readPars =  _ReadParameters(parArea, areaNumber, start, len, isBit);
    let pduHeader = _PDUHeader(PDUType.Request, 0, readPars.length, 0);
    var cotpHeader = _COTPHeader();
    var eipHeader = _EIPHeader(cotpHeader.length + pduHeader.length + readPars.length);
    return eipHeader.concat(cotpHeader).concat(pduHeader).concat(readPars);
}

exports.WriteRequest = (parArea, areaNumber, start, len, isBit, values) => {
    let writeValues = _WriteValues(values);
    let writeHeader = _WriteValuesHeader(writeValues.length);
    let writePars = _WriteParameters(parArea, areaNumber, start, isBit, writeValues.length);
    let pduHeader = _PDUHeader(PDUType.Request, 0, writePars.length, writeHeader.length + writeValues.length);
    var cotpHeader = _COTPHeader();
    var eipHeader = _EIPHeader(cotpHeader.length + pduHeader.length + writePars.length + writeHeader.length + writeValues.length);
    return eipHeader.concat(cotpHeader).concat(pduHeader).concat(writePars).concat(writeHeader).concat(writeValues);
}


/* SAMPLES */
// console.log(RegisterSessionRequest(0, 2));
// console.log(NegotiatePDULengthRequest());
// console.log(ReadRequest(ParameterArea.DB, 1, 0, 100, false));
// console.log(WriteRequest(ParameterArea.DB, 1, 0, 10, false, [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A]));