const { users, liveRooms, roomScores } = require("../state");

function handleLeave(socket, payload) {
  const roomCode = payload.roomCode || socket.roomCode;
  const playerName = payload.playerName || socket.playerName;

  if (roomCode && playerName) {
    if (users[roomCode]) {
      users[roomCode] = users[roomCode].filter((u) => u.name !== playerName);
      console.log(
        `Removed ${playerName} from users array for room ${roomCode}`
      );
    }

    if (liveRooms[roomCode]) {
      liveRooms[roomCode] = liveRooms[roomCode].filter((s) => s !== socket);

      const remainingPlayers = liveRooms[roomCode]
        .filter((client) => !client.isAdmin)
        .map((client) => client.playerName);

      liveRooms[roomCode].forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(
            JSON.stringify({
              type: "user-left",
              payload: {
                playerName,
                players: remainingPlayers,
                totalPlayers: remainingPlayers.length,
              },
            })
          );
        }
      });

      if (liveRooms[roomCode].length === 0) {
        delete liveRooms[roomCode];
        delete roomScores[roomCode];
        if (users[roomCode]) delete users[roomCode];
        console.log(`Room ${roomCode} deleted - no players remaining`);
      }
    }

    console.log(`${playerName} manually left room ${roomCode}`);
  }
}

module.exports = handleLeave;
