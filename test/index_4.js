const S7Tcp = require("./../s7tcp");
const S7Socket = require("./../s7socket");
const S7Tag = require("./../s7tag");

let writeInterval = null;
let readInterval = null;
var s7tcp = S7Tcp.fromConfig({
        "name": "S7Tcp",
        "socket": {
            "ip": "192.168.1.91",
            "port": 102,
            "rack": 0,
            "slot": 1,
            "autoreconnect": 5000,
            "timeout": 30000,
            "rwTimeout": 0
        }
    });
s7tcp.on('connect', () => {
    console.log("CONNECTED: ", s7tcp.socket.connected());

    let Db1DbR0 = S7Tag.fromConfig({"symbol": "tag1", "path": "DB1.DBW0"});
    let Db1DbR0_val = Db1DbR0.toBytes(445.99886);

    writeInterval = setInterval(() => {        
        s7tcp.socket.write(Db1DbR0, Db1DbR0_val);
    }, 200);

    readInterval = setInterval(() => {
        s7tcp.socket.read(Db1DbR0);
    }, 200);

});

s7tcp.on('error', (error) => {    
    console.error(error);
    if (writeInterval) {
        clearInterval(writeInterval);
        writeInterval = false;
    }
    if (readInterval) {
        clearInterval(readInterval);
        readInterval = false;
    }
});

s7tcp.on('read', (result) => {
    console.info("READ: ", result.Tag.path, result.Tag.fromBytes(result.Value));
});

s7tcp.on('write', (result) => {
    console.warn("WRITE: ", result.Tag.path + ": " + (result.Value == 255));
});

s7tcp.on('multiRead', (result) => {
    result.forEach((r) => {
        console.info("READ: ", r.Tag.path, r.Tag.fromBytes(r.Value));
    });
});

s7tcp.on('multiWrite', (result) => {
    result.forEach((r) => {
        console.info("WRITE: ", r.Tag.path, (r.Value == 255));
    });
});

s7tcp.socket.connect();