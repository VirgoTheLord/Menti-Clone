const express = require("express");
const questions = require("../data/questions"); // Assuming you have a questions data file

const quizRouter = express.Router();

quizRouter.get("/timer-update", (req, res) => {
  const timer = 25;
  res.json({ timer });
});
quizRouter.post("/submit-answer", (req, res) => {
  const { answer } = req.body;
  const questionId = parseInt(req.body.qid, 10);
  const question = questions.find((q) => q.id === questionId);

  if (!question || !answer) {
    return res.status(400).json({ error: "Invalid question ID or answer" });
  }

  const isCorrect = answer === question.correctAnswer;

  return res.json({
    questionId,
    correctAnswer: question.correctAnswer,
    selectedAnswer: answer,
    isCorrect,
    message: isCorrect ? "Correct!" : "Wrong!",
  });
});

module.exports = quizRouter;
