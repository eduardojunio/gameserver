const Player = require('./Player');

class Server {
  constructor({ socket, portNumber = 41234 }) {
    this.socket = socket;
    this.portNumber = portNumber;
    this.onlinePlayers = {};
  }

  startServer(portNumber) {
    this.socket.bind(portNumber || this.portNumber);
  }

  sendMessageToPlayer({ msgObj, player }) {
    this.socket.send(JSON.stringify(msgObj), player.portNumber, player.ipAddress, (err) => {
      if (err) {
        console.log(`failed to send message to ${player.getFullAddress()}\n
          error: ${err}`);
      }
    });
  }

  sendMessageToOnlinePlayers({ msgObj }) {
    for (const fullAddress in this.onlinePlayers) {
      if (Object.prototype.hasOwnProperty.call(this.onlinePlayers, fullAddress)) {
        this.sendMessageToPlayer({
          msgObj,
          player: this.onlinePlayers[fullAddress],
        });
      }
    }
  }

  syncPlayersPosition() {
    this.sendMessageToOnlinePlayers({
      msgObj: {
        type: 'sync',
        onlinePlayers: this.onlinePlayers,
      },
    });
  }

  onError(err) {
    console.log(`server error:\n${err.stack}`);
    this.socket.close();
  }

  syncOnlinePlayers({ player }) {
    this.sendMessageToPlayer({
      msgObj: {
        type: 'syncOnlinePlayers',
        onlinePlayers: this.onlinePlayers,
      },
      player,
    });
  }

  connectPlayer({ coordinates, ipAddress, portNumber }) {
    const player = new Player({ coordinates, ipAddress, portNumber });
    this.onlinePlayers[player.getFullAddress()] = player;
    this.sendMessageToOnlinePlayers({
      msgObj: {
        type: 'connected',
        player,
      },
    });
    return player;
  }

  onMessage(msg, rinfo) {
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
        const player = this.connectPlayer({
          coordinates: {
            x: 0,
            y: 0,
          },
          ipAddress: rinfo.address,
          portNumber: rinfo.port,
        });
        this.syncOnlinePlayers({ player });
        console.log(`player ${fullAddress} connected`);
        break;
      }
      case 'update': {
        try {
          this.onlinePlayers[fullAddress].updateCoordinates(coordinates);
        } catch (e) {
          console.log(`invalid update request from ${fullAddress}`);
        }
        this.syncPlayersPosition();
        break;
      }
      case 'disconnect': {
        this.sendMessageToOnlinePlayers({
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

  onListening() {
    const address = this.socket.address();
    console.log(`server listening ${address.address}:${address.port}`);
  }

  registerEventListeners() {
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('listening', this.onListening.bind(this));
  }
}

module.exports = Server;
