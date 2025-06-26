const express = require("express");
const questions = require("../data/questions");

const fetchQuestionRouter = express.Router();

fetchQuestionRouter.get("/:qid", (req, res) => {
  const questionId = parseInt(req.params.qid, 10);
  const question = questions.find((q) => q.id === questionId);

  if (question) {
    const { correctAnswer, ...safeQuestion } = question; // Don't send answer
    res.json(safeQuestion);
  } else {
    res.status(404).json({ error: "Question not found" });
  }
});

module.exports = fetchQuestionRouter;
