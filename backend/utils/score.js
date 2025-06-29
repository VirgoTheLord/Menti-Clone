export const calculateScore = (timeTaken) => {
  const totalTime = 10;
  return Math.max(1, Math.round(totalTime - timeTaken));
};
