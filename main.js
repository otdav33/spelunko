var c; //canvas context
var dialog; //dialog box
var map = []; //[y][x] AKA [r][c]
const TILES = {
  "air": 0,
  "stone": 1,
  "ice": 2,
  "lava": 3,
  "water": 4,
}
const TILECOLORS = {
  0: "#dddddd",
  1: "#555555",
  2: "#aaaaff",
  3: "#ff0000",
  4: "#000099",
}
const MAPWIDTH = 500;
const MAPHEIGHT = 100;
const TILESIZE = 16;
const PLAYERCOLOR = "#00ff00";
const COMPANIONCOLOR = "#ff00ff";
const ENEMYCOLOR = "#ff0000";
var viewL = 190;//left of view
var viewT = 490;//top of view
var viewR = 0;//auto-updated; change viewL
var viewB = 0;//auto-updated; change viewT
var playerX = MAPWIDTH/5;
var playerY = MAPHEIGHT/2;
var lastX = (MAPWIDTH/5)-2;
var lastY = MAPHEIGHT/2;
var companionX = (MAPWIDTH/5)-3;
var companionY = MAPHEIGHT/2;
var tick = 0;
var dialogMode = false;
var refresh; //game tick setInterval thing

const DIALOG = [
  "Hmm... I am completely lost. It's all ice and rocks and they all look the same. Where did we even come from? (Press space to advance dialog and the arrow keys or WASD to move)",
  "I think we should try exploring to see if we find anything.",
  "I think we're getting closer.",
  "Neat. There's some lava here. Wait. It's leaking! RUN!",
  "I think if we time it right, we can get through the ice right after the lava melts it into water.",
  "I'm stuck.",
  "Congratulations. You made it to the end of the game."
];
var dialogNumber = 0;
var dialogChars;
var doneWithDialog = false;
var addCharInterval;

function addCharToDialog() {
  dialog.innerHTML += DIALOG[dialogNumber][dialogChars];
  dialogChars++;
  if (DIALOG[dialogNumber].length == dialogChars) {
    doneWithDialog = true;
    clearInterval(addCharInterval);
  }
}

function keyDownOnDialog(e) {
  var k = e.key;
  if (k != "w" && k != "ArrowUp" && k != "a" && k != "ArrowLeft" && k != "s" && k != "ArrowDown" && k != "d" && k != "ArrowRight") {
    if (doneWithDialog) {
      //dialog done, return to normal gameplay
      dialogMode = false;
      resize();
      drawMap();
      if (dialogNumber == 0) {
        setTimeout(doDialog, 5000);
      }
      refresh = setInterval(gameTick, 100);
      dialog.innerHTML = "";
      window.onkeydown = keyDown;
      dialogNumber++;
    } else {
      //FF dialog
      clearInterval(addCharInterval);
      dialog.innerHTML = DIALOG[dialogNumber]
      doneWithDialog = true;
    }
  }
}

function doDialog() {
  clearInterval(refresh);
  dialog.innerHTML = "";
  dialogMode = true;
  doneWithDialog = false;
  dialogChars = 0;
  resize();
  drawMap();
  addCharInterval = setInterval(addCharToDialog, 10);
  if (dialogNumber == 6) {
    window.onkeydown = "";
  } else {
    window.onkeydown = keyDownOnDialog;
  }
}

function resize(){
  var iw = window.innerWidth - 16;
  if (dialogMode) {
    var ih = window.innerHeight - 32 - 128;
    dialog.style.height = "128px";
  } else {
    var ih = window.innerHeight - 32;
    dialog.style.height = "0px";
  }
  var mw = TILESIZE * MAPWIDTH;
  var mh = TILESIZE * MAPHEIGHT;
  c.canvas.width  = iw < mw ? iw : mw;
  c.canvas.height = ih < mh ? ih : mh;
  viewR = viewL + Math.ceil(c.canvas.width / TILESIZE);
  viewB = viewT + Math.ceil(c.canvas.height / TILESIZE);
}

function drawMap() {
  for (let y = viewT; y < viewB; y++) {
    for (let x = viewL; x < viewR; x++) {
      if (y < 0 || x < 0 || x >= MAPWIDTH || y >= MAPHEIGHT) {
        //off map
        c.fillStyle = "#ffffff";
      } else {
        c.fillStyle = TILECOLORS[map[y][x]];
      }
      c.fillRect((x-viewL)*TILESIZE, (y-viewT)*TILESIZE, TILESIZE, TILESIZE);
    }
  }
  c.fillStyle = PLAYERCOLOR;
  c.fillRect((playerX-viewL)*TILESIZE, (playerY-viewT)*TILESIZE, TILESIZE, TILESIZE);
  c.fillStyle = COMPANIONCOLOR;
  c.fillRect((companionX-viewL)*TILESIZE, (companionY-viewT)*TILESIZE, TILESIZE, TILESIZE);
}

function tryMove(x, y){
  var dest = map[y][x];
  if (dest == TILES["air"] || dest == TILES["water"]) {
    //can move
    if (dialogNumber < 6 ) { 
      if (x == companionX && y == companionY) {
        //moving into companion
        companionX = playerX;
        companionY = playerY;
      } else if (!(lastX == x && lastY == y)) {
        //player moves back
        companionX = lastX;
        companionY = lastY;
      }
    }
    lastX = playerX;
    lastY = playerY;
    playerX = x;
    playerY = y;
    viewL = x - Math.floor((viewR - viewL)/2);
    viewT = y - Math.floor((viewB - viewT)/2);
    resize();
  }
}

function keyDown(e) {
  var k = e.key;
  resize();
  if (k == "w" || k == "ArrowUp") {
    tryMove(playerX, playerY - 1);
  } else if (k == "a" || k == "ArrowLeft" ) {
    tryMove(playerX - 1, playerY);
  } else if (k == "s" || k == "ArrowDown" ) {
    tryMove(playerX, playerY + 1);
  } else if (k == "d" || k == "ArrowRight" ) {
    tryMove(playerX + 1, playerY);
  }
  drawMap();
}

function gameTick() {
  for (let y = 0; y < MAPHEIGHT; y++) {
    for (let x = 0; x < MAPWIDTH; x++) {
      if (map[y][x] == TILES["lava"] && tick % 2 == 0) {
        //spread lava
        if (map[y][x+1] == TILES["air"]) {
          map[y][x+1] = TILES["lava"];
        } else if (map[y][x-1] == TILES["air"]) {
          map[y][x-1] = TILES["lava"];
        } else if (map[y+1][x] == TILES["air"]) {
          map[y+1][x] = TILES["lava"];
        } else if (map[y-1][x] == TILES["air"]) {
          map[y-1][x] = TILES["lava"];
          //turn to water if ice next to lava:
        } else if (map[y][x+1] == TILES["ice"]) {
          map[y][x+1] = TILES["water"];
        } else if (map[y][x-1] == TILES["ice"]) {
          map[y][x-1] = TILES["water"];
        } else if (map[y+1][x] == TILES["ice"]) {
          map[y+1][x] = TILES["water"];
        } else if (map[y-1][x] == TILES["ice"]) {
          map[y-1][x] = TILES["water"];
        } else if (map[y][x+1] == TILES["water"] || map[y][x-1] == TILES["water"] || map[y+1][x] == TILES["water"] || map[y-1][x] == TILES["water"]) {
          //turn to stone if next to water
          map[y][x] = TILES["stone"];
        }
      } else if (map[y][x] == TILES["water"]) {
        //turn to water if ice next to water
        if (map[y][x+1] == TILES["ice"]) {
          map[y][x+1] = TILES["water"];
        } else if (map[y][x-1] == TILES["ice"]) {
          map[y][x-1] = TILES["water"];
        } else if (map[y+1][x] == TILES["ice"]) {
          map[y+1][x] = TILES["water"];
        } else if (map[y-1][x] == TILES["ice"]) {
          map[y-1][x] = TILES["water"];
        }
      }
    }
  }
  resize();
  drawMap();
  tick += 1;
  if (dialogNumber == 2 && playerX > MAPWIDTH/2) {
    doDialog();
  }
  if (dialogNumber == 3 && playerX > MAPWIDTH-Math.floor((viewR - viewL)/2)) {
    doDialog();
    map[playerY-1][MAPWIDTH-3] = 0; //open floodgates
    map[playerY][MAPWIDTH-3] = 0; //open floodgates
    map[playerY+1][MAPWIDTH-3] = 0; //open floodgates
  }
  if (dialogNumber == 4 && playerX < MAPWIDTH/4) {
    doDialog();
  }
  if (dialogNumber == 5 && playerX < MAPWIDTH/4.5) {
    doDialog();
  }
  if (playerY < 30) {
    doDialog();
  }
}

window.onkeydown = keyDown;

window.onload = function(){
  var can = document.getElementById("can");
  dialog = document.getElementById("dialog");
  c = can.getContext("2d");
  c.fillStyle = "#dddddd";
  c.fillRect(0, 0, 16, 16);
  for (let y = 0; y < MAPHEIGHT; y++) {
    let row = [];
    for (let x = 0; x < MAPWIDTH; x++) {
      if (Math.random() * 10 < 1) {
        //1/10 chance
        if (x < MAPWIDTH - 3) {
          row[x] = TILES["stone"];
        }
      } else {
        if (y == 0 || y == MAPHEIGHT-1 || x == 0 || x == MAPWIDTH-1) {
          row[x] = TILES["stone"];
        } else if (y < MAPHEIGHT / 2) {
          if (x < MAPWIDTH / 5) {
            row[x] = TILES["ice"];
          } else {
            row[x] = TILES["stone"];
          }
        } else if (x == MAPWIDTH - 3) {
          row[x] = TILES["stone"];
        } else if (x == MAPWIDTH - 2) {
          row[x] = TILES["lava"];
        } else {
          if (Math.random() * 100 < 1) {
            //1/100 chance
            row[x] = TILES["ice"];
          } else {
            //TODO most of the generation
            row[x] = TILES["air"];
          }
        }
      }
    }
    map[y] = row;
  }
  resize();
  tryMove(playerX, playerY);
  resize();
  drawMap();
  refresh = setInterval(gameTick, 100);
  doDialog();
}
