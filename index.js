const S7Socket = require("./s7socket");
const S7Comm = require("./s7comm");
const S7Tag = require("./s7tag");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 5000);

s7socket.on('connect', () => {
    console.log("CONNECTED: ", s7socket.connected());

    let Db1DbR0 = S7Tag.fromPath("DB1.DBR3600");
    let Db1DbR0_val = Db1DbR0.toBytes(14.56);
    s7socket.write(Db1DbR0, Db1DbR0_val);
    s7socket.read(Db1DbR0);

    let Db1DbS1 = S7Tag.fromPath("DB1.DBS3604[20]");
    let Db1DbS1_val = Db1DbS1.toBytes("STRINGA");
    s7socket.write(Db1DbS1, Db1DbS1_val);
    s7socket.read(Db1DbS1);

    let Db1DbI3628 = S7Tag.fromPath("DB1.DBI3628[10]");
    let Db1DbI3628_val = Db1DbI3628.toBytes([1,2,3,4,5,6,7,8,9,10]);
    s7socket.write(Db1DbI3628, Db1DbI3628_val);
    s7socket.read(Db1DbI3628);

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
        console.info("READ: ", r.Tag.path, r.Value);
    });
});

s7socket.on('multiWrite', (result) => {
    result.forEach((r) => {
        console.info("WRITE: ", r.Tag.path, (r.Value == 255));
    });
});

s7socket.connect();