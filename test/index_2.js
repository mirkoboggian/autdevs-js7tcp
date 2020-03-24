const S7Socket = require("./../s7socket");
const S7Comm = require("./../s7comm");
const S7Tag = require("./../s7tag");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 5000);

\