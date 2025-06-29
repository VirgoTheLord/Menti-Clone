const { liveRooms, roomScores, users } = require("../state");
const questions = require("../data/questions");

function broadcast(roomCode, messages) {
  if (!liveRooms[roomCode]) return;
  liveRooms[roomCode].forEach((client) => {
    messages.forEach((msg) => {
      client.send(JSON.stringify(msg));
    });
  });
}

function handleAdmin(socket, payload, type) {
  const { roomCode, qid } = payload;
  if (!roomCode || !liveRooms[roomCode]) return;

  switch (type) {
    case "admin-start": {
      console.log(`Admin started quiz for room ${roomCode}`);
      const question = questions.find((q) => q.id === 1);
      if (question) {
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
      }
      break;
    }

    case "admin-next-question": {
      const question = questions.find((q) => q.id === qid);
      if (question) {
        const { correctAnswer, ...safeQuestion } = question;
        broadcast(roomCode, [
          {
            type: "new-question",
            payload: safeQuestion,
            totalQuestions: questions.length,
          },
        ]);
        console.log(`Sent question ${qid} to room ${roomCode}`);
      }
      break;
    }

    case "admin-end": {
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
      console.log(`Admin reset quiz for room ${roomCode}`);

      if (roomScores[roomCode]) delete roomScores[roomCode];
      if (users[roomCode]) users[roomCode] = [];

      const adminSockets = liveRooms[roomCode].filter(
        (client) => client.isAdmin
      );
      const playerSockets = liveRooms[roomCode].filter(
        (client) => !client.isAdmin
      );

      // Notify and close player sockets
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
        setTimeout(() => client.close(), 1000);
      });

      // Keep only admin sockets
      liveRooms[roomCode] = adminSockets;

      // Notify admins
      adminSockets.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "quiz-reset",
            payload: {
              message: "Quiz reset successfully.",
              playersCleared: playerSockets.length,
            },
          })
        );
      });

      break;
    }
  }
}

module.exports = handleAdmin;
