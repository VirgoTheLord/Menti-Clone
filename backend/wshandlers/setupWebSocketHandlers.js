// wsHandlers/setupWebSocketHandlers.js
import joinHandler from "./joinHandler.js";
import questionHandler from "./fetchQuestionHandler.js";
import answerHandler from "./submitAnswerHandler.js";
import scoreHandler from "./setScoresHandler.js";
import adminHandler from "./adminHandler.js";
import leaveHandler from "./leaveHandler.js";

export default function setupWebSocketHandlers(socket, state) {
  socket.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "join" || data.type === "validate-room") {
      joinHandler(socket, data, state);
    }

    if (data.type === "fetch-question") {
      questionHandler(socket, data);
    }

    if (data.type === "submit-answer") {
      answerHandler(socket, data);
    }

    if (data.type === "set-scores") {
      scoreHandler(socket, data, state);
    }

    if (
      data.type === "admin-start" ||
      data.type === "admin-next-question" ||
      data.type === "admin-end" ||
      data.type === "admin-reset"
    ) {
      adminHandler(socket, data, state);
    }

    if (data.type === "leave") {
      leaveHandler(socket, data, state);
    }
  });

  socket.on("close", () => {
    const { roomCode, playerName, isAdmin } = socket;
    leaveHandler(
      socket,
      { type: "leave", payload: { roomCode, playerName } },
      state,
      isAdmin
    );
  });

  socket.on("error", (err) => {
    console.error("WebSocket error:", err);
    socket.emit("close");
  });
}
