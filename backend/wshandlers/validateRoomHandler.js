const { rooms, users } = require("../state");

function handleValidateRoom(socket, payload) {
  const { code, name } = payload;
  const regex = /^[0-9]{4}-[0-9]{4}$/;

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

  if (!users[code]) users[code] = [];

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

  users[code].push({ name, score: 0 });
  console.log(`User "${name}" joined room ${code}`);

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
