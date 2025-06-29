export async function handleAdmin(socket, type, payload, questions) {
  const { roomCode, qid } = payload;

  switch (type) {
    case "admin-start": {
      if (!roomCode) return;
      console.log(`Admin started quiz for room ${roomCode}`);

      const question = questions.find((q) => q.id === 1);
      if (!question) return;
      const { correctAnswer, ...safeQuestion } = question;

      broadcast(roomCode, [
        {
          type: "quiz-started",
          payload: { message: "Quiz has been started!" },
        },
        {
          type: "new-question",
          payload: safeQuestion,
          totalQuestions: questions.length,
        },
      ]);
      break;
    }

    case "admin-next-question": {
      const question = questions.find((q) => q.id === qid);
      if (!roomCode || !question) return;
      const { correctAnswer, ...safeQuestion } = question;

      broadcast(roomCode, [
        {
          type: "new-question",
          payload: safeQuestion,
          totalQuestions: questions.length,
        },
      ]);
      console.log(`Sent question ${qid} to room ${roomCode}`);
      break;
    }

    case "admin-end": {
      if (!roomCode) return;
      broadcast(roomCode, [
        {
          type: "quiz-ended",
          payload: { message: "The quiz has ended!" },
        },
      ]);
      console.log(`Quiz ended in room ${roomCode}`);
      break;
    }

    case "admin-reset": {
      if (!roomCode) return;
      const { liveRooms, roomScores, users } = await import("../state.js");
      const room = liveRooms[roomCode];
      if (!room) return;

      delete roomScores[roomCode];
      users[roomCode] = [];

      const adminSockets = room.filter(
        (client) =>
          client.playerName === "__admin__" ||
          client.playerName?.startsWith("admin_")
      );

      const playerSockets = room.filter(
        (client) =>
          client.playerName !== "__admin__" &&
          !client.playerName?.startsWith("admin_")
      );

      playerSockets.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "quiz-reset",
            payload: {
              message: "Quiz has been reset. Please rejoin the room.",
              shouldReconnect: true,
            },
          })
        );
        setTimeout(() => {
          if (client.readyState === client.OPEN) client.close();
        }, 1000);
      });

      liveRooms[roomCode] = adminSockets;

      adminSockets.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "quiz-reset",
            payload: {
              message:
                "Quiz reset successfully. All players have been disconnected.",
              playersCleared: playerSockets.length,
            },
          })
        );
      });

      console.log(`Admin reset quiz for room ${roomCode}`);
      break;
    }
  }
}

function broadcast(roomCode, messages) {
  const { liveRooms } = globalThis;
  if (!liveRooms[roomCode]) return;
  liveRooms[roomCode].forEach((client) => {
    messages.forEach((msg) => {
      client.send(JSON.stringify(msg));
    });
  });
}

export default handleAdmin;
