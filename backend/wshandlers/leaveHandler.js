const { users, liveRooms, roomScores } = require("../state");

function handleLeave(socket, payload) {
  //destructuring and check for roomcode, get from socket or payload either works. Also similarly for playername.
  const roomCode = payload.roomCode || socket.roomCode;
  const playerName = payload.playerName || socket.playerName;

  //if roomcode and playername exists, then check if users has an object for the room
  //if yes, user filter to add all the users back to the user which does not have destructured playername.

  if (roomCode && playerName) {
    if (users[roomCode]) {
      users[roomCode] = users[roomCode].filter((u) => u.name !== playerName);
      console.log(
        `Removed ${playerName} from users array for room ${roomCode}`
      );
    }

    //check in liverooms for the roomcode
    //if exists filter out all players which does not correspond to given socket.

    if (liveRooms[roomCode]) {
      liveRooms[roomCode] = liveRooms[roomCode].filter((s) => s !== socket);
      //remaining players shows the players that are not filtered out and are not the admin

      const remainingPlayers = liveRooms[roomCode]
        .filter((client) => !client.isAdmin)
        .map((client) => client.playerName);

      //this broadcasts realtime the leaving of a player to log and ensure live concurrency when player leave to update the currentplayers and the other data

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

      //this is another concurrency ensurance to delete the room instance from the liverooms and roomscores
      //also delete the users roomcode object

      if (liveRooms[roomCode].length === 0) {
        delete liveRooms[roomCode];
        delete roomScores[roomCode];
        if (users[roomCode]) delete users[roomCode];
        console.log(`Room ${roomCode} deleted - no players remaining`);
      }
    }

    //if does not enter any of this criteria
    //accounts for redirect or other leaves other than from button related or not expected or accounted for.

    console.log(`${playerName} manually left room ${roomCode}`);
  }
}

module.exports = handleLeave;
