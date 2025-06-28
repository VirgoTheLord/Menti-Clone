import React from "react";

const LoadingQuestion = ({ roomCode, playerName, quizStarted }) => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Room: {roomCode}
        </h1>
        <p className="text-lg mb-6">Player: {playerName}</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Waiting for question...</p>
        <p className="text-sm text-gray-500 mt-2">
          Quiz Started: {quizStarted ? "Yes" : "No"}
        </p>
      </div>
    </div>
  </div>
);

export default LoadingQuestion;
