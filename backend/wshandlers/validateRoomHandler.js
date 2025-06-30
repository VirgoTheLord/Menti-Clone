const { rooms, users } = require("../state");

function handleValidateRoom(socket, payload) {
  //get code and name from payload and destructure.
  const { code, name } = payload;
  const regex = /^[0-9]{4}-[0-9]{4}$/;

  //check the if the code is valid format using regex check to check if it is a number format in the form XXXX-XXXX

  if (!regex.test(code)) {
    return socket.send(
      JSON.stringify({
        type: "validation-response",
        payload: {
          valid: false,
          message: "Invalid room code format. Use XXXX-XXXX.",
        },
      })
    );
  }

  //checks if the rooms currently has the created room from the code, if not there invalidates.

  if (!rooms.includes(code)) {
    return socket.send(
      JSON.stringify({
        type: "validation-response",
        payload: {
          valid: false,
          message: "Room does not exist.",
        },
      })
    );
  }

  //creates user array instance for players if players array does not exist in room

  if (!users[code]) users[code] = [];

  //checks if the player with name already exists in room and invalidates if user is already present
  //helps ensure unique players with their player names in the room.

  const alreadyExists = users[code].some((u) => u.name === name);
  if (alreadyExists) {
    return socket.send(
      JSON.stringify({
        type: "validation-response",
        payload: {
          valid: false,
          message: "User with this name already exists in the room.",
        },
      })
    );
  }

  //if exists then initializes the user array instance for the player with name and a default score of 0
  //users in used for leaderboard and live score update with respect to players for a particular room.

  users[code].push({ name, score: 0 });
  console.log(`User "${name}" joined room ${code}`);

  //returns valid true which allow the page to go to the quiz waiting page.

  return socket.send(
    JSON.stringify({
      type: "validation-response",
      payload: {
        valid: true,
        message: "Room joined successfully.",
      },
    })
  );
}

module.exports = handleValidateRoom;
