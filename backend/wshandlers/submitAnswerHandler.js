const questions = require("../data/questions");

function handleSubmitAnswer(socket, payload) {
  //destructures answer and qid from payload
  const { answer, qid } = payload;
  //gets question filtered from the questions using qid
  const question = questions.find((q) => q.id === qid);

  //initial check to see id the question or answer exists or not
  if (!question || !answer) {
    return socket.send(
      JSON.stringify({
        type: "error",
        payload: { message: "Invalid question ID or answer" },
      })
    );
  }

  //this boolean is set to get the correct answer check from the given answer and questions.correctanswer.

  const isCorrect = answer === question.correctAnswer;

  //send appropriate response back according to if the answer is right or wrong.

  socket.send(
    JSON.stringify({
      type: "submit-answer-response",
      payload: {
        questionId: qid,
        correctAnswer: question.correctAnswer,
        selectedAnswer: answer,
        isCorrect,
        message: isCorrect ? "Correct!" : "Wrong!",
      },
    })
  );
}

module.exports = handleSubmitAnswer;
