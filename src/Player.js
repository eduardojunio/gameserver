class Player {
  constructor({ coordinates, ipAddress, portNumber }) {
    this.coordinates = coordinates;
    this.ipAddress = ipAddress;
    this.portNumber = portNumber;
  }

  updateCoordinates({ x, y }) {
    this.coordinates = { x, y };
  }

  getFullAddress() {
    return `${this.ipAddress}:${this.portNumber}`;
  }
}

module.exports = Player;
