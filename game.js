//@ts-check
const websocket = require("ws");

const game = function(gameID) {
    this.playerA = null;
    this.playerB = null;
    this.id = gameID;
    this.randomArray = null;
}

game.prototype.hasTwoConnectedPlayers = function() {
    return this.playerB != null;
};

game.prototype.addPlayer = function(p) {
    if (this.playerA == null) {
      this.playerA = p;
      return "A";
    } else {
      this.playerB = p;
      return "B";
    }
};

module.exports = game;
  