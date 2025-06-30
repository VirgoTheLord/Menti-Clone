const { liveRooms, roomScores, users } = require("../state");
const questions = require("../data/questions");

//created a broadcast function to make like easier and ensure realtime updates.
//if no live room return
//for every client in the live room ensure the every message is sent to each and every instance in the liveroom.

function broadcast(roomCode, messages) {
  if (!liveRooms[roomCode]) return;
  liveRooms[roomCode].forEach((client) => {
    messages.forEach((msg) => {
      client.send(JSON.stringify(msg));
    });
  });
}

function handleAdmin(socket, payload, type) {
  //destructure roomcode and qid
  const { roomCode, qid } = payload;

  //no roomcode and liveroom instance for roomcode return.
  if (!roomCode || !liveRooms[roomCode]) return;

  //since we are handling mutiple message types using smae handler switch is implemented.

  switch (type) {
    //to start the quiz for all users.
    case "admin-start": {
      console.log(`Admin started quiz for room ${roomCode}`);
      const question = questions.find((q) => q.id === 1);
      if (question) {
        const { correctAnswer, ...safeQuestion } = question;
        //ideally we should use fetchquestion here but umm, we will solve it soon
        //now we send both message objects to everyone in the live room using broadcast.
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

    //used to set next question.
    //uses a new-question message to set the next question on the page.

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

    //used to end the quiz by admin
    //used by frontend to to show leaderboard screen after quiz ended.

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

    //additional reset functionality that works somehow but not really a requirement.

    case "admin-reset": {
      console.log(`Admin reset quiz for room ${roomCode}`);

      //remove users instance but does not delete so u can still use it for the next quiz
      //remove the scores fully cuz new scores for every quiz.

      if (roomScores[roomCode]) delete roomScores[roomCode];
      if (users[roomCode]) users[roomCode] = [];

      //get admin and player sockets using filter and isAdmin boolean which is set to the false by default for players and true for admins.

      const adminSockets = liveRooms[roomCode].filter(
        (client) => client.isAdmin
      );
      const playerSockets = liveRooms[roomCode].filter(
        (client) => !client.isAdmin
      );

      //broadcast to every player that quiz has been reset and ask to reconnect as we are reseting the room and scores
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

      //let admin sockets remain.
      liveRooms[roomCode] = adminSockets;

      //send a message to admin to ensure that the frontend is updated functionally to start the next quiz.
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
