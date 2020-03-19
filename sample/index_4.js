const fs = require('fs');
const S7Tcp = require("./../s7tcp");
const S7Tag = require("./../s7tag");

//#region S7Tcp

let plcConfig = {
    "name": "PLC",
    "socket": {
        "ip": "192.168.1.91",
        "port" : 102,
        "rack" : 0,
        "slot" : 1,
        "autoreconnect" : 10000,
        "timeout" : 60000,
        "rwTimeout" : 5000    
    }
}
var s7tcp = S7Tcp.fromConfig(plcConfig);
let tag1 = S7Tag.fromConfig({ "symbol": "tag1",  "path": "DB1.DBW0"       });
let val1 = 123;

//let tag2 = S7Tag.fromConfig({ "symbol": "tag2",  "path": "DB1.DBW2[4]"    });
//let tag3 = S7Tag.fromConfig({ "symbol": "tag3",  "path": "DB1.DBS10[8]"   });
//let tags = [tag1, tag2, tag3];
//let values = [123, [1, 2, 3, 4], "CIAO"];

// register to s7tcp events
let readInterval = null;
let writeIntervall = null;
s7tcp.on('connect', () => {
    let isConnected = s7tcp.connected();
    console.log("CONNECTED: ", isConnected);
    
    readInterval = setInterval(() => {
         s7tcp.socket.read(tag1);
    }, 1000);    
    
    writeIntervall = setInterval(() => {
        s7tcp.socket.write(tag1, val1);
    }, 1000);

    //s7tcp.socket.multiWrite(tags, values);
    //s7tcp.socket.multiRead(tags);
});

s7tcp.on('error', (error) => {
    console.error(error);
    clearInterval(readInterval);
    clearInterval(writeIntervall);
});

s7tcp.on('read', (result) => {
    console.info("READ: ", result.Tag.path, result.Tag.fromBytes(result.Value));
});

s7tcp.on('write', (result) => {
    console.warn("WRITE: ", result.Tag.path + ": " + (result.Value == 255));
});

s7tcp.on('multiRead', (result) => {
    result.forEach((r) => {
        console.info("READ: ", r.Tag.path, r.Value);
    });
});

s7tcp.on('multiWrite', (result) => {
    result.forEach((r) => {
        console.info("WRITE: ", r.Tag.path, (r.Value == 255));
    });
});

//#endregion