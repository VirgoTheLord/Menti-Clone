import React from "react";

const WaitingScreen = ({
  roomCode,
  playerName,
  connected,
  players,
  message,
}) => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Room: {roomCode}</h1>
      <p className="text-lg mb-4">Player: {playerName}</p>
      <p className="text-sm mb-6">
        WebSocket Status: {connected ? "Connected" : "Disconnected"}
      </p>
      <div className="mb-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">{message}</h2>
      </div>
      {players?.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">
            Players in Room ({players.length}):
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {players.map((p, i) => (
              <span
                key={i}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default WaitingScreen;
