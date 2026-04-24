const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {};
const STEP = 3;

io.on("connection", (socket) => {
  console.log("Connect:", socket.id);

  // CREATE ROOM
  socket.on("createRoom", (playerName) => {
    console.log("createRoom called with playerName:", playerName);
    const roomId = Math.random().toString(36).substring(2, 7);

    rooms[roomId] = {
      players: { A: socket.id, B: null },
      playerNames: { A: playerName, B: null },
      readyState: { A: false, B: false },
      rematchRequest: { A: false, B: false },
      gameStarted: false,
      position: 50,
      winner: null,
    };

    console.log("Room created:", rooms[roomId]);

    socket.join(roomId);

    socket.emit("roomCreated", roomId);
    socket.emit("role", "A");
    socket.emit("state", rooms[roomId]);
  });

  // JOIN ROOM
  socket.on("joinRoom", (roomId, playerName) => {
    const room = rooms[roomId];

    if (!room) {
      socket.emit("notFound");
      return;
    }

    if (room.players.B) {
      socket.emit("full");
      return;
    }

    room.players.B = socket.id;
    room.playerNames.B = playerName;
    socket.join(roomId);

    socket.emit("role", "B");
    
    // Emit state to all players so A knows B's name
    io.to(roomId).emit("state", room);
    io.to(roomId).emit("playerJoined");
  });

  // PLAYER READY
  socket.on("playerReady", () => {
    let roomId = [...socket.rooms][1];
    const room = rooms[roomId];
    if (!room) return;

    const player =
      socket.id === room.players.A
        ? "A"
        : socket.id === room.players.B
        ? "B"
        : null;

    if (!player) return;

    room.readyState[player] = true;
    io.to(roomId).emit("state", room);

    // If both players are ready, start countdown
    if (room.readyState.A && room.readyState.B && !room.gameStarted) {
      let count = 3;
      io.to(roomId).emit("countdown", count);

      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          io.to(roomId).emit("countdown", count);
        } else {
          clearInterval(countdownInterval);
          room.gameStarted = true;
          io.to(roomId).emit("gameStart");
          io.to(roomId).emit("state", room);
        }
      }, 1000);
    }
  });

  // REQUEST STATE (when client reconnects or mounts)
  socket.on("requestState", (roomId) => {
    const room = rooms[roomId];
    console.log("requestState:", roomId, room);
    if (!room) return;

    const player =
      socket.id === room.players.A
        ? "A"
        : socket.id === room.players.B
        ? "B"
        : null;

    if (player) {
      socket.emit("role", player);
      socket.emit("state", room);
    }
  });

  // GAME PLAY
  socket.on("pull", () => {
    let roomId = [...socket.rooms][1];
    const room = rooms[roomId];
    if (!room || room.winner) return;

    // Chưa đủ 2 người hoặc game chưa bắt đầu thì không cho kéo
    if (!room.players.A || !room.players.B) return;
    if (!room.gameStarted) return;

    const player =
      socket.id === room.players.A
        ? "A"
        : socket.id === room.players.B
        ? "B"
        : null;

    if (!player) return;

    if (player === "A") room.position -= STEP;
    else room.position += STEP;

    if (room.position <= 0) {
      room.position = 0;
      room.winner = "A";
    }

    if (room.position >= 100) {
      room.position = 100;
      room.winner = "B";
    }

    io.to(roomId).emit("state", room);
  });

  // REQUEST REMATCH
  socket.on("requestRematch", () => {
    let roomId = [...socket.rooms][1];
    const room = rooms[roomId];
    if (!room || !room.winner) return;

    const player =
      socket.id === room.players.A
        ? "A"
        : socket.id === room.players.B
        ? "B"
        : null;

    if (!player) return;

    room.rematchRequest[player] = true;
    io.to(roomId).emit("state", room);

    // If both players want rematch, reset the game
    if (room.rematchRequest.A && room.rematchRequest.B) {
      room.position = 50;
      room.winner = null;
      room.readyState = { A: false, B: false };
      room.rematchRequest = { A: false, B: false };
      room.gameStarted = false;
      io.to(roomId).emit("gameReset");
      io.to(roomId).emit("state", room);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnect:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("🚀 Server chạy http://localhost:3001");
});