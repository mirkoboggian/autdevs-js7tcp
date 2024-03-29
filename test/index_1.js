const { S7Socket } = require("./../s7socket");
const S7Tag = require("./../s7tag");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 3000);

let Db1DbR3600 = S7Tag.fromPath("Db1DbR3600", "DB1.DBR3600");
let Db3DbR3600 = S7Tag.fromPath("Db3DbR3600", "DB3.DBR3600");
let Db5DbR3600 = S7Tag.fromPath("Db5DbR3600", "DB5.DBR3600");
let Db1DbS3604 = S7Tag.fromPath("Db1DbS3604", "DB1.DBS3604[20]");
let Db1DbI3628 = S7Tag.fromPath("Db1DbI3628", "DB1.DBI3628[10]");
let Db1DwR3600 = S7Tag.fromPath("Db1DwR3600", "DB1.DBW3600");
let Db1DbR3600_5 = S7Tag.fromPath("Db1DbR3600_5", "DB1.DBX3600.5");
let Db1DbR3600_3 = S7Tag.fromPath("Db1DbR3600_3", "DB1.DBX3600.3");

let tags = [Db1DbR3600, Db1DbS3604, Db1DbI3628];

s7socket.on('connect', (seqNumber) => {
    console.log("CONNECTED: " + seqNumber);

    setInterval(() => {
        let d = new Date();
        let Db1DbR3600_val = Db1DbR3600.toBytes(process.hrtime()[1]/1000);
        let Db1DbS3604_val = Db1DbS3604.toBytes(d.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
        let Db1DbI3628_val = Db1DbI3628.toBytes([d.getFullYear(),d.getMonth(),d.getDay(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds(),d.getUTCDay(),d.getUTCMilliseconds(),d.getUTCSeconds()]);
        let values = [Db1DbR3600_val, Db1DbS3604_val, Db1DbI3628_val];
        s7socket.write(tags, values);
    }, 10);

    setInterval(() => {
        s7socket.read(tags);
    }, 10);
        
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