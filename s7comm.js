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

// Local Consts
const MAXPDUSIZE = 1024;
const MAXREADBYTES = 942;
const MAXWRITEBYTES = 932;
const MAXITEMSLIST = 20;
if (Object.freeze) {
    Object.freeze(MAXPDUSIZE);
    Object.freeze(MAXREADBYTES);
    Object.freeze(MAXWRITEBYTES);
    Object.freeze(MAXITEMSLIST);
}

// Consts exports
exports.MAXPDUSIZE = MAXPDUSIZE;
exports.MAXREADBYTES = MAXREADBYTES;
exports.MAXWRITEBYTES = MAXWRITEBYTES;
exports.MAXITEMSLIST = MAXITEMSLIST;

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
    ret[20] = 0x01, // Dst TSAP HI > Communication Type: 1=PG Communication, 2=OP Communication, 3=Step7Basic Communication
    ret[21] = (rack * 2 * 16 + slot)  // Dst TSAP LO > Slot - Rack (ISO over TCP)
    // Return
    return ret;
}

// S7 PDU Negotiation Telegram (contains also ISO Header and COTP Header)
exports.NegotiatePDULengthRequest = () => {
    // Consts
    const TPKTLen = 4;
    const COTPLen = 3;
    const PDUHeaderLen = 10;
    const PUDParLen = 8;
    const DATALen = 0;
    const PDUReqType = PDUType.Request;
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
    ret[8] = PDUReqType; // Job Type
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
    ret[20] = 0x01; // 1=PG Communication, 2=OP Communication, 3=Step7Basic Communication
    ret[21] = 0x00;
    ret[22] = 0x01; // 1=PG Communication, 2=OP Communication, 3=Step7Basic Communication 
    // MAX PDU Length 
    // > 942 bytes on read
    // > XXX bytes on write
    ret[23] = Math.floor(MAXPDUSIZE / 0x100); // PDU Length Requested = HI-LO Here > 0x04
    ret[24] = (MAXPDUSIZE % 0x100); // PDU Length Requested = HI-LO Here > 0x00
    // Return
    return ret;
}

// S7 Read Request Header (contains also ISO Header and COTP Header)
exports.ReadRequest = (parArea, areaNumber, start, len, isBit) => {
    // Consts
    const TPKTLen = 4;
    const COTPLen = 3;
    const PDUHeaderLen = 10; // Request=10, Response=12
    const PUDParLen = 14; // Read parameter
    const DATALen = 0;
    const PDUReqType = PDUType.Request;
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
    ret[8] = PDUReqType; // Job Type
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
            ret[22] = DataType.Word;
            start *= 8;
            break;
        case ParameterArea.S7Timer:
        case ParameterArea.S7Counter:
        case ParameterArea.S7200Timer:
        case ParameterArea.S7200Counter:
            ret[22] = parArea;
            break;
        default:
            ret[22] = (isBit ? DataType.Bit : DataType.Byte);
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
exports.WriteRequest = (parArea, areaNumber, start, isBit, values) => {
    // Normalize values: Only Even bytes of values
    if (values.length % 2 == 1) values.push(0x00);
    // Consts
    const TPKTLen = 4;
    const COTPLen = 3;
    const PDUHeaderLen = 10; // Request=10, Response=12
    const PUDParLen = 18; // Write parameter (write header + write parameter)
    const DATALen = values.length;
    const PDUReqType = PDUType.Request;
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
    ret[8] = PDUReqType; // Job Type
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
            ret[22] = DataType.Word;
            ret[23] = Math.floor(((DATALen + 1) / 2) / 0x100);
            ret[24] = (((DATALen + 1) / 2) % 0x100);
            start *= 8;
            break;
        case ParameterArea.S7Timer:
        case ParameterArea.S7Counter:
        case ParameterArea.S7200Timer:
        case ParameterArea.S7200Counter:
            ret[22] = parArea;
            ret[23] = Math.floor(((DATALen + 1) / 2) / 0x100);
            ret[24] = (((DATALen + 1) / 2) % 0x100);
            break;
        default:
            ret[22] = (isBit ? DataType.Bit : DataType.Byte);
            ret[23] = Math.floor(DATALen / 0x100);
            ret[24] = (DATALen % 0x100);
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
    ret[32] = 0x04; // Bit = 3, Counter/Timer = 9, Byte/Word/DWord.. = 4
    ret[33] = Math.floor(DATALen * 8 / 0x100); // Counter/Timer *= 2, Else *= 8
    ret[34] = (DATALen * 8 % 0x100); // Counter/Timer *= 2, Else *= 8
    // Add Values    
    ret = ret.concat(values);
    // Return
    return ret;
}

// S7 Variable MultiRead
exports.MultiReadRequest = (itemsList) => {
    // Request
    let ret = [];
    // Assert items count (max 20)
    let itemsCount = itemsList.length;
    if (itemsCount > this.MAXITEMSLIST) itemsCount = this.MAXITEMSLIST;
    // Header
    ret = ret.concat(MultiReadHeaderRequest(itemsCount));
    // Items Add
    for(let i = 0; i < itemsCount; i++) {
        let item = itemsList[i];
        let itemRequest = MultiReadItemRequest(item.parArea, item.areaNumber, item.start, item.len, item.isBit);
        ret = ret.concat(itemRequest);
    }
    return ret;
}
// S7 Variable MultiRead Header
MultiReadHeaderRequest = (itemsCount) => {
    // Consts
    const TPKTLen = 4;
    const COTPLen = 3;
    const PDUHeaderLen = 10; // Request=10, Response=12
    const ITEMLen = 12;
    const PUDParLen = itemsCount * ITEMLen + 2; // Read parameter
    const DATALen = 0;
    const PDUReqType = PDUType.Request;
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
    ret[8] = PDUReqType; // Job Type
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
    ret[18] = itemsCount; // Items count (idx 18)
    // Return
    return ret;
}
// S7 Variable MultiRead Item
MultiReadItemRequest = (parArea, areaNumber, start, len, isBit) => {
    // Request
    let ret = [];
    ret[0] = 0x12; // Var spec.
    ret[1] = 0x0A; // Length of remaining bytes
    ret[2] = 0x10; // Syntax ID 
    // Transport Size
    switch (parArea)
    {
        case ParameterArea.S7200AnalogInput:
        case ParameterArea.S7200AnalogOutput:
            ret[3] = DataType.Word;
            start *= 8;
            break;
        case ParameterArea.S7Timer:
        case ParameterArea.S7Counter:
        case ParameterArea.S7200Timer:
        case ParameterArea.S7200Counter:
            ret[3] = parArea;
            break;
        default:
            ret[3] = (isBit ? DataType.Bit : DataType.Byte);
            start *= (isBit) ? 1 : 8;
            break;
    }
    // Num Elements > length in bytes
    ret[4] = Math.floor(len / 0x100);
    ret[5] = (len % 0x100);
    // DB Number (if any, else 0) 
    ret[6] = Math.floor(areaNumber / 0x100);
    ret[7] = (areaNumber % 0x100);  
    // Area Code
    ret[8] = parArea;  
    // Start address in bits
    ret[9] = Math.floor(start / 0x10000);
    ret[10] = Math.floor(start / 0x100);
    ret[11] = (start % 0x100);
    // Return
    return ret;
}

// S7 Variable MultiWrite
exports.MultiWriteRequest = (itemsList, itemsValues) => {
    // Request
    let ret = [];
    // Assert items count (max 20)
    let itemsCount = itemsList.length;
    if (itemsCount > this.MAXITEMSLIST) itemsCount = this.MAXITEMSLIST;
    // Header
    ret = ret.concat(MultiWriteHeaderRequest(itemsValues));
    // Items Add
    for(let i = 0; i < itemsCount; i++) {
        let item = itemsList[i];
        let itemRequest = MultiWriteItemRequest(item.parArea, item.areaNumber, item.start, item.len, item.isBit);
        ret = ret.concat(itemRequest);
    }
    // Values Add
    for(let i = 0; i < itemsCount; i++) {
        let itemValues = itemsValues[i];
        let itemValuesRequest = MultiWriteItemValuesRequest(itemValues);
        ret = ret.concat(itemValuesRequest);
    }
    return ret;
}
// S7 Variable MultiRead Header
MultiWriteHeaderRequest = (itemsValues) => {
    // Analize values
    let itemsCount = itemsValues.length;
    let itemsLen = 0;
    itemsValues.forEach((entry) => {
        // Normalize values: Only Even bytes of values
        if (entry.length % 2 == 1) entry.push(0x00);
        itemsLen += entry.length + 4;
    });

    // Consts
    const TPKTLen = 4;
    const COTPLen = 3;
    const PDUHeaderLen = 10; // Request=10, Response=12
    const ITEMLen = 12;
    const PUDParLen = itemsCount * ITEMLen + 2; // Write parameter
    const DATALen = itemsLen;
    const PDUReqType = PDUType.Request;
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
    ret[8] = PDUReqType; // Job Type
    ret[9] = 0x00; // Redundancy identification (1)
    ret[10] = 0x00; // Redundancy identification (2)
    ret[11] = Math.floor(SEQNumber / 0x100);
    ret[12] = (SEQNumber % 0x100);
    ret[13] = Math.floor(PUDParLen / 0x100);
    ret[14] = (PUDParLen % 0x100);
    ret[15] = Math.floor(DATALen / 0x100);
    ret[16] = (DATALen % 0x100);
    // Read Parameters
    ret[17] = FunctionCode.Write; // Function
    ret[18] = itemsCount; // Items count (idx 18)
    // Return
    return ret;
}
// S7 Variable MultiWrite Item
MultiWriteItemRequest = (parArea, areaNumber, start, len, isBit) => {
    // Request
    let ret = [];
    ret[0] = 0x12; // Var spec.
    ret[1] = 0x0A; // Length of remaining bytes
    ret[2] = 0x10; // Syntax ID 
    // Transport Size + // Num Elements > length in bytes    
    switch (parArea)
    {
        case ParameterArea.S7200AnalogInput:
        case ParameterArea.S7200AnalogOutput:
            ret[3] = DataType.Word;
            ret[4] = Math.floor(((len + 1) / 2) / 0x100);
            ret[5] = (((len + 1) / 2) % 0x100);
            start *= 8;
            break;
        case ParameterArea.S7Timer:
        case ParameterArea.S7Counter:
        case ParameterArea.S7200Timer:
        case ParameterArea.S7200Counter:
            ret[3] = parArea;
            ret[4] = Math.floor(((len + 1) / 2) / 0x100);
            ret[5] = (((len + 1) / 2) % 0x100);
            break;
        default:
            ret[3] = (isBit ? DataType.Bit : DataType.Byte);
            ret[4] = Math.floor(len / 0x100);
            ret[5] = (len % 0x100);
            start *= (isBit) ? 1 : 8;
            break;
    }
    // DB Number (if any, else 0) 
    ret[6] = Math.floor(areaNumber / 0x100);
    ret[7] = (areaNumber % 0x100);
    // Area Code
    ret[8] = parArea;
    // Start address in bits
    ret[9] = Math.floor(start / 0x10000);
    ret[10] = Math.floor(start / 0x100);
    ret[11] = (start % 0x100);
    return ret;
}
// S7 Variable MultiWrite Values
MultiWriteItemValuesRequest = (values) => {
    // Normalize values: Only Even bytes of values
    if (values.length % 2 == 1) values.push(0x00);
    // Request
    let ret = [];
    // Write Header Values
    ret[0] = 0x00;
    ret[1] = 0x04; // Bit = 3, Counter/Timer = 9, Byte/Word/DWord.. = 4
    ret[2] = Math.floor(values.length * 8 / 0x100); // Counter/Timer *= 2, Else *= 8
    ret[3] = (values.length * 8 % 0x100); // Counter/Timer *= 2, Else *= 8
    // Add Values    
    ret = ret.concat(values);
    // Return
    return ret;
}