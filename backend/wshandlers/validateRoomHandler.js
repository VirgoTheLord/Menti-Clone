import { rooms, users } from "../state.js";

export function handleValidateRoom(socket, { code, name }) {
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
    rooms.push(code);
    console.log("Room created manually via code:", code);
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

  socket.send(
    JSON.stringify({
      type: "validation-response",
      payload: {
        valid: true,
        message: "Room joined successfully.",
      },
    })
  );
}
