const S7Tcp = require("./../s7tcp");

var s7tcp = S7Tcp.fromConfigJSON(__dirname + "/config_3.json")

s7tcp.on('connect', () => {
    console.log("CONNECTED: ", s7tcp.connected());
});

s7tcp.on('error', (error) => {
    console.error(error);
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