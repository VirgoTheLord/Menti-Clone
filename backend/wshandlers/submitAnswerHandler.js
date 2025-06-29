export function handleSubmitAnswer(socket, { answer, qid }, questions) {
  const question = questions.find((q) => q.id === qid);

  if (!question || !answer) {
    return socket.send(
      JSON.stringify({
        type: "error",
        payload: { message: "Invalid question ID or answer" },
      })
    );
  }

  const isCorrect = answer === question.correctAnswer;

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

export default handleSubmitAnswer;
