// @ts-nocheck
const statusDisplay = document.querySelector('.game--status');
const clickSound = new Audio("../sounds/click.wav");

const scoreElt = document.querySelector("#score");
const opponentElt = document.querySelector("#opponent-score");
const themesElt = document.querySelector("#themes");
const boxElts = document.getElementsByClassName("box");
const mainElt = document.querySelector(".main");
const timeElt = document.querySelector("#time");
const postElt = document.querySelector("#post");
const finalElt = document.querySelector("#final");
const againElt = document.querySelector("#again");

againElt.addEventListener("click", resetGame);

var library = [
        '/images/1.jpg',
        '/images/2.png',
        '/images/3.png',
        '/images/4.png',
        '/images/5.png',
        '/images/6.jpg',
        '/images/7.jpg',
        '/images/8.png',
        '/images/9.jpg',
        '/images/10.png',
        '/images/1.jpg',
        '/images/2.png',
        '/images/3.png',
        '/images/4.png',
        '/images/5.png',
        '/images/6.jpg',
        '/images/7.jpg',
        '/images/8.png',
        '/images/9.jpg',
        '/images/10.png',
];

function GameState(socket) {
    this.playerType = null;
    this.gameActive = false;
    this.currentPlayer = null;
    this.socket = socket;

    this.currentPlayerTurn = function() { 
        if(this.currentPlayer == this.playerType) 
            return "It's your turn!";
        else return "It's your opponent's turn!"
    }

    this.images = [];
    this.current = -1;
    this.win = 0;
    this.score = 0;
    this.time = 0;
    this.second = false; //can choose 2nd picture
    this.first_id = 0;

    this.tempElt1 = undefined;
    this.tempElt2 = undefined;

};

GameState.prototype.getPlayerType = function () {
    return this.playerType;
};

GameState.prototype.setPlayerType = function (p) {
    this.playerType = p;
};

GameState.prototype.handlePlayerChange = function () {
    this.currentPlayer = this.currentPlayer === "A" ? "B" : "A";
    statusDisplay.innerHTML = this.currentPlayerTurn();
};

function GameBoard(gs) {
    this.initialize = function () {
      const elements = document.querySelectorAll(".box");
      Array.from(elements).forEach(function (el) {
        el.addEventListener("click", gs.nextClick);
        el.gamestate = gs;
      });
    }
};

GameState.prototype.nextClick = function(e) {
    if (e.target.classList.contains("play")) {
        const gs = e.target.gamestate;
        const cell = e.target;
        const cell_id = parseInt(cell.getAttribute('id'));
        if(gs.currentPlayer == gs.playerType) {
            gs.buttonClick(cell_id);
        }
    }
};

GameState.prototype.generateTheme = function() {
    let arr = [];
    for (let i = 0; i < 20; i++) {
        this.images.push(library[i]);
    }  
    for (let i = 0; i < 20; i++) {
      var rand = Math.floor(Math.random() * (this.images.length - 1));
      boxElts[i].innerHTML = "<img src='" + this.images[rand] + "' alt='image' class='hidden'>"; //rand
      this.images.splice(rand, 1); //rand
      arr[i] = rand; //rand
    }
    return arr;
  }
// activate the same theme as player A
GameState.prototype.activateTheme = function(randomArray) {
    for (let i = 0; i < 20; i++) {
        this.images.push(library[i]);
    }  
    for (let i = 0; i < 20; i++) {
      boxElts[i].innerHTML = "<img src='" + this.images[randomArray[i]] + "' alt='image' class='hidden'>";
      this.images.splice(randomArray[i], 1);
    }
  }

GameState.prototype.buttonClick = function (e) {
    clickSound.play();
    if(this.second == false) {
        let outgoingMsg = Messages.O_FIRST_MOVE;
        outgoingMsg.data = e;
        outgoingMsg.player = this.getPlayerType();
        this.socket.send(JSON.stringify(outgoingMsg));
    }
    else {
        let outgoingMsg = Messages.O_SECOND_MOVE;
        outgoingMsg.first = this.first_id;
        outgoingMsg.second = e;
        outgoingMsg.player = this.getPlayerType();
        this.socket.send(JSON.stringify(outgoingMsg));
    }
};

(function setup() {
    const socket = new WebSocket("ws://localhost:3000");

    const gs = new GameState(socket);

    const board = new GameBoard(gs);
    
    socket.onmessage = function (event) {
        console.log(event.data);
        let incomingMsg = JSON.parse(event.data);
        if(incomingMsg.type == Messages.T_PLAYER_TYPE) {
            gs.setPlayerType(incomingMsg.data);

            if(gs.getPlayerType() == "A") {
                gs.currentPlayer = gs.getPlayerType()
                statusDisplay.innerHTML = "Waiting for another player...";
                
                let randomArray = gs.generateTheme();
                board.initialize(gs);

                let outgoingMsg = Messages.O_RANDOM_ARRAY;
                outgoingMsg.data = randomArray;
                gs.socket.send(JSON.stringify(outgoingMsg));
            }
            else {
                gs.currentPlayer = "A";
                statusDisplay.innerHTML = gs.currentPlayerTurn();

                board.initialize(gs);
            }
        }

        if(incomingMsg.type == Messages.T_GAME_START) { //only received by player A
            statusDisplay.innerHTML = gs.currentPlayerTurn();
        }

        if(incomingMsg.type == Messages.T_RANDOM_ARRAY && gs.getPlayerType() == "B") {
            gs.activateTheme(incomingMsg.data);
        }

        if(incomingMsg.type == Messages.T_PLAYER_CHANGE) {
            gs.handlePlayerChange();
        }
        
        if(incomingMsg.type == Messages.T_UPDATE_SCORE) {
            opponentElt.innerHTML = incomingMsg.score;
        }

        if(incomingMsg.type == Messages.T_FIRST_MOVE ) {
            let e = document.getElementById(incomingMsg.data);
            if (e.classList.contains("play")) {
                e.firstChild.classList.remove("hidden");
                //first click
                if (gs.current < 1) {
                    gs.tempElt1 = e.target;
                    // timer
                    if (gs.current === -1) {
                        gs.timer = setInterval(function() {
                            gs.time++;
                            timeElt.innerHTML = gs.time;
                        }, 1000);
                    }
                    gs.current = 1;
                    gs.second = true;
                    gs.first_id = incomingMsg.data;
                }
            }
        }

        if(incomingMsg.type == Messages.T_SECOND_MOVE ) {
            let e = document.getElementById(incomingMsg.second);
            gs.tempElt1 = document.getElementById(incomingMsg.first);
            if (e.classList.contains("play")) {
                //second click
                gs.tempElt2 = e;
                gs.tempElt2.firstChild.classList.remove("hidden");
                //different images
                if (gs.tempElt1.firstChild.src !== gs.tempElt2.firstChild.src) {

                    const elements = document.querySelectorAll(".play");
                    Array.from(elements).forEach(function (el) {
                        el.removeEventListener("click", gs.nextClick);
                    });

                    setTimeout( function() {
                      gs.tempElt1.firstChild.classList.add("hidden");
                      gs.tempElt2.firstChild.classList.add("hidden");
                      gs.tempElt1.addEventListener("click", gs.nextClick);
                      gs.tempElt2.addEventListener("click", gs.nextClick);

                      const elements2 = document.querySelectorAll(".play");
                      Array.from(elements2).forEach(function (el) {
                          el.addEventListener("click", gs.nextClick);
                      });

                    }, 600);

                    if (gs.score > 0 && gs.currentPlayer == gs.getPlayerType()) {
                      gs.score -= 2;
                      let outgoingMsg = Messages.O_UPDATE_SCORE;
                      outgoingMsg.score = gs.score;
                      gs.socket.send(JSON.stringify(outgoingMsg));
                    }

                    scoreElt.innerHTML = gs.score.toString();
                    if(gs.currentPlayer == gs.getPlayerType()) {
                        let outgoingMsg = Messages.O_PLAYER_CHANGE;
                        outgoingMsg.to = gs.currentPlayer === "A" ? "B" : "A";
                        gs.socket.send(JSON.stringify(outgoingMsg));
                    }
                }
                //same images
                else {
                    if(gs.currentPlayer == gs.getPlayerType()) { 
                        gs.score += 10;
                        let outgoingMsg = Messages.O_UPDATE_SCORE;
                        outgoingMsg.score = gs.score;
                        gs.socket.send(JSON.stringify(outgoingMsg));
                    }
                    gs.win += 1;
                    gs.tempElt1.firstChild.classList.add("outlined");
                    gs.tempElt2.firstChild.classList.add("outlined");
                    gs.tempElt1.classList.remove("play");
                    gs.tempElt2.classList.remove("play");
                    scoreElt.innerHTML = gs.score.toString();
                    // game finished
                    if (gs.win == 10) {
                      let outgoingMsg = Messages.O_GAME_FINISHED;
                      outgoingMsg.score = gs.score;
                      gs.socket.send(JSON.stringify(outgoingMsg));
                    }
                }
                gs.current = 0;
            }
            gs.second = false;
        }

        if(incomingMsg.type == Messages.T_GAME_FINISHED) {
            clearInterval(gs.timer);
            let opponent_score = incomingMsg.score;
            if(gs.score > opponent_score) {
                finalElt.innerHTML = "You won! <br>Your score: " + gs.score + " points <br> Your opponent's score: " + opponent_score + " <br> Time: " + gs.time + " seconds";
            }
            else if(gs.score < opponent_score) {
                finalElt.innerHTML = "You lost! <br>Your opponent's score: " + opponent_score + " <br> Your score: " + gs.score + " points <br> Time: " + gs.time + " seconds";
            }
            else {
                finalElt.innerHTML = "Draw! You both scored " + gs.score + " points <br> Time: " + gs.time + " seconds";
            }
            postElt.classList.remove("hidden");
        }

        if(incomingMsg.type == Messages.T_GAME_ABORTED && postElt.classList.contains("hidden")) {
            clearInterval(gs.timer);
            finalElt.innerHTML = "Your opponent disconnected!";
            postElt.classList.remove("hidden");
        }
    };

    socket.onopen = function () {
        socket.send("{}");
    };
    socket.onclose = function () {
        console.log("closed " + socket);
    };

    socket.onerror = function () {};
})();

function resetGame() {
    location.reload(); //hack
}