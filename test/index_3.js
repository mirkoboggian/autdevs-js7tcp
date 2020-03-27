var fs = require('fs');
const S7Tcp = require("./../s7tcp");

const configPath = __dirname + "/config.json"
let config = JSON.parse(fs.readFileSync(configPath));

let s7tcp = S7Tcp.fromConfig(config);