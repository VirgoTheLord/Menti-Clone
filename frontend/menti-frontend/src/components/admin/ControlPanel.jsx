import React from "react";

const ControlPanel = ({
  connected,
  adminJoined,
  started,
  quizEnded,
  players,
  currentQuestionId,
  handleStart,
  handleNext,
  handleEnd,
  resetQuiz,
}) => {
  return (
    <div className="space-y-3">
      {!started && !quizEnded && (
        <button
          onClick={handleStart}
          disabled={!connected || !adminJoined || players.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
        >
          {!connected || !adminJoined
            ? "Connecting..."
            : players.length === 0
            ? "Waiting for Players..."
            : "Start Quiz"}
        </button>
      )}

      {started && (
        <div className="space-y-2">
          <button
            onClick={handleNext}
            disabled={!connected || !adminJoined}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Next Question ({currentQuestionId + 1})
          </button>
          <button
            onClick={handleEnd}
            disabled={!connected || !adminJoined}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            End Quiz
          </button>
        </div>
      )}

      {quizEnded && (
        <button
          onClick={resetQuiz}
          className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-medium transition-colors"
        >
          Reset for New Quiz
        </button>
      )}
    </div>
  );
};

export default ControlPanel;
