const express = require("express");
const questions = require("../data/questions");
const scores = require("../models/scoreModel");

const quizRouter = express.Router();

//caluclate the score based on the time when the answer is submitted
const calculateScore = (timeTaken) => {
  const totalTime = 10;
  const rough = totalTime - timeTaken;
  return Math.max(1, Math.round(rough));
};
quizRouter.get("/timer-update", (req, res) => {
  const timer = 10;
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

quizRouter.post("/set-scores", async (req, res) => {
  const { roomCode, playerName, timeTaken, isCorrect } = req.body;
  try {
    if (!roomCode || !playerName) {
      return res
        .status(400)
        .json({ error: "Room code or player name not found" });
    }
    const exist = await scores.findOne({ roomCode, playerName });
    if (exist) {
      if (isCorrect) {
        const score = calculateScore(timeTaken);
        exist.score += score;
        exist.timeTaken += timeTaken || 0; // Update timeTaken if provided
        await exist.save();
        return res.json({ message: "Score updated successfully" });
      } else {
        exist.timeTaken += timeTaken || 0;
        await exist.save();
        return res.json({ message: "Answer is Wrong." });
      }
    } else {
      const score = calculateScore(timeTaken);
      const newScore = new scores({
        roomCode,
        playerName,
        timeTaken: timeTaken || 0,
        score: isCorrect ? score : 0,
      });
      await newScore.save();
      return res.json({ message: "Score added successfully" });
    }
  } catch (error) {
    console.error("Error setting scores:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = quizRouter;
