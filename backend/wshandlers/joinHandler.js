// backend/wshandlers/joinHandler.js
const { liveRooms } = require("../state");

function handleJoin(socket, payload) {
  const { roomCode, playerName, isAdmin } = payload;
  socket.roomCode = roomCode;
  socket.playerName = playerName;
  socket.isAdmin = isAdmin || false;

  if (!liveRooms[roomCode]) liveRooms[roomCode] = [];

  const existingPlayerIndex = liveRooms[roomCode].findIndex(
    (client) => client.playerName === playerName
  );

  if (existingPlayerIndex !== -1) {
    liveRooms[roomCode][existingPlayerIndex] = socket;
  } else {
    liveRooms[roomCode].push(socket);
  }

  const currentPlayers = liveRooms[roomCode]
    .filter(
      (client) =>
        !client.isAdmin &&
        client.playerName !== "__admin__" &&
        !client.playerName?.startsWith("admin_")
    )
    .map((client) => client.playerName);

  liveRooms[roomCode].forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(
        JSON.stringify({
          type: "user-joined",
          payload: {
            playerName,
            players: currentPlayers,
            totalPlayers: currentPlayers.length,
          },
        })
      );
    }
  });

  console.log(`${playerName} joined room ${roomCode}`);
}

module.exports = handleJoin;
