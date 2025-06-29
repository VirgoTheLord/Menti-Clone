import { liveRooms } from "../state.js";

export function handleJoin(socket, { roomCode, playerName, isAdmin }) {
  socket.roomCode = roomCode;
  socket.playerName = playerName;
  socket.isAdmin = isAdmin || false;

  if (!liveRooms[roomCode]) liveRooms[roomCode] = [];

  const existingIndex = liveRooms[roomCode].findIndex(
    (client) => client.playerName === playerName
  );

  if (existingIndex !== -1) {
    liveRooms[roomCode][existingIndex] = socket;
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

export default handleJoin;
