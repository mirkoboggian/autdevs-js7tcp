// BITS operation

const { S7Socket } = require("./../s7socket");
const S7Tag = require("./../s7tag");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 3000);

let Db1DbX1_0 = S7Tag.fromPath("Db1DbX1.0", "DB1.DBX1.0");
let Db1DbX1_1 = S7Tag.fromPath("Db1DbX1.1", "DB1.DBX1.1");
let Db1DbX1_2 = S7Tag.fromPath("Db1DbX1.2", "DB1.DBX1.2");

let Db1DbX0_0 = S7Tag.fromPath("Db1DbX0.0", "DB1.DBX0.0");
let Db1DbX0_1 = S7Tag.fromPath("Db1DbX0.1", "DB1.DBX0.1");
let Db1DbX0_2 = S7Tag.fromPath("Db1DbX0.2", "DB1.DBX0.2");

let Db1Dbb0 = S7Tag.fromPath("Db1Dbb0", "DB1.DBB0");
let Db1Dbb1 = S7Tag.fromPath("Db1Dbb1", "DB1.DBB1");

let Db1Dbw0 = S7Tag.fromPath("Db1Dbw0", "DB1.DBW0");
let Db1Dbw2 = S7Tag.fromPath("Db1Dbw2", "DB1.DBW2");
let Db1Dbw4 = S7Tag.fromPath("Db1Dbw4", "DB1.DBW4");


s7socket.on('connect', (seqNumber) => {
    console.log("CONNECTED: " + seqNumber);
    s7socket.write([Db1Dbb0], [Db1Dbb0.toBytes(171)])
    s7socket.write([Db1Dbb1], [Db1Dbb1.toBytes(180)])
    s7socket.write([Db1Dbw0, Db1Dbw2, Db1Dbw4], [Db1Dbw0.toBytes(9), Db1Dbw2.toBytes(11), Db1Dbw4.toBytes(15)])
    s7socket.write([Db1DbX0_0, Db1DbX0_1, Db1DbX0_2], [Db1DbX0_0.toBytes(true), Db1DbX0_1.toBytes(false), Db1DbX0_2.toBytes(true)])
    s7socket.read([Db1DbX1_0, Db1DbX1_1, Db1DbX1_2, Db1Dbw0, Db1Dbb0, Db1Dbb1]);
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