import React from "react";

const Leaderboard = ({ leaderboard }) => {
  if (leaderboard.length === 0) return null;

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Live Leaderboard</h2>
      <div className="space-y-2">
        {leaderboard
          .sort((a, b) => b.score - a.score)
          .map((player, idx) => (
            <div
              key={player.name}
              className={`flex justify-between items-center p-3 rounded ${
                idx === 0
                  ? "bg-yellow-600"
                  : idx === 1
                  ? "bg-gray-600"
                  : idx === 2
                  ? "bg-orange-600"
                  : "bg-slate-700"
              }`}
            >
              <div className="flex items-center">
                <span className="font-bold mr-3">#{idx + 1}</span>
                <span>{player.name}</span>
                {idx === 0 && <span className="ml-2">👑</span>}
              </div>
              <span className="font-bold">{player.score} pts</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Leaderboard;
