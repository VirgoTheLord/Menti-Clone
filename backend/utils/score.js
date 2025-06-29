// backend/utils/score.js
const calculateScore = (timeTaken) => {
  const totalTime = 10;
  const rough = totalTime - timeTaken;
  return Math.max(1, Math.round(rough));
};

module.exports = calculateScore;
