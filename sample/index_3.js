const fs = require('fs');
const S7Tcp = require("./../s7tcp");

var devices = [];
var tags = [];
var tasks = [];

//#region S7Tcp

// config file
let configPath = __dirname + "/config_3.json";
if (!fs.existsSync(configPath)) {
    let err = new Error("config.json " + configPath + " not found.");
    throw err;
} 

// config object
let config = {};
try {
    let jsonFile = fs.readFileSync(configPath);
    config = JSON.parse(jsonFile);
} catch (e) {
    let err = new Error("config.json " + configPath + " is not a valid JSON file.");
    throw e;
}

// create S7Tcp Server
var s7tcp = S7Tcp.fromConfig(config);

// register to s7tcp events
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

//#endregion