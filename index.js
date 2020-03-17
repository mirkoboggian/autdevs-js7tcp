const S7Socket = require("./s7socket");
const S7Comm = require("./s7comm");
const S7Tag = require("./s7tag");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 5000);

s7socket.on('connect', () => {
    console.log("CONNECTED: ", s7socket.connected());

    //#region Simple Write

    // // Polling write
    // setInterval(() => {
    //     let now = new Date(Date.now());
    //     let value = [
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),            
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),            
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),            
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),            
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(),
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),
    //             1+now.getSeconds(), 2+now.getSeconds(), 3+now.getSeconds(), 4+now.getSeconds(), 5+now.getSeconds(), 
    //             6+now.getSeconds(), 7+now.getSeconds(), 8+now.getSeconds(), 9+now.getSeconds(), 10+now.getSeconds(),            
    //             6+now.getSeconds(), 7+now.getSeconds()
    //         ];
    //     let tag = S7Tag.fromPath("Db1.DbR0[233]");
    //     let data = s7socket.write(tag, value);
    // }, 50);

    // //#endregion

    //#region Read

    // Polling read
    setInterval(() => {
        let tag = S7Tag.fromPath("DB1.DBB0[942]");
        let data = s7socket.read(tag);
    }, 50);

    //#endregion

    //#region Multi Read

    // var db1dbw0 = S7Tag.fromPath("DB1.DBW0");
    // var db1dbw10 = S7Tag.fromPath("DB1.DBW10");
    // var db1dbw14 = S7Tag.fromPath("DB1.DBW14");
    // var db1dbw8 = S7Tag.fromPath("DB1.DBW8");
    // var db1dbw26 = S7Tag.fromPath("DB1.DBW26");
    // var items = [db1dbw0, db1dbw10, db1dbw14, db1dbw8, db1dbw26];
    // var mrRequest = s7socket.multiRead(items);

    //#endregion

    //#region Multi Write

    // var db1dbb0 = new S7Tag(S7Comm.ParameterArea.DB, 1, 0, 10, false);
    // var db3dbb0 = new S7Tag(S7Comm.ParameterArea.DB, 3, 0, 10, false);
    // var items = [db1dbb0, db3dbb0];
    // var db1dbb0Values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // var db3dbb0Values = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    // var values = [db1dbb0Values, db3dbb0Values];
    // var mrRequest = S7Comm.MultiWriteRequest(items, values);

    //#endregion

});

s7socket.on('error', (error) => {
    console.error(error);
});

s7socket.on('read', (result) => {
    console.info("READ: ", result.Tag.path, result.Value);
});

s7socket.on('write', (result) => {
    console.warn("WRITE: ", result.Tag.path + ": " + (result.Value == 255));
});

s7socket.connect();

// let tag = S7Tag.fromPath("DB123.DBDI10[5]")
// console.log(tag.path);
// console.log(tag.dataType);
// console.log(tag.bitsSize);
// console.log(tag.bytesSize);