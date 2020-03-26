// Enums
const FunctionCode = require("./enums/FunctionCode");
const ParameterArea = require("./enums/ParameterArea");
const PDUType = require("./enums/PDUType");
const DataType = require("./enums/DataType");

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

/**
 * This class provide the ISO-on-TCP requests/response as specified in protocol for:
 * - Connect to device via TCP socket (session and PDU negotiation)
 * - Read (tags)
 * - Write (tags, values)
 */
class S7Comm {    
    
    /**
     * ISO Connection Request telegram (contains also ISO Header and COTP Header)
     * @param {number} rack CPU Rack number
     * @param {number} slot CPU slot number 
     * @returns {Array} The protocol request to send (Array of bytes)
     */
    static registerSessionRequest = (rack, slot) => {
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
        ret[5] = FunctionCode.RegisterSessionReq, // CR - Connection Request ID (TDPU Type CR = Connection Request > see RFC1006/ISO8073)
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

    /**
     * S7 PDU Negotiation Telegram (contains also ISO Header and COTP Header)
     * @returns {Array} The protocol request to send (Array of bytes)
     */
    static negotiatePDULengthRequest = (seqNumber) => {
        // Consts
        const TPKTLen = 4;
        const COTPLen = 3;
        const PDUHeaderLen = 10;
        const PUDParLen = 8;
        const DATALen = 0;
        const PDUReqType = PDUType.Request;
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
        ret[5] = FunctionCode.OpenS7Connection; // Connect on S7comm layer (param.func = 0xf0, Setup communication)
        ret[6] = 0x80; 
        // PDU Header
        ret[7] = 0x32; // protocol identifier (S7)
        ret[8] = PDUReqType; // Job Type
        ret[9] = 0x00; // Redundancy identification (1)
        ret[10] = 0x00; // Redundancy identification (2)
        ret[11] = Math.floor(seqNumber / 0x100);
        ret[12] = (seqNumber % 0x100);
        ret[13] = Math.floor(PUDParLen / 0x100);
        ret[14] = (PUDParLen % 0x100);
        ret[15] = Math.floor(DATALen / 0x100);
        ret[16] = (DATALen % 0x100);
        // PDU Parameters
        ret[17] = FunctionCode.OpenS7Connection; // Connect on S7comm layer (param.func = 0xf0, Setup communication)
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

    /**
     * S7 Variable MultiRead full protocol request
     * @param {Array} tags The list of S7Tag to read
     * @returns {Array} The protocol request to send (Array of bytes)
     */
    static readRequest = (tags, seqNumber) => {
        // assert MAXITEMSLIST
        if (tags.length > MAXITEMSLIST) {
            let e = new Error("Tags count is greater than Maximum (" + MAXITEMSLIST + ")");
            throw e;
        }
        // assert MAXREADBYTES
        let totalLength = tags.reduce((total, item) => total + (item['bytesSize'] || 0), 0);
        if (totalLength > MAXREADBYTES) {
            let e = new Error("Tags total length is greater than Maximum (" + MAXREADBYTES + ")");
            throw e;
        }
        // Request
        let ret = [];
        // Header
        let itemsCount = tags.length;
        ret = ret.concat(this.#readHeaderRequest(itemsCount, seqNumber));
        // Items Add
        for(let i = 0; i < itemsCount; i++) {
            let item = tags[i];
            let itemRequest = this.#readItemRequest(item.parameterArea, item.db, item.offset, item.bytesSize, item.bit);
            ret = ret.concat(itemRequest);
        }
        return ret;
    }

    // S7 Variable MultiRead Header
    static #readHeaderRequest = (itemsCount, seqNumber) => {
        // Consts
        const TPKTLen = 4;
        const COTPLen = 3;
        const PDUHeaderLen = 10; // Request=10, Response=12
        const ITEMLen = 12;
        const PUDParLen = itemsCount * ITEMLen + 2; // Read parameter
        const DATALen = 0;
        const PDUReqType = PDUType.Request;
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
        ret[5] = FunctionCode.OpenS7Connection; // Connect on S7comm layer (param.func = 0xf0, Setup communication)
        ret[6] = 0x80; 
        // PDU Header
        ret[7] = 0x32; // protocol identifier (S7)
        ret[8] = PDUReqType; // Job Type
        ret[9] = 0x00; // Redundancy identification (1)
        ret[10] = 0x00; // Redundancy identification (2)
        ret[11] = Math.floor(seqNumber / 0x100);
        ret[12] = (seqNumber % 0x100);
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
    static #readItemRequest = (parArea, areaNumber, start, len, bit) => {
        // Request
        let ret = [];
        ret[0] = 0x12; // Var spec.
        ret[1] = 0x0A; // Length of remaining bytes
        ret[2] = 0x10; // Syntax ID 
        // Transport Size
        // NOTE: use only DataType.Byte
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
                ret[3] = (bit != null ? DataType.Bit : DataType.Byte);
                start = start * 8 + (bit != null ? bit : 0);
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
        // Sample: M5.3 > (5 * 8) + 3
        ret[9] = Math.floor(start / 0x10000);
        ret[10] = Math.floor(start / 0x100);
        ret[11] = (start % 0x100);
        // Return
        return ret;
    }

    /**
     * S7 Variable MultiWrite full protocol request 
     * @param {Array} tags The list of S7Tag to write
     * @param {Array} values The list of value to write
     * @returns {Array} The protocol request to send (Array of bytes)
     */
    static writeRequest = (tags, values, seqNumber) => {
        // assert tags count and values count
        if (tags.length != values.length) {
            let e = new Error("Tags count (" + tags.length + ") different from values count (" + values.length + ")");
            throw e;
        }
        // assert MAXITEMSLIST
        if (tags.length > MAXITEMSLIST) {
            let e = new Error("Tags count is greater than Maximum (" + MAXITEMSLIST + ")");
            throw e;
        }
        // assert MAXWRITEBYTES
        let totalLength = tags.reduce((total, item) => total + (item['bytesSize'] || 0), 0);
        if (totalLength > MAXWRITEBYTES) {
            let e = new Error("Tags total length is greater than Maximum (" + MAXWRITEBYTES + ")");
            throw e;
        }
        // Request
        let ret = [];
        // Header
        ret = ret.concat(this.#writeHeaderRequest(values, seqNumber));
        // Items Add
        let itemsCount = tags.length;
        for(let i = 0; i < itemsCount; i++) {
            let item = tags[i];
            let itemRequest = this.#writeItemRequest(item.parameterArea, item.db, item.offset, item.bytesSize, false);
            ret = ret.concat(itemRequest);
        }
        // Values Add
        for(let i = 0; i < itemsCount; i++) {
            let itemValue = values[i];
            let itemValueRequest = this.#writeItemValuesRequest(itemValue);
            ret = ret.concat(itemValueRequest);
        }
        return ret;
    }

    // S7 Variable MultiRead Header
    static #writeHeaderRequest = (itemsValues, seqNumber) => {
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
        ret[5] = FunctionCode.OpenS7Connection; // Connect on S7comm layer (param.func = 0xf0, Setup communication)
        ret[6] = 0x80; 
        // PDU Header
        ret[7] = 0x32; // protocol identifier (S7)
        ret[8] = PDUReqType; // Job Type
        ret[9] = 0x00; // Redundancy identification (1)
        ret[10] = 0x00; // Redundancy identification (2)
        ret[11] = Math.floor(seqNumber / 0x100);
        ret[12] = (seqNumber % 0x100);
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
    static #writeItemRequest = (parArea, areaNumber, start, len, isBit) => {
        // Request
        let ret = [];
        ret[0] = 0x12; // Var spec.
        ret[1] = 0x0A; // Length of remaining bytes
        ret[2] = 0x10; // Syntax ID 
        // Transport Size + // Num Elements > length in bytes    
        // NOTE: use only DataType.Byte
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
    static #writeItemValuesRequest = (values) => {
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
        let valArray = Array.prototype.slice.call(values, 0);    
        ret = ret.concat(valArray);
        // Return
        return ret;
    }

    /**
     * This function takes split a buffer of receive bytes in responses adorned with info
     * @param {Array} buffer as array of bytes to parse 
     * @return {Array} Array of responses object {type, code, seqNumber, array of data}
     */
    static getResponses(buffer) {
        let results = [];
        let currentOffset = 0;
        let bufferLength = buffer.length;        
        
        while(currentOffset < bufferLength) {    
            // parse result
            let respLength = buffer[currentOffset + 2] * 256 + buffer[currentOffset + 3];
            let respBuffer = buffer.slice(currentOffset, currentOffset + respLength);
            let respType = respBuffer[5];
            let respSeqNumber = respBuffer[11] * 256 + respBuffer[12];
            let respCode = respType == FunctionCode.RegisterSessionResp ? FunctionCode.RegisterSessionResp :respBuffer[19];            
            
            results.push({                
                type: respType,
                code: respCode,
                seqNumber: respSeqNumber,
                data: respBuffer
            });

            currentOffset += respLength;
        }
        return results;
    }

    /**
     * Validate and compute the "register session request" response from CPU
     * Response Type: FunctionCode.RegisterSessionResp = 0xD0
     * Response Code: FunctionCode.RegisterSessionResp = 0xD0 (forced)
     * @param {Array} response Array of byte, the response on "register session request"
     * @returns {Boolean} Response as true or throw as Error
     */
    static registerSessionResponse = (response) => {
        if (response.length != 22) {
            let e = new Error("Error registering session!");
            throw e;
        }
        return true;
    }

    /**
     * Validate and compute the "negotiate PDU length request" response from CPU
     * Response Type: FunctionCode.OpenS7Connection = 0xF0
     * Response Code: FunctionCode.OpenS7Connection = 0xF0
     * @param {Array} response Array of byte, the response on "negotiate PDU length request"
     * @returns {Boolean} Response as true or throw as Error
     */
    static negotiatePDULengthResponse = (response) => {
        // 25, 26: PDU Length negotiated
        // check response length
        if (response.length != 27) {
            let e = new Error("Error negotiating PDU!");
            throw e;
        }
        return true;
    }

    /**
     * Validate and compute the "data read request" response from CPU
     * Response Type: FunctionCode.OpenS7Connection = 0xF0
     * Response Code: FunctionCode.Read = 0x04
     * @param {Array} tags Array of S7tag
     * @param {Array} data Array of byte, the response on "data read request"
     * @returns {Object} Response as array of object of { S7tag, Value } or throw as Error
     */
    static readResponse = (tags, data) => {
        // assert ISO length
        if (data.length < 22) {
            let e = new Error("Error on data bytes read response!");
            throw e;
        } 
        // assert Operation result
        if (data[17] != 0 || data[18] != 0) {
            let e = new Error("Read response return an error: " + data[17] + "/" + data[18]);
            throw e;
        } 
        // assert Items Count
        if (data[20] != tags.length || data[20] > MAXITEMSLIST) {
            let e = new Error("Read response return invalid items count");
            throw e;
        }
        // Read data result
        let results = [];
        let offset = 21;
        tags.forEach((tag) => {
            let normalizeByteSize = tag.bytesSize%2 ? (tag.bytesSize+1) : tag.bytesSize;
            let tagResponse = data.slice(offset, offset + normalizeByteSize + 4);
            // assert tag result
            if (tagResponse[0] != 0xFF) {
                // Error on read.
                // add a null in tag value response
                results.push({Tag: tag, Value: null});
            }
            // Tag size
            let itemBitsLength = tagResponse[2] * 256 + tagResponse[3];
            // Check tag type: 0x03 Bit, 0x04 Byte, 0x05 Int, 0x07 Real, 0x09 Octet
            let itemBytesLength = 0;
            let tagType = tagResponse[1];
            switch(tagType) {
                case 0x03: // bit
                    itemBytesLength = itemBitsLength;
                    break;
                case 0x04: // Byte
                case 0x05: // Int
                case 0x07: // Real
                    itemBytesLength = itemBitsLength / 8;
                    break;
            }
            // assert tag result bytes length
            if (itemBytesLength != tag.bytesSize) {
                // Error reading tag bytes size
                // add a null in tag value response
                results.push({Tag: tag, Value: null});
            }
            // takes value
            let tagValue = tagResponse.slice(4, 4 + tag.bytesSize);
            results.push({Tag: tag, Value: Uint8Array.from(tagValue)});
            offset += normalizeByteSize + 4;
        });
        return results;
    }

    /**
     * Validate and compute the "data write request" response from CPU
     * Response Type: FunctionCode.OpenS7Connection = 0xF0
     * Response Code: FunctionCode.Write = 0x05
     * @param {Array} tags Array of S7tag
     * @param {Array} data Array of byte, the response on "data write request"
     * @returns {Object} Response as array of object of {S7tag, code} or throw as Error
     */
    static writeResponse = (tags, data) => {
        // assert Operation result
        if (data[17] != 0 || data[18] != 0) {
            let e = new Error("Write response return an error: " + data[17] + "/" + data[18]);
            throw e;
        } 
        // assert Items Count
        if (data[20] != tags.length || data[20] > MAXITEMSLIST) {
            let e = new Error("Write response return invalid items count");
            throw e;
        }
        let results = [];
        let offset = 21;
        tags.forEach((tag) => {
            results.push({Tag: tag, Value: data[offset]});
            offset += 1;
        });
        return results;
    }


}

module.exports = {
    S7Comm,
    MAXPDUSIZE,
    MAXREADBYTES,
    MAXWRITEBYTES,
    MAXITEMSLIST
}