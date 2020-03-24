const S7Socket = require("./../s7socket");
const S7Comm = require("./../s7comm");
const S7Tag = require("./../s7tag");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 5000);

let Db1DbR3600 = S7Tag.fromPath("Db1DbR3600", "DB1.DBR3600");
let Db3DbR3600 = S7Tag.fromPath("Db3DbR3600", "DB3.DBR3600");
let Db5DbR3600 = S7Tag.fromPath("Db5DbR3600", "DB5.DBR3600");
let Db1DbS3604 = S7Tag.fromPath("Db1DbS3604", "DB1.DBS3604[20]");
let Db1DbI3628 = S7Tag.fromPath("Db1DbI3628", "DB1.DBI3628[10]");
let Db1DwR3600 = S7Tag.fromPath("Db1DwR3600", "DB1.DBW3600");
let Db1DbR3600_5 = S7Tag.fromPath("Db1DbR3600_5", "DB1.DBB3600.%5");
let Db1DbR3600_3 = S7Tag.fromPath("Db1DbR3600_3", "DB1.DBB3600.%3");

let sortedTags = [Db5DbR3600, Db1DbR3600, Db1DbI3628, Db1DbR3600_5, Db1DbS3604, Db1DwR3600, Db1DbR3600_3, Db3DbR3600].sort(S7Tag.sorter);
console.log(Db1DbR3600);
console.log(sortedTags);

let Db1DbR3600_val = Db1DbR3600.toBytes(445.99886);
let Db1DbS3604_val = Db1DbS3604.toBytes("CIAO MIRKO!");
let Db1DbI3628_val = Db1DbI3628.toBytes([13,23,31,43,51,63,7,8,9,10]);

let tags = [Db1DbR3600, Db1DbS3604, Db1DbI3628];
let values = [Db1DbR3600_val, Db1DbS3604_val, Db1DbI3628_val];

s7socket.on('connect', () => {
    console.log("CONNECTED: ", s7socket.connected());

    setInterval(() => {
        s7socket.write(tags, values);
    }, 100);

    setInterval(() => {
        s7socket.read(tags);
        s7socket.read([Db1DbR3600]);
        s7socket.read([Db1DbS3604]);
        s7socket.read([Db1DbI3628]);
    }, 100);
        
});

s7socket.on('error', (error) => {
    console.error(error);
});

s7socket.on('read', (result) => {
    result.forEach((r) => {
        console.info("READ: ", r.Tag.path, r.Tag.fromBytes(r.Value));
    });
});

s7socket.on('write', (result) => {
    result.forEach((r) => {
        console.info("WRITE: ", r.Tag.path, (r.Value == 255));
    });
});

s7socket.connect();