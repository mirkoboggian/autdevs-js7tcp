const S7Tcp = require("./../s7tcp");

const configPath = __dirname + "/config.json"
let config = JSON.parse(fs.readFileSync(configPath));