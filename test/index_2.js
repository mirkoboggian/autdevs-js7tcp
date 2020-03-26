// BITS operation

const { S7Socket } = require("./../s7socket");
const S7Tag = require("./../s7tag");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000);

let Db1Dbb0_0 = S7Tag.fromPath("Db1Dbb0.0", "DB1.DBB0.%0");
let Db1Dbb0_1 = S7Tag.fromPath("Db1Dbb0.1", "DB1.DBB0.%1");
let Db1Dbb0_2 = S7Tag.fromPath("Db1Dbb0.2", "DB1.DBB0.%2");
let Db1Dbb0_3 = S7Tag.fromPath("Db1Dbb0.3", "DB1.DBB0.%3");
let Db1Dbb0_4 = S7Tag.fromPath("Db1Dbb0.4", "DB1.DBB0.%4");
let Db1Dbb0_5 = S7Tag.fromPath("Db1Dbb0.5", "DB1.DBB0.%5");
let Db1Dbb0_6 = S7Tag.fromPath("Db1Dbb0.6", "DB1.DBB0.%6");
let Db1Dbb0_7 = S7Tag.fromPath("Db1Dbb0.7", "DB1.DBB0.%7");

s7socket.on('connect', (seqNumber) => {
    console.log("CONNECTED: " + seqNumber);
    s7socket.read(Db1Dbb0_0);
});

s7socket.on('error', (error) => {
    console.error(error);
});

s7socket.on('read', (result, seqNumber) => {
    result.forEach((r) => {
        console.info("(" + seqNumber + ") READ: ", r.Tag.path, r.Tag.fromBytes(r.Value));
    });
});

s7socket.on('write', (result, seqNumber) => {
    result.forEach((r) => {
        console.info("(" + seqNumber + ") WRITE: ", r.Tag.path, (r.Value == 255));
    });
});

s7socket.connect();