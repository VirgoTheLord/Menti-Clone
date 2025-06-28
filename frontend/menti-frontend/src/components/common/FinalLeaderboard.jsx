import React from "react";

const FinalLeaderboard = ({ leaderboard, handleEndQuiz }) => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100 p-8">
    <div className="bg-white max-w-3xl rounded-lg shadow-lg p-8 w-full">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-600">
        🎉 Quiz Completed! 🎉
      </h1>
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Final Leaderboard
      </h2>
      {leaderboard?.length > 0 ? (
        <div className="mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Player</th>
                <th className="py-3 px-4 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <tr
                    key={p.name}
                    className={`border-b border-gray-200 ${
                      idx === 0
                        ? "bg-yellow-50 font-semibold"
                        : idx === 1
                        ? "bg-gray-50"
                        : idx === 2
                        ? "bg-orange-50"
                        : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      {idx === 0
                        ? "🥇"
                        : idx === 1
                        ? "🥈"
                        : idx === 2
                        ? "🥉"
                        : idx + 1}
                    </td>
                    <td className="py-3 px-4">{p.name}</td>
                    <td className="py-3 px-4">{p.score}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 mb-6">No scores available.</p>
      )}
      <div className="text-center">
        <button
          onClick={handleEndQuiz}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-md"
        >
          Return to Home
        </button>
      </div>
    </div>
  </div>
);

export default FinalLeaderboard;
