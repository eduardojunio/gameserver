function Player({ coordinates, ipAddress, portNumber }) {
  this.coordinates = coordinates;
  this.ipAddress = ipAddress;
  this.portNumber = portNumber;
}

function updateCoordinates({ x, y }) {
  this.coordinates = { x, y };
}
Player.prototype.updateCoordinates = updateCoordinates;

function getFullAddress() {
  return `${this.ipAddress}:${this.portNumber}`;
}
Player.prototype.getFullAddress = getFullAddress;

module.exports = Player;
