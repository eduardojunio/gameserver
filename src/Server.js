const Player = require('./Player');

function Server({ socket, portNumber = 41234 }) {
  this.socket = socket;
  this.portNumber = portNumber;
  this.onlinePlayers = {};
}

function startServer(portNumber) {
  this.socket.bind(portNumber || this.portNumber);
}
Server.prototype.startServer = startServer;

function sendMessageToPlayer({ msgObj, player }) {
  this.socket.send(JSON.stringify(msgObj), player.portNumber, player.ipAddress, (err) => {
    if (err) {
      console.log(`failed to send message to ${player.getFullAddress()}\n
        error: ${err}`);
    }
  });
}
Server.prototype.sendMessageToPlayer = sendMessageToPlayer;

function sendMessageToOnlinePlayers({ msgObj }) {
  for (const fullAddress in this.onlinePlayers) {
    if (Object.prototype.hasOwnProperty.call(this.onlinePlayers, fullAddress)) {
      sendMessageToPlayer.call(this, {
        msgObj,
        player: this.onlinePlayers[fullAddress],
      });
    }
  }
}
Server.prototype.sendMessageToOnlinePlayers = sendMessageToOnlinePlayers;

function syncPlayersPosition() {
  sendMessageToOnlinePlayers.call(this, {
    msgObj: {
      type: 'sync',
      onlinePlayers: this.onlinePlayers,
    },
  });
}
Server.prototype.syncPlayersPosition = syncPlayersPosition;

function onError(err) {
  console.log(`server error:\n${err.stack}`);
  this.socket.close();
}
Server.prototype.errorHandler = onError;

function syncOnlinePlayers({ player }) {
  sendMessageToPlayer.call(this, {
    msgObj: {
      type: 'syncOnlinePlayers',
      onlinePlayers: this.onlinePlayers,
    },
    player,
  });
}
Server.prototype.connectPlayer = syncOnlinePlayers;

function connectPlayer({ coordinates, ipAddress, portNumber }) {
  const player = new Player({ coordinates, ipAddress, portNumber });
  this.onlinePlayers[player.getFullAddress()] = player;
  sendMessageToOnlinePlayers.call(this, {
    msgObj: {
      type: 'connected',
      player,
    },
  });
  return player;
}
Server.prototype.connectPlayer = connectPlayer;

function onMessage(msg, rinfo) {
  let msgObj = {};
  const fullAddress = `${rinfo.address}:${rinfo.port}`;
  try {
    msgObj = JSON.parse(msg);
  } catch (e) {
    console.log(`failed to parse message from ${fullAddress}\n
      error: ${e.message}`);
    return;
  }
  const coordinates = { x: msgObj.x, y: msgObj.y };
  const messageType = msgObj.type;
  switch (messageType) {
    case 'connect': {
      const player = connectPlayer.call(this, {
        coordinates: {
          x: 0,
          y: 0,
        },
        ipAddress: rinfo.address,
        portNumber: rinfo.port,
      });
      syncOnlinePlayers.call(this, { player });
      console.log(`player ${fullAddress} connected`);
      break;
    }
    case 'update': {
      try {
        this.onlinePlayers[fullAddress].updateCoordinates(coordinates);
      } catch (e) {
        console.log(`invalid update request from ${fullAddress}`);
      }
      syncPlayersPosition.call(this);
      break;
    }
    case 'disconnect': {
      sendMessageToOnlinePlayers.call(this, {
        msgObj: {
          type: 'disconnected',
          player: this.onlinePlayers[fullAddress],
        },
      });
      delete this.onlinePlayers[fullAddress];
      console.log(`player ${fullAddress} disconnected`);
      break;
    }
    default:
      console.log(`invalid message type from ${fullAddress}`);
  }
}
Server.prototype.messageHandler = onMessage;

function onListening() {
  const address = this.socket.address();
  console.log(`server listening ${address.address}:${address.port}`);
}
Server.prototype.onListening = onListening;

function registerEventListeners() {
  this.socket.on('error', onError.bind(this));
  this.socket.on('message', onMessage.bind(this));
  this.socket.on('listening', onListening.bind(this));
}
Server.prototype.registerEventListeners = registerEventListeners;

module.exports = Server;
