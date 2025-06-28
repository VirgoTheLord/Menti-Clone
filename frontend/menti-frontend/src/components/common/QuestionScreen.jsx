import React from "react";

const QuestionScreen = ({
  roomCode,
  playerName,
  connected,
  qid,
  question,
  timeLeft,
  timerActive,
  selectedAnswer,
  setSelectedAnswer,
  handleSubmit,
  showResult,
  result,
}) => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Room: {roomCode}</h1>
        <p>Player: {playerName}</p>
        <p className="text-sm text-gray-600">
          WS Status: {connected ? "Connected" : "Disconnected"}
        </p>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Question {qid}</h2>
        <div className="text-gray-600 font-mono">
          Time left:{" "}
          <span
            className={`font-bold ${
              timeLeft <= 3 ? "text-red-600" : "text-blue-600"
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>
      <p className="text-lg mb-6 p-4 bg-gray-50 rounded-lg">{question.text}</p>
      <div className="space-y-4 mb-6">
        {question.options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              selectedAnswer === opt.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="answer"
              value={opt.id}
              checked={selectedAnswer === opt.id}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              className="sr-only"
              disabled={showResult || !timerActive}
            />
            <div
              className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                selectedAnswer === opt.id
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300"
              }`}
            >
              {selectedAnswer === opt.id && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <span>
              {opt.id.toUpperCase()}. {opt.text}
            </span>
          </label>
        ))}
      </div>
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleSubmit}
          disabled={showResult || !selectedAnswer}
          className={`py-3 px-8 rounded-md font-semibold transition-colors ${
            showResult || !selectedAnswer
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {showResult ? "Answer Submitted" : "Submit Answer"}
        </button>
        {showResult && result && (
          <div className="text-center">
            <p
              className={`text-lg font-bold ${
                result.isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.message}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default QuestionScreen;
