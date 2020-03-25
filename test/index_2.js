const S7Socket = require("./../s7socket");
const S7Comm = require("./../s7comm");
const S7Tag = require("./../s7tag");
const ParameterArea = require("./../enums/ParameterArea");

var s7socket = new S7Socket("192.168.1.91", 102, 0, 1, 5000, 30000, 2000);

/**
 * PROBLEMA!! Chi fa le richeiste deve poter ricevere la risposta alla propria richiesta e non alle altre richieste.
 * Deve esserci un sistema client - server per fare in modo che un client riceva le risposte alle richeiste effettuate come promessa in modo da evitare attesa attive.
 * 
 * 
 * 
 * 
 * 
 */