const S7Comm = require("./s7comm");
const Net = require("net");
const Sprintf = require('sprintf-js').sprintf;

// Connection procedure
function onConnection(rack, slot) {
    socket.once('connect', () => {
        console.info("Connected to Server!");
        
        // Init parameters
        socket.setTimeout(1000);
        socket.setKeepAlive(true, 1000);

        // Register Session
        console.info("Register Session Request... ");
        let bytesToWrite = Uint8Array.from(S7Comm.RegisterSessionRequest(rack, slot));        
        socket.write(bytesToWrite);
        socket.once('data', (data) => {
            let bytesRead = Uint8Array.from(data);
            if (bytesRead.length != 22) {                
                throw new Error("Error registering session!");  
            }
            else {
                console.info("Session registered! ");
            }

            // Negotiate PDU
            console.info("Negotiate PDU Lenght Request... ");
            let bytesToWrite = Uint8Array.from(S7Comm.NegotiatePDULengthRequest());
            socket.write(bytesToWrite);
            socket.once('data', (data) => {
                let bytesRead = Uint8Array.from(data);
                if (bytesRead.length != 27) {                
                    throw new Error("Error negotiating PDU!");  
                }
                else {
                    console.info("PDU negotiated! ");

                    // Try to read
                    read(S7Comm.ParameterArea.DB, 1, 0, 10, false);
                }
            });
        });
    });
}

// ONLY FOR TEST!!
// MUST CHECK MAX LEN REQUEST and SPLIT MESSAGE!
function read(parArea, areaNumber, start, len, isBit)
{
    // Read DATA request
    console.info("Read DATA Request... ");
    let bytesToWrite = Uint8Array.from(S7Comm.ReadRequest(parArea, areaNumber, start, len, isBit));
    socket.write(bytesToWrite);
    socket.once('data', (data) => {
        let bytesRead = Uint8Array.from(data);
        if (bytesRead.length != 25+len) {                
            throw new Error("Error reading data!");  
        }
        else if (bytesRead[21] != 0xFF) {
            throw new Error(sprintf("Error reading data! Err. No: 1$d", bytesRead[bytesRead.prototype.length-1]));  
        } else {
            console.info("Data read successfully!");
            dataRead = bytesRead.subarray(25, 25 + len);
            console.info(dataRead);
            return dataRead;
        }
    });
}

/******* MAIN PROGRAM CYCLE *******/

try {
    // Create Socket
    var socket = new Net.Socket();

    // Loop
    socket.connect( { host: "192.168.1.91", port: 102, onConnection: onConnection(0, 1) });
}
catch (e) {
    console.error(e);
    socket._destroy();
}
finally {
    // nothing to do
}