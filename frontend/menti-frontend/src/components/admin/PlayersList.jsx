import React from "react";

const PlayerList = ({ players }) => (
  <div className="mb-6">
    <h3 className="font-medium mb-2">Players Joined ({players.length}):</h3>
    {players.length > 0 ? (
      <ul className="bg-slate-700 rounded p-3 max-h-32 overflow-y-auto">
        {players.map((name, idx) => (
          <li key={idx} className="flex items-center py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            {name}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-400 italic">No players yet...</p>
    )}
  </div>
);

export default PlayerList;
