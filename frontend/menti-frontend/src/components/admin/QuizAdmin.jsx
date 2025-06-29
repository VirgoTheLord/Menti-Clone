import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useWebSocket } from "../../utils/websocket/webSocketContext";

import RoomInfo from "./RoomInfo";
import PlayerList from "./PlayersList";
import ControlPanel from "./ControlPanel";
import Leaderboard from "./Leaderboard";
import ActivityLog from "./ActivityLog";

const QuizAdmin = () => {
  const { state } = useLocation();
  const {
    connectWebSocket,
    sendMessage,
    connected,
    connectionState,
    addMessageHandler,
    disconnectWebSocket,
  } = useWebSocket();

  const [roomCode, setRoomCode] = useState(state?.roomCode || "");
  const [roomName, setRoomName] = useState(state?.roomName || "");
  const [players, setPlayers] = useState([]);
  const [started, setStarted] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [log, setLog] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizEnded, setQuizEnded] = useState(false);
  const [adminJoined, setAdminJoined] = useState(false);

  const connectionAttempts = useRef(0);
  const maxRetries = 3;
  const adminId = useRef(`admin_${Date.now()}`);

  const attemptValidation = () => {
    try {
      sendMessage("validate-room", { code: roomCode, name: adminId.current });
      logMessage("Attempting to validate existing admin session...");
    } catch (error) {
      logMessage(`Validation failed: ${error.message}`);
    }
  };

  const attemptAdminJoin = () => {
    connectionAttempts.current += 1;
    try {
      sendMessage("join", {
        roomCode,
        playerName: adminId.current,
        isAdmin: true,
      });
      logMessage(
        `Attempting to join as admin (attempt ${connectionAttempts.current})`
      );
    } catch (error) {
      logMessage(`Join attempt failed: ${error.message}`);
      if (connectionAttempts.current < maxRetries) {
        setTimeout(attemptAdminJoin, 2000);
      }
    }
  };

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
              if (data.payload.message?.includes("admin not found")) {
                logMessage("Admin not in room, attempting to join...");
                setTimeout(() => attemptAdminJoin(), 500);
              } else {
                logMessage("Room validation failed: " + data.payload.message);
              }
            } else {
              logMessage("Admin session validated successfully.");
              setAdminJoined(true);
            }
            break;

          case "join-response":
            if (data.payload.success) {
              logMessage("Joined as admin successfully.");
              setAdminJoined(true);
            } else {
              if (data.payload.message?.includes("admin already exists")) {
                logMessage(
                  "Admin already exists, validating existing session..."
                );
                setTimeout(() => attemptValidation(), 500);
              } else {
                logMessage(`Join failed: ${data.payload.message}`);
              }
            }
            break;

          case "user-joined":
            const realPlayers = data.payload.players.filter(
              (p) => p !== "__admin__" && !p.startsWith("admin_")
            );
            setPlayers(realPlayers);

            if (
              !data.payload.playerName.startsWith("admin_") &&
              data.payload.playerName !== "__admin__"
            ) {
              logMessage(
                `${data.payload.playerName} joined the room. (${data.payload.totalPlayers} total players)`
              );
            }
            break;

          case "user-left":
            const updatedPlayers = data.payload.players.filter(
              (p) => p !== "__admin__" && !p.startsWith("admin_")
            );
            setPlayers(updatedPlayers);

            logMessage(
              `${data.payload.playerName} left the room. (${data.payload.totalPlayers} players remaining)`
            );
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

          case "quiz-reset":
            logMessage("Quiz has been reset!");
            setStarted(false);
            setQuizEnded(false);
            setCurrentQuestionId(1);
            setLeaderboard([]);
            setPlayers([]);
            break;

          case "error":
            logMessage(`Server error: ${data.payload.message}`);
            break;

          default:
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

  useEffect(() => {
    if (
      connected &&
      connectionState === "connected" &&
      roomCode &&
      !adminJoined
    ) {
      const initAdmin = () => {
        attemptValidation();

        setTimeout(() => {
          if (!adminJoined) {
            attemptAdminJoin();
          }
        }, 2000);
      };

      const timer = setTimeout(initAdmin, 1000);
      return () => clearTimeout(timer);
    }
  }, [connected, connectionState, roomCode, adminJoined]);

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
    if (safeSendMessage("admin-reset", { roomCode })) {
      setStarted(false);
      setQuizEnded(false);
      setCurrentQuestionId(1);
      setLeaderboard([]);
      setPlayers([]);
      logMessage("Quiz reset. Server notified to clear all players.");
    } else {
      setStarted(false);
      setQuizEnded(false);
      setCurrentQuestionId(1);
      setLeaderboard([]);
      setPlayers([]);
      logMessage("Quiz reset locally. Players cleared from admin view.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8 overflow-hidden">
        Quiz Admin Panel
      </h1>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <RoomInfo
            roomName={roomName}
            roomCode={roomCode}
            connectionState={connectionState}
            adminJoined={adminJoined}
            started={started}
            quizEnded={quizEnded}
          />

          <PlayerList players={players} />

          <div className="mb-6">
            <span className="font-medium">Current Question:</span>{" "}
            {currentQuestionId}
          </div>

          <ControlPanel
            connected={connected}
            adminJoined={adminJoined}
            started={started}
            quizEnded={quizEnded}
            players={players}
            currentQuestionId={currentQuestionId}
            handleStart={handleStart}
            handleNext={handleNext}
            handleEnd={handleEnd}
            resetQuiz={resetQuiz}
          />
        </div>

        <div className="space-y-6">
          <Leaderboard leaderboard={leaderboard} />
          <ActivityLog log={log} />
        </div>
      </div>
    </div>
  );
};

export default QuizAdmin;
