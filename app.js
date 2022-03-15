const express = require("express");
const http = require("http");
const router = express.Router();
const websocket = require("ws");
const messages = require("./public/javascripts/messages");

const port = process.argv[2];
const app = express();

app.use(express.static(__dirname + "/public"));

router.get("/game", function(req, res) {
  res.sendFile("game.html", { root: "./public" });
});

app.set('view engine', 'ejs')
app.get('/', function(req, res) {
  res.render('splash.ejs', { gamesInitialized: gameStatus.gamesInitialized - 1, 
    gamesCompleted: gameStatus.gamesCompleted, 
    topScore: gameStatus.topScore });
})

app.get("/game", router);
app.get("/",router);

const server = http.createServer(app);
const wss = new websocket.Server({ server });
const Game = require("./game");
const gameStatus = require("./statTracker");

const websockets = {};
// websockets clean-up
setInterval(function() {
  for (let i in websockets) {
    if (Object.prototype.hasOwnProperty.call(websockets,i)) {
      let gameObj = websockets[i];
      //if the gameObj has a final status, the game is complete/aborted
      if (gameObj.finalStatus != null) {
        delete websockets[i];
      }
    }
  }
}, 50000);

let currentGame = new Game(gameStatus.gamesInitialized++);
let connectionID = 0; //each websocket receives a unique ID

wss.on("connection", function connection(ws){
  const con = ws;
  con["id"] = connectionID++;
  const playerType = currentGame.addPlayer(con);
  websockets[con["id"]] = currentGame;

  console.log(`Player ${con["id"]} placed in game ${currentGame.id} as ${playerType}`);

  con.send(playerType == "A" ? messages.S_PLAYER_A : messages.S_PLAYER_B);

  if (currentGame.hasTwoConnectedPlayers()) {
    currentGame = new Game(gameStatus.gamesInitialized++);
    let outgoingMsg = messages.O_RANDOM_ARRAY;
    outgoingMsg.data = websockets[con["id"]].randomArray;
    con.send(JSON.stringify(outgoingMsg));
    console.log("Starting game " + currentGame.id);
    websockets[con["id"]].playerA.send(messages.S_GAME_START);
  }

  con.on("message", function incoming(message) {
    const oMsg = JSON.parse(message.toString());

    const gameObj = websockets[con["id"]];
    const isPlayerA = gameObj.playerA == con ? true : false;

    console.log(message.toString());

    if(oMsg.type == messages.T_RANDOM_ARRAY) {
      let incomingMsg = JSON.parse(message.toString());
      gameObj.randomArray = incomingMsg.data;
    }

    if(gameObj.hasTwoConnectedPlayers()) {
      if(isPlayerA) {
        if(oMsg.type == messages.T_FIRST_MOVE || oMsg.type == messages.T_SECOND_MOVE || oMsg.type == messages.T_PLAYER_CHANGE) {
          gameObj.playerB.send(message.toString());
          gameObj.playerA.send(message.toString());
        }
        if(oMsg.type == messages.T_GAME_FINISHED) {
          gameObj.playerB.send(message.toString());
          const score = oMsg.score;
          if(gameStatus.topScore < score) gameStatus.topScore = score;
          gameStatus.gamesCompleted++;
        }
        if(oMsg.type == messages.T_UPDATE_SCORE) {
          gameObj.playerB.send(message.toString());
        }
      }
      else {
        if(oMsg.type == messages.T_FIRST_MOVE || oMsg.type == messages.T_SECOND_MOVE || oMsg.type == messages.T_PLAYER_CHANGE) {
          gameObj.playerA.send(message.toString());
          gameObj.playerB.send(message.toString());
        }
        if(oMsg.type == messages.T_GAME_FINISHED) {
          gameObj.playerA.send(message.toString());
          const score = oMsg.score;
          if(gameStatus.topScore < score) gameStatus.topScore = score;
        }
        if(oMsg.type == messages.T_UPDATE_SCORE) {
          gameObj.playerA.send(message.toString());
        }
      }
    }
  });

  con.on("close", function(code) {
    console.log(`${con["id"]} disconnected ...`);

    if(code == 1001) {
      const gameObj = websockets[con["id"]];
      try {
        gameObj.playerA.send(messages.S_GAME_ABORTED);
        gameObj.playerA.close();
        gameObj.playerA = null;
      } catch(e) {
        console.log("Player A closing: " + e);
      }
      try {
        gameObj.playerB.send(messages.S_GAME_ABORTED);
        gameObj.playerB.close();
        gameObj.playerB = null;
      } catch(e) {
        console.log("Player B closing: " + e);
      }
    }
  });
});

server.listen(port);