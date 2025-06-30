const { roomScores, liveRooms } = require("../state");
const calculateScore = require("../utils/score");

function handleSetScores(socket, payload) {
  //destructures roomcode player time and boolean from payload.
  const { roomCode, playerName, timeTaken, isCorrect } = payload;

  //if no roomcode or playername error
  if (!roomCode || !playerName) {
    return socket.send(
      JSON.stringify({
        type: "error",
        payload: { message: "Room code or player name not found" },
      })
    );
  }

  //if no roomscoes object for room , create one to hold the roomscores.

  if (!roomScores[roomCode]) {
    roomScores[roomCode] = {};
  }

  //for the current player , lets set the score 0 and time 0 , if exists then the object

  const currentPlayer = roomScores[roomCode][playerName] || {
    score: 0,
    timeTaken: 0,
  };

  //now we use the destructured is correct boolean to add scores using the calculate score function
  //which basically just calulates the scores based on time taken as the more timetaken less score logic progressively

  if (isCorrect) {
    currentPlayer.score += calculateScore(timeTaken);
  }
  //time taken is uniform and hence is not boolean checked
  currentPlayer.timeTaken += timeTaken;

  //add  curretplayer to the roomcode playername array

  roomScores[roomCode][playerName] = currentPlayer;

  //send correct update

  socket.send(
    JSON.stringify({
      type: "score-update",
      payload: {
        message: isCorrect ? "Score updated successfully" : "Answer is Wrong.",
      },
    })
  );

  //here into leaderboard we get the entries from the roomscores for the roomcode
  //we then map the everything other than into info variable
  //also a sort functionality to sort in descending order.

  const leaderboard = Object.entries(roomScores[roomCode])
    .map(([name, info]) => ({ name, ...info }))
    .sort((a, b) => b.score - a.score);

  //send the leaderbord object to every client
  //to show the leaderboard 1.after every qn
  // and 2.to shows the leaderboad at the admin
  // and 3.to show the leaderboad at the end
  //updates after each question ensuring liveupdate.

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
