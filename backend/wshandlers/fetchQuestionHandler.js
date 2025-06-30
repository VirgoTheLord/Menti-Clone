const questions = require("../data/questions");

function handleFetchQuestion(socket, payload) {
  //this handler ensures the functionality of fetching the questions from the questions data we have hardcoded in the backend for now.
  const questionId = parseInt(payload.qid, 10);

  //using parsed question id to find question from questions.
  const question = questions.find((q) => q.id === questionId);

  //if the question exists we have to send it to the user
  //but we have to ensure sending only the question and not the answer.
  //hence we map everything to the safequestion variable other than the field correct answer.

  if (question) {
    const { correctAnswer, ...safeQuestion } = question;
    socket.send(
      JSON.stringify({
        type: "fetch-question-response",
        payload: safeQuestion,
        totalQuestions: questions.length,
      })
    );
  } else {
    socket.send(
      JSON.stringify({
        type: "error",
        payload: { message: "quiz-ended" },
      })
    );
  }
}

module.exports = handleFetchQuestion;
