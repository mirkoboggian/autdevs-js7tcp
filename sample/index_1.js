const S7Socket = require("./../s7socket");
const S7Comm = require("./../s7comm");
const S7Tag = require("./../s7tag");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 5000);

s7socket.on('connect', () => {
    console.log("CONNECTED: ", s7socket.connected());

    let Db1DbR0 = S7Tag.fromPath("Db1DbR0", "DB1.DBR3600");
    let Db1DbR0_val = Db1DbR0.toBytes(445.99886);

    let Db1DbS1 = S7Tag.fromPath("Db1DbS1", "DB1.DBS3604[20]");
    let Db1DbS1_val = Db1DbS1.toBytes("CIAO MIRKO!");

    let Db1DbI3628 = S7Tag.fromPath("Db1DbI3628", "DB1.DBI3628[10]");
    let Db1DbI3628_val = Db1DbI3628.toBytes([13,23,31,43,51,63,7,8,9,10]);
    
    let tags = [Db1DbR0, Db1DbS1, Db1DbI3628];
    let values = [Db1DbR0_val, Db1DbS1_val, Db1DbI3628_val];

    setInterval(() => {
        s7socket.multiWrite(tags, values);
    }, 10);

    setInterval(() => {
        s7socket.multiRead(tags);
    }, 10);
        
});

s7socket.on('error', (error) => {
    console.error(error);
});

s7socket.on('read', (result) => {
    console.info("READ: ", result.Tag.path, result.Tag.fromBytes(result.Value));
});

s7socket.on('write', (result) => {
    console.warn("WRITE: ", result.Tag.path + ": " + (result.Value == 255));
});

s7socket.on('multiRead', (result) => {
    result.forEach((r) => {
        console.info("READ: ", r.Tag.path, r.Tag.fromBytes(r.Value));
    });
});

s7socket.on('multiWrite', (result) => {
    result.forEach((r) => {
        console.info("WRITE: ", r.Tag.path, (r.Value == 255));
    });
});

s7socket.connect();