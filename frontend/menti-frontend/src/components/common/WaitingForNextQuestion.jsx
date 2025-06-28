import React from "react";

const WaitingForNextQuestion = ({
  roomCode,
  playerName,
  result,
  leaderboard,
}) => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Room: {roomCode}
        </h1>
        <p className="text-lg mb-6">Player: {playerName}</p>

        <div className="mb-6">
          <div
            className={`text-2xl font-bold mb-4 ${
              result?.isCorrect ? "text-green-600" : "text-red-600"
            }`}
          >
            {result?.message}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Your answer: {result?.selectedAnswer}
            </p>
            <p className="text-sm text-gray-600">
              Correct answer: {result?.correctAnswer}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="animate-pulse">
            <div className="h-2 bg-blue-200 rounded-full mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Waiting for Next Question...
            </h2>
            <p className="text-gray-600">
              The admin will send the next question shortly.
            </p>
          </div>
        </div>

        {leaderboard?.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Current Standings:</h3>
            <div className="space-y-2">
              {leaderboard
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map(({ name, score }, idx) => (
                  <div
                    key={name}
                    className={`flex justify-between items-center px-3 py-2 rounded ${
                      name === playerName
                        ? "bg-blue-100 font-semibold"
                        : "bg-white"
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2 text-sm text-gray-500">
                        #{idx + 1}
                      </span>
                      {name}
                    </span>
                    <span className="font-semibold">{score}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default WaitingForNextQuestion;
