const S7Socket = require("./s7socket");
const S7Comm = require("./s7comm");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 5000);

s7socket.on('connected', () => {
    console.log("CONNECTED: ", s7socket.connected());
    
    // // Polling write
    // setInterval(() => {
    //     let now = new Date(Date.now());
    //     let values = [1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //          6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds()];
    //     let data = s7socket.write(S7Comm.ParameterArea.DB, 1, 0, false, values);
    // }, 50);

    // // Polling read
    // setInterval(() => {
    //     let data = s7socket.read(S7Comm.ParameterArea.DB, 1, 0, 10, false);
    // }, 50);

    // Polling read
    setInterval(() => {
        let data = s7socket.read(S7Comm.ParameterArea.DB, 1, 0, 10, true);
    }, 50);

});

s7socket.on('error', (error) => {
    console.error(error);
});

s7socket.on('read', (data) => {
    console.info("READ: ", data);
});

s7socket.on('write', (data) => {
    console.warn("WRITE: ", data);
});

s7socket.connect();