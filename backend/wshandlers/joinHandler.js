const { liveRooms } = require("../state");

function handleJoin(socket, payload) {
  //set the playername roomscode and admin stattus from payload.
  const { roomCode, playerName, isAdmin } = payload;
  socket.roomCode = roomCode;
  socket.playerName = playerName;
  socket.isAdmin = isAdmin || false;

  //if the room is not live create a room with payload roomcode.

  if (!liveRooms[roomCode]) liveRooms[roomCode] = [];

  //check for existing player in room using playername

  const existingPlayerIndex = liveRooms[roomCode].findIndex(
    (client) => client.playerName === playerName
  );

  //if player does not exist add players socket to the room with current roomcode.

  if (existingPlayerIndex !== -1) {
    liveRooms[roomCode][existingPlayerIndex] = socket;
  } else {
    liveRooms[roomCode].push(socket);
  }

  //fetch the whole players that are currently in the room by ensuiring every admin naming convention and map to client.playername
  //to showcase how many players are currently in the room.

  const currentPlayers = liveRooms[roomCode]
    .filter(
      (client) =>
        !client.isAdmin &&
        client.playerName !== "__admin__" &&
        !client.playerName?.startsWith("admin_")
    )
    .map((client) => client.playerName);

  //this is realtime broadcast to tell every socket that has joined the room the total number of current players and their names.
  //playername says currentplayername and currentplayers has every player in the room instance.

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
  // log to show the entry of a player.

  console.log(`${playerName} joined room ${roomCode}`);
}

module.exports = handleJoin;
