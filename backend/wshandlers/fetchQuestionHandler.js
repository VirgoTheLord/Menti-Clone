export function handleFetchQuestion(socket, { qid }, questions) {
  const questionId = parseInt(qid, 10);
  const question = questions.find((q) => q.id === questionId);

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

export default handleFetchQuestion;
