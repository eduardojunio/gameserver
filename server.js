'use strict';

const Server = require('./src/Server');

const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const server = new Server({ socket });

server.registerEventListeners();

server.startServer();
