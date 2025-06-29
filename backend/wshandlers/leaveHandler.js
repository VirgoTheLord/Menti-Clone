import { liveRooms, roomScores, users } from "../state.js";

export function handleLeave(
  socket,
  { roomCode, playerName, isAdmin, isDisconnect = false }
) {
  if (!roomCode || !liveRooms[roomCode]) return;

  if (users[roomCode] && playerName && !isAdmin) {
    users[roomCode] = users[roomCode].filter((u) => u.name !== playerName);
    console.log(`Removed ${playerName} from users array`);
  }

  liveRooms[roomCode] = liveRooms[roomCode].filter((s) => s !== socket);

  const remainingPlayers = liveRooms[roomCode]
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
    delete users[roomCode];
    console.log(`Room ${roomCode} deleted - no players remaining`);
  }

  console.log(
    `${playerName} ${isDisconnect ? "disconnected" : "left"} room ${roomCode}`
  );
}

export default handleLeave;
