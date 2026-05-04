const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = {};

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>⚔️ قتال أونلاين</title>

<style>
body {
  font-family: Arial;
  background: #111;
  color: white;
  text-align: center;
  padding: 25px;
}

.card {
  background: #222;
  padding: 18px;
  border-radius: 18px;
  margin: 15px auto;
  max-width: 330px;
}

.bar {
  height: 25px;
  background: #500;
  border-radius: 20px;
  overflow: hidden;
}

.hp {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #00ff75, #b8ff00);
}

button {
  font-size: 20px;
  padding: 12px 22px;
  border: none;
  border-radius: 14px;
  background: orange;
  margin: 8px;
  cursor: pointer;
}

.player {
  border: 1px solid #444;
  padding: 10px;
  margin: 8px;
  border-radius: 10px;
}
</style>
</head>

<body>

<h1>⚔️ قتال أونلاين</h1>

<div class="card">
  <h2>أنت</h2>
  <div class="bar"><div id="myHp" class="hp"></div></div>
</div>

<h2>اللاعبين</h2>
<div id="players"></div>

<h2 id="msg"></h2>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
let myId = null;
let allPlayers = {};

socket.on("connect", () => {
  myId = socket.id;
});

socket.on("players", (players) => {
  allPlayers = players;
  draw();
});

socket.on("message", (msg) => {
  document.getElementById("msg").innerText = msg;
});

function attack(id) {
  socket.emit("attack", id);
}

function draw() {
  const box = document.getElementById("players");
  box.innerHTML = "";

  if (allPlayers[myId]) {
    document.getElementById("myHp").style.width =
      allPlayers[myId].hp + "%";
  }

  Object.keys(allPlayers).forEach(id => {
    if (id === myId) return;

    const p = allPlayers[id];

    box.innerHTML += \`
      <div class="player">
        <b>لاعب</b>
        <div class="bar">
          <div class="hp" style="width:\${p.hp}%"></div>
        </div>
        <button onclick="attack('\${id}')">⚔️ هجوم</button>
      </div>
    \`;
  });
}
</script>

</body>
</html>
`);
});

io.on("connection", (socket) => {
  players[socket.id] = { hp: 100 };

  io.emit("players", players);

  socket.on("attack", (targetId) => {
    if (!players[targetId]) return;

    const damage = Math.floor(Math.random() * 15) + 5;
    players[targetId].hp -= damage;

    if (players[targetId].hp <= 0) {
      players[targetId].hp = 0;
      io.to(targetId).emit("message", "💀 خسرت!");
      io.to(socket.id).emit("message", "🏆 فزت!");
    }

    io.emit("players", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("players", players);
  });
});

server.listen(3000, () => {
  console.log("server running");
});
