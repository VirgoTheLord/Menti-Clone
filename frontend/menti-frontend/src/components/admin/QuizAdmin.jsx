import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useWebSocket } from "../../utils/webSocketContext";

const QuizAdmin = () => {
  const { state } = useLocation(); // expects { roomCode, roomName }
  const {
    connectWebSocket,
    sendMessage,
    connected,
    setOnMessageCallback,
    disconnectWebSocket,
  } = useWebSocket();

  const [roomCode, setRoomCode] = useState(state?.roomCode || "");
  const [roomName, setRoomName] = useState(state?.roomName || "");
  const [players, setPlayers] = useState([]);
  const [started, setStarted] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [log, setLog] = useState([]);

  useEffect(() => {
    if (!roomCode) return;

    connectWebSocket(roomCode);

    const handleMessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type === "validation-response") {
          if (!data.payload.valid) {
            logMessage("Room validation failed: " + data.payload.message);
          } else {
            logMessage("Room validated.");
          }
        }

        if (data.type === "user-joined") {
          setPlayers(data.payload.players);
          logMessage(`${data.payload.playerName} joined.`);
        }

        if (data.type === "quiz-started") {
          logMessage("Quiz started.");
          setStarted(true);
        }

        if (data.type === "quiz-ended") {
          logMessage("Quiz ended.");
          setStarted(false);
        }

        if (data.type === "error") {
          logMessage(`Error from server: ${data.payload.message}`);
        }
      } catch (error) {
        logMessage("Failed to parse server message.");
      }
    };

    setOnMessageCallback(() => handleMessage);

    return () => {
      setOnMessageCallback(null);
      disconnectWebSocket();
    };
  }, [roomCode, connectWebSocket, disconnectWebSocket, setOnMessageCallback]);

  // Send join & validate after connection established, with a small timeout to avoid race conditions
  useEffect(() => {
    if (connected && roomCode) {
      const timer = setTimeout(() => {
        sendMessage("join", { roomCode, playerName: "__admin__" });
        sendMessage("validate-room", { code: roomCode, name: "__admin__" });
        logMessage("Sent join and validate-room messages.");
      }, 100); // 100ms delay

      return () => clearTimeout(timer);
    }
  }, [connected, roomCode, sendMessage]);

  const logMessage = (msg) => {
    setLog((prev) => [...prev, msg]);
  };

  const handleStart = () => {
    sendMessage("admin-start", { roomCode });
    setStarted(true);
    logMessage("Sent: Quiz start");
  };

  const handleNext = () => {
    sendMessage("admin-next-question", { roomCode, qid: currentQuestionId });
    logMessage(`Sent: Next question (${currentQuestionId})`);
    setCurrentQuestionId((prev) => prev + 1);
  };

  const handleEnd = () => {
    sendMessage("admin-end", { roomCode });
    logMessage("Sent: End quiz");
    setStarted(false);
  };

  return (
    <div className="w-full h-screen bg-slate-900 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6 overflow-hidden">
        Quiz Admin Panel
      </h1>

      <div className="w-full max-w-lg bg-slate-800 p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <strong>Room Name:</strong> {roomName || "Untitled"}
        </div>

        <div className="mb-2">
          <strong>Room Code:</strong> {roomCode || "Loading..."}
        </div>

        <div className="mb-2">
          <strong>Status:</strong>{" "}
          {connected ? "Connected ✅" : "Connecting..."}
        </div>

        <div className="mb-4">
          <strong>Players Joined:</strong>
          <ul className="list-disc ml-6 mt-2">
            {players.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <strong>Current Question:</strong> {currentQuestionId}
        </div>

        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleStart}
            disabled={!connected || started}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Start Quiz
          </button>
          <button
            onClick={handleNext}
            disabled={!connected || !started}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Next Question
          </button>
          <button
            onClick={handleEnd}
            disabled={!connected || !started}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            End Quiz
          </button>
        </div>

        <div className="mt-6">
          <strong>Logs:</strong>
          <ul className="text-sm mt-2 space-y-1 max-h-40 overflow-auto bg-black/30 p-2 rounded">
            {log.map((line, idx) => (
              <li key={idx}>• {line}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuizAdmin;
