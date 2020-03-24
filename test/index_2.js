const S7Socket = require("./../s7socket");
const S7Comm = require("./../s7comm");
const S7Tag = require("./../s7tag");
const S7Mem = require("./../s7mem");
const ParameterArea = require("./../enums/ParameterArea");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 2000);
var mem01 = new S7Mem(s7socket, 1, ParameterArea.DB, 0, 1000);