const { roomScores, liveRooms } = require("../state");
const calculateScore = require("../utils/score");

function handleSetScores(socket, payload) {
  const { roomCode, playerName, timeTaken, isCorrect } = payload;
  if (!roomCode || !playerName) {
    return socket.send(
      JSON.stringify({
        type: "error",
        payload: { message: "Room code or player name not found" },
      })
    );
  }

  if (!roomScores[roomCode]) {
    roomScores[roomCode] = {};
  }

  const currentPlayer = roomScores[roomCode][playerName] || {
    score: 0,
    timeTaken: 0,
  };

  if (isCorrect) {
    currentPlayer.score += calculateScore(timeTaken);
  }
  currentPlayer.timeTaken += timeTaken;

  roomScores[roomCode][playerName] = currentPlayer;

  socket.send(
    JSON.stringify({
      type: "score-update",
      payload: {
        message: isCorrect ? "Score updated successfully" : "Answer is Wrong.",
      },
    })
  );

  const leaderboard = Object.entries(roomScores[roomCode])
    .map(([name, info]) => ({ name, ...info }))
    .sort((a, b) => b.score - a.score);

  liveRooms[roomCode]?.forEach((client) => {
    client.send(
      JSON.stringify({
        type: "leaderboard-update",
        payload: leaderboard,
      })
    );
  });
}

module.exports = handleSetScores;
