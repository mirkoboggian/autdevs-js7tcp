const net = require('net');

function onerror(e){
    console.log(e);
}

var socket = new net.Socket();
socket.on('error', onerror);
socket.on('error', onerror);
socket.on('error', onerror);
socket.off('error', onerror);
socket.off('error', onerror);
socket.off('error', onerror);
