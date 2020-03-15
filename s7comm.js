/* SAMPLES */
// console.log(RegisterSessionRequest(0, 2));
// console.log(NegotiatePDULengthRequest());
// console.log(ReadRequest(ParameterArea.DB, 1, 0, 100, false));
// console.log(WriteRequest(ParameterArea.DB, 1, 0, 10, false, [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A]));

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

 // ISO Connection Request telegram (contains also ISO Header and COTP Header)
exports.RegisterSessionRequest = (rack, slot) => {
    // Consts
    const TPKTLen = 4;
    const COTPLen = 18;

    // Request
    let ret = [];
    // TPKT (RFC1006 Header)
    ret[0] = 0x03; // RFC 1006 ID (3) 
    ret[1] = 0x00; // Reserved, always 0
    ret[2] = Math.floor((TPKTLen + COTPLen) / 0x100); // High part of packet lenght (entire frame, payload and TPDU included)
    ret[3] = ((TPKTLen + COTPLen) % 0x100); // Low part of packet lenght (entire frame, payload and TPDU included)
    // COTP (ISO 8073 Header)
    ret[4] = 0x11, // PDU Size Length (Packet length after this byte)
    ret[5] = 0xE0, // CR - Connection Request ID (TDPU Type CR = Connection Request > see RFC1006/ISO8073)
    ret[6] = 0x00, // Dst Reference HI (TPDU Destination Reference (unknown))
    ret[7] = 0x00, // Dst Reference LO (TPDU Destination Reference (unknown))
    ret[8] = 0x00, // Src Reference HI  (TPDU Source-Reference)
    ret[9] = 0x01, // Src Reference LO (TPDU Source-Reference) > ? 0x01 - 0x2E
    ret[10] = 0x00, // Class + Options Flags (TPDU Class 0 and no Option)
    ret[11] = 0xC0, // PDU Max Length ID (Parameter requested TPDU-Size)
    ret[12] = 0x01, // PDU Max Length HI (Length of this parameter)
    ret[13] = 0x0A, // PDU Max Length LO (requested TPDU-Size 8=256 Bytes, 9=512 Bytes, 10=1024 Bytes)
    ret[14] = 0xC1, // Src TSAP Identifier (Parameter Source-TSAP)
    ret[15] = 0x02, // Src TSAP Length (2 bytes)
    ret[16] = 0x01, // Src TSAP HI > (will be overwritten) ???
    ret[17] = 0x00, // Src TSAP LO > (will be overwritten) ???
    ret[18] = 0xC2, // Dst TSAP Identifier (Parameter Destination-TSAP)
    ret[19] = 0x02, // Dst TSAP Length (2 bytes)
    ret[20] = 0x03, // Dst TSAP HI > Communication Type: 1=PG Communication, 2=OP Communication, 3=Step7Basic Communication
    ret[21] = (rack * 2 * 16 + slot)  // Dst TSAP LO > Slot - Rack (ISO over TCP)
    // Return
    return ret;
}

// S7 PDU Negotiation Telegram (contains also ISO Header and COTP Header)
exports.exports.NegotiatePDULengthRequest = () => {
    // Consts
    const TPKTLen = 4;
    const COTPLen = 3;
    const PDUHeaderLen = 10;
    const PUDParLen = 8;
    const DATALen = 0;
    const PDUType = PDUType.Request;
    const SEQNumber = 1024; // Sequence Number ??? 65535;
    const TOTALLen = TPKTLen + COTPLen + PDUHeaderLen + PUDParLen + DATALen;
    // Request
    let ret = [];
    // TPKT (RFC1006 Header)
    ret[0] = 0x03; // RFC 1006 ID (3) 
    ret[1] = 0x00; // Reserved, always 0
    ret[2] = Math.floor(TOTALLen / 0x100); // High part of packet lenght (entire frame, payload and TPDU included)
    ret[3] = (TOTALLen % 0x100); // Low part of packet lenght (entire frame, payload and TPDU included)
    // COTP (ISO 8073 Header)
    ret[4] = 0x02;
    ret[5] = 0xF0; // Connect on S7comm layer (s7comm.param.func = 0xf0, Setup communication)
    ret[6] = 0x80; 
    // PDU Header
    ret[7] = 0x32; // protocol identifier (S7)
    ret[8] = PDUType; // Job Type
    ret[9] = 0x00; // Redundancy identification (1)
    ret[10] = 0x00; // Redundancy identification (2)
    ret[11] = Math.floor(SEQNumber / 0x100);
    ret[12] = (SEQNumber % 0x100);
    ret[13] = Math.floor(PUDParLen / 0x100);
    ret[14] = (PUDParLen % 0x100);
    ret[15] = Math.floor(DATALen / 0x100);
    ret[16] = (DATALen % 0x100);
    // PDU Parameters
    ret[17] = 0xF0;
    ret[18] = 0x00;
    ret[19] = 0x00;
    ret[20] = 0x03;
    ret[21] = 0x00;
    ret[22] = 0x03;
    ret[23] = 0x00; // PDU Length Requested = HI-LO Here > 0x01
    ret[24] = 0x1E; // PDU Length Requested = HI-LO Here > 0x00
    // Return
    return ret;
}

// S7 Read Request Header (contains also ISO Header and COTP Header)
exports.exports.ReadRequest = (parArea, areaNumber, start, len, isBit) => {
    // Consts
    const TPKTLen = 4;
    const COTPLen = 3;
    const PDUHeaderLen = 10; // Request=10, Response=12
    const PUDParLen = 14; // Read parameter
    const DATALen = 0;
    const PDUType = PDUType.Request;
    const SEQNumber = 1280; // Sequence Number ??? 0;
    const TOTALLen = TPKTLen + COTPLen + PDUHeaderLen + PUDParLen + DATALen;
    // Request
    let ret = [];
    // TPKT (RFC1006 Header)
    ret[0] = 0x03; // RFC 1006 ID (3) 
    ret[1] = 0x00; // Reserved, always 0
    ret[2] = Math.floor(TOTALLen / 0x100); // High part of packet lenght (entire frame, payload and TPDU included)
    ret[3] = (TOTALLen % 0x100); // Low part of packet lenght (entire frame, payload and TPDU included)
    // COTP (ISO 8073 Header)
    ret[4] = 0x02;
    ret[5] = 0xF0; // Connect on S7comm layer (s7comm.param.func = 0xf0, Setup communication)
    ret[6] = 0x80; 
    // PDU Header
    ret[7] = 0x32; // protocol identifier (S7)
    ret[8] = PDUType; // Job Type
    ret[9] = 0x00; // Redundancy identification (1)
    ret[10] = 0x00; // Redundancy identification (2)
    ret[11] = Math.floor(SEQNumber / 0x100);
    ret[12] = (SEQNumber % 0x100);
    ret[13] = Math.floor(PUDParLen / 0x100);
    ret[14] = (PUDParLen % 0x100);
    ret[15] = Math.floor(DATALen / 0x100);
    ret[16] = (DATALen % 0x100);
    // Read Parameters
    ret[17] = FunctionCode.Read; // Function
    ret[18] = 0x01; // Items count (idx 18)
    ret[19] = 0x12; // Var spec.
    ret[20] = 0x0A; // Length of remaining bytes
    ret[21] = 0x10; // Syntax ID 
    // Transport Size
    switch (parArea)
    {
        case ParameterArea.S7200AnalogInput:
        case ParameterArea.S7200AnalogOutput:
            readPars[22] = DataType.Word;
            start *= 8;
            break;
        case ParameterArea.S7Timer:
        case ParameterArea.S7Counter:
        case ParameterArea.S7200Timer:
        case ParameterArea.S7200Counter:
            readPars[22] = parArea;
            break;
        default:
            readPars[22] = (isBit ? DataType.Bit : DataType.Byte);
            start *= (isBit) ? 1 : 8;
            break;
    }
    // Num Elements > length in bytes
    ret[23] = Math.floor(len / 0x100);
    ret[24] = (len % 0x100);
    // DB Number (if any, else 0) 
    ret[25] = Math.floor(areaNumber / 0x100);
    ret[26] = (areaNumber % 0x100);
    // Area Code
    ret[27] = parArea;
    // Start address in bits
    ret[28] = Math.floor(start / 0x10000);
    ret[29] = Math.floor(start / 0x100);
    ret[30] = (start % 0x100);
    // Return
    return ret;
}

// S7 Write Request Header (contains also ISO Header and COTP Header)
exports.exports.WriteRequest = (parArea, areaNumber, start, isBit, values) => {
    // Normalize values: Only Even bytes of values
    if (values.length % 2 == 1) values.push(0x00);
    // Consts
    const TPKTLen = 4;
    const COTPLen = 3;
    const PDUHeaderLen = 10; // Request=10, Response=12
    const PUDParLen = 18; // Write parameter (write header + write parameter)
    const DATALen = values.length;
    const PDUType = PDUType.Request;
    const SEQNumber = 1280; // Sequence Number ??? 0;
    // Request
    let ret = [];
    // TPKT (RFC1006 Header)
    ret[0] = 0x03; // RFC 1006 ID (3) 
    ret[1] = 0x00; // Reserved, always 0
    ret[2] = Math.floor((TPKTLen + COTPLen + PDUHeaderLen + PUDParLen + DATALen) / 0x100); // High part of packet lenght (entire frame, payload and TPDU included)
    ret[3] = ((TPKTLen + COTPLen + PDUHeaderLen + PUDParLen + DATALen) % 0x100); // Low part of packet lenght (entire frame, payload and TPDU included)
    // COTP (ISO 8073 Header)
    ret[4] = 0x02;
    ret[5] = 0xF0; // Connect on S7comm layer (s7comm.param.func = 0xf0, Setup communication)
    ret[6] = 0x80; 
    // PDU Header
    ret[7] = 0x32; // protocol identifier (S7)
    ret[8] = PDUType; // Job Type
    ret[9] = 0x00; // Redundancy identification (1)
    ret[10] = 0x00; // Redundancy identification (2)
    ret[11] = Math.floor(SEQNumber / 0x100);
    ret[12] = (SEQNumber % 0x100);
    ret[13] = Math.floor(PUDParLen / 0x100);
    ret[14] = (PUDParLen % 0x100);
    ret[15] = Math.floor(DATALen / 0x100);
    ret[16] = (DATALen % 0x100);
    // Write Parameters
    ret[17] = FunctionCode.Write; // Function
    ret[18] = 0x01; // Items count (idx 18)
    ret[19] = 0x12; // Var spec.
    ret[20] = 0x0A; // Length of remaining bytes
    ret[21] = 0x10; // Syntax ID 
    // Transport Size + // Num Elements > length in bytes    
    switch (parArea)
    {
        case ParameterArea.S7200AnalogInput:
        case ParameterArea.S7200AnalogOutput:
            writePars[22] = DataType.Word;
            writePars[23] = Math.floor(((DATALen + 1) / 2) / 0x100);
            writePars[24] = (((DATALen + 1) / 2) % 0x100);
            start *= 8;
            break;
        case ParameterArea.S7Timer:
        case ParameterArea.S7Counter:
        case ParameterArea.S7200Timer:
        case ParameterArea.S7200Counter:
            writePars[22] = parArea;
            writePars[23] = Math.floor(((DATALen + 1) / 2) / 0x100);
            writePars[24] = (((DATALen + 1) / 2) % 0x100);
            break;
        default:
            writePars[22] = (isBit ? DataType.Bit : DataType.Byte);
            writePars[23] = Math.floor(DATALen / 0x100);
            writePars[24] = (DATALen % 0x100);
            start *= (isBit) ? 1 : 8;
            break;
    }
    // DB Number (if any, else 0) 
    ret[25] = Math.floor(areaNumber / 0x100);
    ret[26] = (areaNumber % 0x100);
    // Area Code
    ret[27] = parArea;
    // Start address in bits
    ret[28] = Math.floor(start / 0x10000);
    ret[29] = Math.floor(start / 0x100);
    ret[30] = (start % 0x100);
    // Write Header Values
    ret[31] = 0x00;
    ret[32] = 0x04;
    ret[33] = Math.floor(DATALen * 8 / 0x100);
    ret[34] = (DATALen * 8 % 0x100);
    // Add Values    
    ret.push(values);
    // Return
    return ret;
}