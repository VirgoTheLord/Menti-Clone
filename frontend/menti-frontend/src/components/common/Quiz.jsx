import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useWebSocket } from "../../utils/webSocketContext";

const Quiz = () => {
  const { id: roomCode } = useParams();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const playerName = queryParams.get("name");
  const navigate = useNavigate();

  const {
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    connected,
    addMessageHandler,
  } = useWebSocket();

  const [qid, setQid] = useState(1);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [players, setPlayers] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(null);

  // Quiz state management
  const [quizStarted, setQuizStarted] = useState(false);
  const [waitingForStart, setWaitingForStart] = useState(true);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Restore saved progress from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`quiz-${roomCode}`));
    if (saved) {
      if (saved.quizCompleted) {
        setQuizCompleted(true);
        setShowLeaderboard(true);
      } else {
        setQid(saved.qid || 1);
        setTimeLeft(saved.timeLeft || 10);
        setSelectedAnswer(saved.selectedAnswer || "");
        setTotalQuestions(saved.totalQuestions || null);
        setQuizStarted(saved.quizStarted || false);
        setWaitingForStart(!saved.quizStarted);
        // If we have a saved question, restore it
        if (saved.question) {
          setQuestion(saved.question);
        }
      }
    }
  }, [roomCode]);

  // WebSocket setup and message handling
  useEffect(() => {
    if (!roomCode || !playerName) return;

    connectWebSocket(roomCode);

    const handleMessage = (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data);
        console.log("Quiz received:", data);

        switch (data.type) {
          case "quiz-started":
            console.log("Quiz started by admin");
            setQuizStarted(true);
            setWaitingForStart(false);
            setWaitingForNext(false);
            break;

          case "new-question":
            console.log("New question received:", data.payload);
            setQuestion(data.payload);
            setQid(data.payload.id);
            setTimeLeft(10);
            setSelectedAnswer("");
            setShowResult(false);
            setResult(null);
            setTimerActive(true);
            setWaitingForNext(false);
            setQuizStarted(true); // Ensure quiz is marked as started
            setWaitingForStart(false);

            if (data.totalQuestions) setTotalQuestions(data.totalQuestions);

            // Save progress including the question
            const savedProgress = {
              qid: data.payload.id,
              question: data.payload, // Save the actual question
              quizCompleted: false,
              timeLeft: 10,
              selectedAnswer: "",
              totalQuestions: data.totalQuestions,
              quizStarted: true,
            };
            localStorage.setItem(
              `quiz-${roomCode}`,
              JSON.stringify(savedProgress)
            );
            break;

          case "submit-answer-response":
            console.log("Answer response:", data.payload);
            setResult(data.payload);
            setShowResult(true);
            setTimerActive(false);
            setWaitingForNext(true);

            // Send score update
            sendMessage("set-scores", {
              roomCode,
              playerName,
              timeTaken: 10 - timeLeft || 0,
              isCorrect: data.payload.isCorrect,
            });
            break;

          case "quiz-ended":
            console.log("Quiz ended by admin");
            setQuizEnded(true);
            setQuizCompleted(true);
            setShowLeaderboard(true);
            setTimerActive(false);

            // Save final state
            localStorage.setItem(
              `quiz-${roomCode}`,
              JSON.stringify({
                qid,
                quizCompleted: true,
                timeLeft: 0,
                selectedAnswer: "",
                totalQuestions,
                quizStarted: true,
              })
            );
            break;

          case "user-joined":
            // Filter out admin from display
            const realPlayers = data.payload.players.filter(
              (p) => p !== "__admin__"
            );
            setPlayers(realPlayers);
            console.log("Players updated:", realPlayers);
            break;

          case "score-update":
            console.log("Score update:", data.payload);
            break;

          case "leaderboard-update":
            console.log("Leaderboard update:", data.payload);
            setLeaderboard(data.payload);
            break;

          case "error":
            console.error("WebSocket error:", data.payload.message);
            break;

          default:
            console.log("Unhandled message type:", data.type);
            break;
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    const removeHandler = addMessageHandler(handleMessage);

    // Join the room after connection with a delay
    if (connected) {
      console.log("WebSocket connected, joining room...");
      const timer = setTimeout(() => {
        console.log("Sending join message:", { roomCode, playerName });
        sendMessage("join", { roomCode, playerName });
      }, 100);

      return () => {
        clearTimeout(timer);
        removeHandler();
      };
    }

    return () => {
      removeHandler();
    };
  }, [
    roomCode,
    playerName,
    connected,
    sendMessage,
    connectWebSocket,
    addMessageHandler,
    timeLeft,
  ]);

  // Timer countdown logic
  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && timerActive) {
      console.log("Time's up! Auto-submitting answer");
      setTimerActive(false);
      handleSubmit();
    }

    return () => clearInterval(interval);
  }, [timeLeft, timerActive]);

  const handleSubmit = () => {
    if (showResult || !question) {
      console.log(
        "Cannot submit: showResult =",
        showResult,
        "question =",
        question
      );
      return;
    }

    console.log("Submitting answer:", selectedAnswer || " ");
    setTimerActive(false);
    sendMessage("submit-answer", {
      qid: question.id,
      answer: selectedAnswer || " ",
    });
  };

  // Handler for ending quiz after leaderboard
  const handleEndQuiz = () => {
    setShowLeaderboard(false);
    setQuizCompleted(false);
    setQuizEnded(false);
    setQid(1);
    setQuestion(null);
    setSelectedAnswer("");
    setShowResult(false);
    setResult(null);
    setTimeLeft(10);
    setTimerActive(false);
    setPlayers([]);
    setLeaderboard(null);
    setQuizStarted(false);
    setWaitingForStart(true);
    setWaitingForNext(false);
    localStorage.removeItem(`quiz-${roomCode}`);
    navigate("/");
    disconnectWebSocket();
  };

  // Debug logging
  useEffect(() => {
    console.log("Current state:", {
      question: !!question,
      quizStarted,
      waitingForStart,
      waitingForNext,
      showResult,
      quizCompleted,
      showLeaderboard,
      connected,
    });
  }, [
    question,
    quizStarted,
    waitingForStart,
    waitingForNext,
    showResult,
    quizCompleted,
    showLeaderboard,
    connected,
  ]);

  // Final screen: Show leaderboard after quiz completes
  if (quizCompleted && showLeaderboard) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100 p-8">
        <div className="bg-white max-w-3xl rounded-lg shadow-lg p-8 w-full">
          <h1 className="text-3xl font-bold mb-6 text-center text-green-600">
            🎉 Quiz Completed! 🎉
          </h1>

          <h2 className="text-2xl font-semibold mb-4 text-center">
            Final Leaderboard
          </h2>

          {leaderboard && leaderboard.length > 0 ? (
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
                    .map(({ name, score }, idx) => (
                      <tr
                        key={name}
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
                        <td className="py-3 px-4">{name}</td>
                        <td className="py-3 px-4">{score}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 mb-6">
              No scores available.
            </p>
          )}

          <div className="text-center">
            <button
              onClick={handleEndQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-md transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for quiz to start
  if (waitingForStart && !quizStarted) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Room: {roomCode}
            </h1>
            <p className="text-lg mb-4">Player: {playerName}</p>
            <p className="text-sm mb-6">
              WebSocket Status: {connected ? "Connected" : "Disconnected"}
            </p>

            <div className="mb-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Waiting for Quiz to Start...
              </h2>
              <p className="text-gray-600">
                The admin will start the quiz shortly. Please wait.
              </p>
            </div>

            {players.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Players in Room ({players.length}):
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {players.map((player, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {player}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Waiting for next question
  if (waitingForNext && showResult) {
    return (
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

              {result && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Your answer: {result.selectedAnswer}
                  </p>
                  <p className="text-sm text-gray-600">
                    Correct answer: {result.correctAnswer}
                  </p>
                </div>
              )}
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

            {leaderboard && leaderboard.length > 0 && (
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
  }

  // Loading fallback - show this when connected but no question yet
  if (!question && connected) {
    return (
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
  }

  // Not connected fallback
  if (!connected) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Room: {roomCode}
            </h1>
            <p className="text-lg mb-6">Player: {playerName}</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-600">Connecting to server...</p>
          </div>
        </div>
      </div>
    );
  }

  // Active question display
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 overflow-hidden">
            Room: {roomCode}
          </h1>
          <p>Player: {playerName}</p>
          <p className="text-sm text-gray-600">
            WebSocket Status: {connected ? "Connected" : "Disconnected"}
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Question {qid}</h2>
          <div className="text-right text-gray-600 font-mono">
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

        <p className="text-lg mb-6 p-4 bg-gray-50 rounded-lg">
          {question.text}
        </p>

        <div className="space-y-4 mb-6">
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedAnswer === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option.id}
                checked={selectedAnswer === option.id}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="sr-only"
                disabled={showResult || !timerActive}
              />
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  selectedAnswer === option.id
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {selectedAnswer === option.id && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span>
                {option.id.toUpperCase()}. {option.text}
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
};

export default Quiz;
