import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useWebSocket } from "../../utils/webSocketContext";

const QuizAdmin = () => {
  const { state } = useLocation();
  const {
    connectWebSocket,
    sendMessage,
    connected,
    connectionState,
    addMessageHandler,
    disconnectWebSocket,
    getConnectionInfo,
  } = useWebSocket();

  const [roomCode, setRoomCode] = useState(state?.roomCode || "");
  const [roomName, setRoomName] = useState(state?.roomName || "");
  const [players, setPlayers] = useState([]);
  const [started, setStarted] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [log, setLog] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizEnded, setQuizEnded] = useState(false);

  // Track if admin has joined successfully
  const [adminJoined, setAdminJoined] = useState(false);
  const connectionAttempts = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!roomCode) return;

    connectWebSocket(roomCode);

    const handleMessage = (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data);
        console.log("Admin received:", data);

        switch (data.type) {
          case "validation-response":
            if (!data.payload.valid) {
              logMessage("Room validation failed: " + data.payload.message);
            } else {
              logMessage("Room validated successfully.");
              setAdminJoined(true);
            }
            break;

          case "user-joined":
            // Filter out admin from players list
            const realPlayers = data.payload.players.filter(
              (p) => p !== "__admin__"
            );
            setPlayers(realPlayers);
            logMessage(`${data.payload.playerName} joined the room.`);
            break;

          case "quiz-started":
            logMessage("Quiz has been started!");
            setStarted(true);
            break;

          case "quiz-ended":
            logMessage("Quiz has ended!");
            setStarted(false);
            setQuizEnded(true);
            break;

          case "leaderboard-update":
            setLeaderboard(data.payload);
            logMessage("Leaderboard updated.");
            break;

          case "error":
            logMessage(`Server error: ${data.payload.message}`);
            break;

          default:
            // Ignore other message types meant for regular users
            break;
        }
      } catch (error) {
        console.error("Failed to parse server message:", error);
        logMessage("Failed to parse server message.");
      }
    };

    const removeHandler = addMessageHandler(handleMessage);

    return () => {
      removeHandler();
      disconnectWebSocket();
    };
  }, [roomCode, connectWebSocket, disconnectWebSocket, addMessageHandler]);

  // Join as admin after connection with better timing
  useEffect(() => {
    if (
      connected &&
      connectionState === "connected" &&
      roomCode &&
      !adminJoined
    ) {
      const attemptAdminJoin = () => {
        connectionAttempts.current += 1;

        try {
          sendMessage("join", { roomCode, playerName: "__admin__" });
          sendMessage("validate-room", { code: roomCode, name: "__admin__" });
          logMessage(
            `Connected as admin to room ${roomCode} (attempt ${connectionAttempts.current})`
          );
        } catch (error) {
          logMessage(`Failed to join as admin: ${error.message}`);

          // Retry if we haven't exceeded max attempts
          if (connectionAttempts.current < maxRetries) {
            setTimeout(attemptAdminJoin, 2000);
          } else {
            logMessage(
              "Max connection attempts reached. Please refresh the page."
            );
          }
        }
      };

      // Wait for connection to stabilize
      const timer = setTimeout(attemptAdminJoin, 1000);

      return () => clearTimeout(timer);
    }
  }, [connected, connectionState, roomCode, sendMessage, adminJoined]);

  // Reset connection attempts when connection changes
  useEffect(() => {
    if (connected) {
      connectionAttempts.current = 0;
    } else {
      setAdminJoined(false);
    }
  }, [connected]);

  const logMessage = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Safe message sending wrapper
  const safeSendMessage = (type, payload) => {
    if (!connected) {
      logMessage("Cannot send message - WebSocket not connected");
      return false;
    }

    if (!adminJoined && type !== "join" && type !== "validate-room") {
      logMessage("Cannot send message - Admin not joined yet");
      return false;
    }

    try {
      sendMessage(type, payload);
      return true;
    } catch (error) {
      logMessage(`Failed to send message: ${error.message}`);
      return false;
    }
  };

  const handleStart = () => {
    if (players.length === 0) {
      logMessage("Cannot start quiz - no players joined yet!");
      return;
    }

    if (safeSendMessage("admin-start", { roomCode })) {
      logMessage("Starting quiz...");
    }
  };

  const handleNext = () => {
    const nextQuestionId = currentQuestionId + 1;

    if (
      safeSendMessage("admin-next-question", { roomCode, qid: nextQuestionId })
    ) {
      logMessage(`Sending question ${nextQuestionId}...`);
      setCurrentQuestionId(nextQuestionId);
    }
  };

  const handleEnd = () => {
    if (safeSendMessage("admin-end", { roomCode })) {
      logMessage("Ending quiz...");
    }
  };

  const resetQuiz = () => {
    setStarted(false);
    setQuizEnded(false);
    setCurrentQuestionId(1);
    setLeaderboard([]);
    logMessage("Quiz reset. Ready for new game.");
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8 overflow-hidden">
        Quiz Admin Panel
      </h1>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Room Info & Controls */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Room Information</h2>

          <div className="space-y-3 mb-6">
            <div>
              <span className="font-medium">Room Name:</span>{" "}
              {roomName || "Untitled"}
            </div>
            <div>
              <span className="font-medium">Room Code:</span>
              <span className="ml-2 text-2xl font-mono text-blue-300">
                {roomCode}
              </span>
            </div>
            <div>
              <span className="font-medium">Connection:</span>{" "}
              <span
                className={
                  connectionState === "connected"
                    ? "text-green-400"
                    : connectionState === "connecting"
                    ? "text-yellow-400"
                    : connectionState === "error"
                    ? "text-red-400"
                    : "text-gray-400"
                }
              >
                {connectionState === "connected"
                  ? "Connected ✅"
                  : connectionState === "connecting"
                  ? "Connecting..."
                  : connectionState === "error"
                  ? "Connection Error ❌"
                  : "Disconnected"}
              </span>
            </div>
            <div>
              <span className="font-medium">Admin Status:</span>{" "}
              <span
                className={adminJoined ? "text-green-400" : "text-yellow-400"}
              >
                {adminJoined ? "Joined ✅" : "Joining..."}
              </span>
            </div>
            <div>
              <span className="font-medium">Quiz State:</span>{" "}
              <span
                className={
                  started
                    ? "text-yellow-400"
                    : quizEnded
                    ? "text-purple-400"
                    : "text-blue-400"
                }
              >
                {quizEnded ? "Ended" : started ? "In Progress" : "Waiting"}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">
              Players Joined ({players.length}):
            </h3>
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

          <div className="mb-6">
            <span className="font-medium">Current Question:</span>{" "}
            {currentQuestionId}
          </div>

          {/* Control Buttons */}
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
        </div>

        {/* Right Panel - Leaderboard & Logs */}
        <div className="space-y-6">
          {/* Leaderboard */}
          {leaderboard.length > 0 && (
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
          )}

          {/* Activity Log */}
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
            <div className="bg-black/30 rounded p-3 h-64 overflow-y-auto">
              {log.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {log.slice(-20).map((line, idx) => (
                    <li key={idx} className="text-gray-300">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No activity yet...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAdmin;
