import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useWebSocket } from "../../utils/webSocketContext";

const Quiz = () => {
  const { id: roomCode } = useParams();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const playerName = queryParams.get("name");
  const navigate = useNavigate();

  const { connectWebSocket, disconnectWebSocket, sendMessage, connected } =
    useWebSocket();

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

  // NEW: Leaderboard data
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Restore saved progress from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`quiz-${roomCode}`));
    if (saved) {
      if (saved.quizCompleted) {
        setQuizCompleted(true);
        setShowLeaderboard(true); // Show leaderboard if quiz completed
      } else {
        setQid(saved.qid || 1);
        setTimeLeft(saved.timeLeft || 10);
        setSelectedAnswer(saved.selectedAnswer || "");
        setTotalQuestions(saved.totalQuestions || null);
      }
    }
  }, [roomCode]);

  // WebSocket setup and message handling
  useEffect(() => {
    if (!roomCode || !playerName) return;

    connectWebSocket(roomCode);

    const handleMessage = (message) => {
      const data = JSON.parse(message.data);

      if (data.type === "fetch-question-response") {
        setQuestion(data.payload);
        setTimeLeft(10);
        setSelectedAnswer("");
        setShowResult(false);
        setTimerActive(true);
        if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
      } else if (data.type === "submit-answer-response") {
        setResult(data.payload);
        setShowResult(true);
        setTimerActive(false);

        sendMessage("set-scores", {
          roomCode,
          playerName,
          timeTaken: 10 - timeLeft || 0,
          isCorrect: data.payload.isCorrect,
        });

        const nextQid = qid + 1;
        const completed = totalQuestions && nextQid > totalQuestions;

        const savedProgress = {
          qid: nextQid,
          quizCompleted: completed,
          timeLeft: 10,
          selectedAnswer: "",
          totalQuestions,
        };
        localStorage.setItem(`quiz-${roomCode}`, JSON.stringify(savedProgress));

        if (completed) {
          setQuizCompleted(true);
          setShowLeaderboard(true); // Show leaderboard now
          // Stop timer and disconnect handled below
          disconnectWebSocket();
          return;
        }

        setTimeout(() => {
          setQid(nextQid);
        }, 2000);
      } else if (data.type === "user-joined") {
        setPlayers(data.payload.players);
      } else if (data.type === "score-update") {
        console.log("Score update:", data.payload);
        // You could optionally fetch leaderboard here if needed
      } else if (data.type === "leaderboard-update") {
        // NEW: receive updated leaderboard from server
        // Expected format: [{ playerName: string, score: number }, ...]
        setLeaderboard(data.payload);
      } else if (data.type === "error") {
        if (
          data.payload.message === "quiz-ended" ||
          data.payload.message === "Question not found"
        ) {
          setQuizCompleted(true);
          setShowLeaderboard(true);
          disconnectWebSocket();
          localStorage.setItem(
            `quiz-${roomCode}`,
            JSON.stringify({
              qid,
              quizCompleted: true,
              timeLeft: 0,
              selectedAnswer: "",
              totalQuestions,
            })
          );
        } else {
          console.error("WebSocket error:", data.payload.message);
        }
      }
    };

    const socket = window.WebSocketInstance;
    if (connected && socket) {
      socket.onmessage = handleMessage;
      sendMessage("fetch-question", { qid: String(qid) });
    }

    return () => {
      if (window.WebSocketInstance) {
        window.WebSocketInstance.onmessage = null;
      }
    };
  }, [
    roomCode,
    playerName,
    connected,
    qid,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket,
    totalQuestions,
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
      setTimerActive(false);
      handleSubmit();
    }

    return () => clearInterval(interval);
  }, [timeLeft, timerActive]);

  const handleSubmit = () => {
    if (showResult) return;
    setTimerActive(false);
    sendMessage("submit-answer", {
      qid,
      answer: selectedAnswer || " ",
    });
  };

  // NEW: Handler for ending quiz after leaderboard
  const handleEndQuiz = () => {
    setShowLeaderboard(false);
    setQuizCompleted(false);
    setQid(1);
    setQuestion(null);
    setSelectedAnswer("");
    setShowResult(false);
    setResult(null);
    setTimeLeft(10);
    setTimerActive(false);
    setPlayers([]);
    setLeaderboard(null);
    localStorage.removeItem(`quiz-${roomCode}`);
    navigate("/");
    disconnectWebSocket();
  };

  // Final screen: Show leaderboard after quiz completes
  if (quizCompleted && showLeaderboard) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100 p-8">
        <div className="bg-white max-w-3xl rounded-lg shadow-lg p-8 w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">Leaderboard</h1>

          {leaderboard && leaderboard.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-2">Player</th>
                  <th className="py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard
                  .sort((a, b) => b.score - a.score)
                  .map(({ name, score }, idx) => (
                    <tr key={name}>
                      <td className="py-2">{name}</td>
                      <td className="py-2">{score}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p>No scores yet.</p>
          )}

          <div className="text-center mt-8">
            <button
              onClick={handleEndQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-md"
            >
              End Quiz & Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading fallback
  if (!question) return <div>Loading question...</div>;

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 overflow-hidden">
            Room: {roomCode}
          </h1>
          <p>Player: {playerName}</p>
          <p>WebSocket Status: {connected ? "Connected" : "Disconnected"}</p>
          {players.length > 0 && (
            <div>
              <p>Players in room:</p>
              <ul>
                {players.map((player, index) => (
                  <li key={index}>{player}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-4">Question {qid}</h2>
        <div className="mb-4 text-right text-gray-600 font-mono">
          Time left: <span className="font-bold text-red-600">{timeLeft}s</span>
        </div>

        <p className="text-lg mb-6">{question.text}</p>

        <div className="space-y-4 mb-6">
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer ${
                selectedAnswer === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option.id}
                checked={selectedAnswer === option.id}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="sr-only"
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
            disabled={showResult}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-md"
          >
            Submit Answer
          </button>

          {showResult && result && (
            <p className="text-lg font-bold text-center">{result.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
