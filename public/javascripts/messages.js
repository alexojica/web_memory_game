// @ts-nocheck

(function (exports) {
    exports.T_GAME_ABORTED = "GAME_ABORTED";
    exports.O_GAME_ABORTED = {
      type: exports.T_GAME_ABORTED,
    };
    exports.S_GAME_ABORTED = JSON.stringify(exports.O_GAME_ABORTED);

    exports.T_PLAYER_TYPE = "PLAYER-TYPE";
    exports.O_PLAYER_A = {
      type: exports.T_PLAYER_TYPE,
      data: "A",
    };
    exports.S_PLAYER_A = JSON.stringify(exports.O_PLAYER_A);

    exports.O_PLAYER_B = {
      type: exports.T_PLAYER_TYPE,
      data: "B",
    };
    exports.S_PLAYER_B = JSON.stringify(exports.O_PLAYER_B);

    exports.T_FIRST_MOVE = "FIRST-MOVE";
    exports.O_FIRST_MOVE = {
      type: exports.T_FIRST_MOVE,
      data: null,
      player: null
    };

    exports.T_SECOND_MOVE = "SECOND-MOVE";
    exports.O_SECOND_MOVE = {
      type: exports.T_SECOND_MOVE,
      first: null,
      second: null,
      player: null,
      score: null
    };

    exports.T_PLAYER_CHANGE = "PLAYER-CHANGE";
    exports.O_PLAYER_CHANGE = { 
      type: exports.T_PLAYER_CHANGE,
      to: null
    }

    exports.T_RANDOM_ARRAY = "RANDOM-ARRAY";
    exports.O_RANDOM_ARRAY = { 
      type: exports.T_RANDOM_ARRAY,
      data: null
    }

    exports.T_GAME_FINISHED = "WINNER";
    exports.O_GAME_FINISHED = {
      type: exports.T_GAME_FINISHED,
      score: null
    }

    exports.T_UPDATE_SCORE = "UPDATE-SCORE";
    exports.O_UPDATE_SCORE = {
      type: exports.T_UPDATE_SCORE,
      score: null
    }
  
    exports.T_GAME_START = "START GAME";
    exports.O_GAME_START = {
      type: exports.T_GAME_START,
    };
    exports.S_GAME_START = JSON.stringify(exports.O_GAME_START);
})(typeof exports === "undefined" ? (this.Messages = {}) : exports);
//if exports is undefined, we are on the client; else the server