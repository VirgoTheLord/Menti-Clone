import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useWebSocket } from "../../utils/websocket/webSocketContext";
import WaitingScreen from "./WaitingScreen";
import QuestionScreen from "./QuestionScreen";
import FinalLeaderboard from "./FinalLeaderboard";
import WaitingForNextQuestion from "./WaitingForNextQuestion";
import LoadingQuestion from "./LoadingQuestion";
import ConnectingScreen from "./ConnectingScreen";

const Quiz = () => {
  const { id: roomCode } = useParams();
  const { search } = useLocation();
  const playerName = new URLSearchParams(search).get("name");
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
  const [quizStarted, setQuizStarted] = useState(false);
  const [waitingForStart, setWaitingForStart] = useState(true);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Function to save current state to localStorage
  const saveGameState = (updates = {}) => {
    const currentState = {
      qid,
      question,
      quizCompleted,
      timeLeft,
      selectedAnswer,
      totalQuestions,
      quizStarted,
      showResult,
      waitingForNext,
      timestamp: Date.now(), // Add timestamp to track when state was saved
      ...updates,
    };

    localStorage.setItem(`quiz-${roomCode}`, JSON.stringify(currentState));
  };

  // Function to clear game state
  const clearGameState = () => {
    localStorage.removeItem(`quiz-${roomCode}`);
  };

  // Load saved state only if it's recent (within last 30 seconds)
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`quiz-${roomCode}`));
    if (saved && saved.timestamp) {
      const timeSinceLastSave = Date.now() - saved.timestamp;
      const maxAllowedAge = 30000; // 30 seconds

      // Only restore state if it's recent
      if (timeSinceLastSave < maxAllowedAge) {
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
          setWaitingForNext(saved.waitingForNext || false);
          setShowResult(saved.showResult || false);
          if (saved.question) setQuestion(saved.question);
        }
      } else {
        // Clear old state
        clearGameState();
      }
    }
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !playerName) return;
    connectWebSocket(roomCode);

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "quiz-started":
            setQuizStarted(true);
            setWaitingForStart(false);
            saveGameState({ quizStarted: true, waitingForStart: false });
            break;

          case "new-question":
            // Reset all question-related state for new question
            setQuestion(data.payload);
            setQid(data.payload.id);
            setTimeLeft(10);
            setSelectedAnswer("");
            setShowResult(false);
            setResult(null);
            setTimerActive(true);
            setWaitingForNext(false);
            setQuizStarted(true);
            setWaitingForStart(false);
            if (data.totalQuestions) setTotalQuestions(data.totalQuestions);

            // Save the fresh state
            saveGameState({
              qid: data.payload.id,
              question: data.payload,
              quizCompleted: false,
              timeLeft: 10,
              selectedAnswer: "",
              totalQuestions: data.totalQuestions,
              quizStarted: true,
              showResult: false,
              waitingForNext: false,
              timerActive: true,
            });
            break;

          case "submit-answer-response":
            setResult(data.payload);
            setShowResult(true);
            setTimerActive(false);
            setWaitingForNext(true);

            saveGameState({
              showResult: true,
              waitingForNext: true,
              timerActive: false,
              result: data.payload,
            });

            sendMessage("set-scores", {
              roomCode,
              playerName,
              timeTaken: 10 - timeLeft || 0,
              isCorrect: data.payload.isCorrect,
            });
            break;

          case "quiz-ended":
            setQuizCompleted(true);
            setShowLeaderboard(true);
            setTimerActive(false);

            saveGameState({
              quizCompleted: true,
              showLeaderboard: true,
              timerActive: false,
            });
            break;

          case "user-joined":
            const activePlayers = data.payload.players.filter(
              (p) => p !== "__admin__" && !p.startsWith("admin_")
            );
            setPlayers(activePlayers);
            console.log(`${data.payload.playerName} joined the room`);
            break;

          case "user-left":
            const remainingPlayers = data.payload.players.filter(
              (p) => p !== "__admin__" && !p.startsWith("admin_")
            );
            setPlayers(remainingPlayers);
            console.log(`${data.payload.playerName} left the room`);
            break;

          case "quiz-reset":
            // Clear all state when quiz is reset
            clearGameState();
            if (data.payload.shouldReconnect) {
              navigate(`/join-room?code=${roomCode}`);
            }
            break;

          case "leaderboard-update":
            setLeaderboard(data.payload);
            break;

          default:
            console.log("Unhandled type:", data.type);
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    const removeHandler = addMessageHandler(handleMessage);

    if (connected) {
      const joinTimeout = setTimeout(() => {
        sendMessage("join", { roomCode, playerName });
      }, 100);

      return () => {
        clearTimeout(joinTimeout);
        removeHandler();
      };
    }

    return () => removeHandler();
  }, [
    roomCode,
    playerName,
    connected,
    connectWebSocket,
    addMessageHandler,
    timeLeft,
  ]);

  // Timer effect with state saving
  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => {
          const newTime = t - 1;
          // Save state every second during active timer
          saveGameState({ timeLeft: newTime });
          return newTime;
        });
      }, 1000);
    }
    if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [timeLeft, timerActive]);

  const handleSubmit = () => {
    if (!question || showResult) return;
    sendMessage("submit-answer", {
      qid: question.id,
      answer: selectedAnswer || " ",
    });
  };

  const handleEndQuiz = () => {
    // Send leave message before cleaning up
    if (connected && roomCode && playerName) {
      sendMessage("leave", { roomCode, playerName });
    }

    clearGameState();
    setShowLeaderboard(false);
    disconnectWebSocket();
    navigate("/");
  };

  // Handle component cleanup and user leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Send leave message when user closes tab/refreshes
      if (connected && roomCode && playerName) {
        sendMessage("leave", { roomCode, playerName });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Send leave message when component unmounts (navigation)
      if (connected && roomCode && playerName) {
        sendMessage("leave", { roomCode, playerName });
      }

      // Only clear state if quiz is not in progress or user is intentionally leaving
      if (quizCompleted || !quizStarted) {
        clearGameState();
      }
    };
  }, [
    connected,
    roomCode,
    playerName,
    quizCompleted,
    quizStarted,
    sendMessage,
  ]);

  if (!connected)
    return <ConnectingScreen roomCode={roomCode} playerName={playerName} />;
  if (quizCompleted && showLeaderboard)
    return (
      <FinalLeaderboard
        leaderboard={leaderboard}
        handleEndQuiz={handleEndQuiz}
      />
    );
  if (waitingForStart)
    return (
      <WaitingScreen
        roomCode={roomCode}
        playerName={playerName}
        connected={connected}
        players={players}
        message="Waiting for Quiz to Start..."
      />
    );
  if (waitingForNext && showResult)
    return (
      <WaitingForNextQuestion
        roomCode={roomCode}
        playerName={playerName}
        result={result}
        leaderboard={leaderboard}
      />
    );
  if (!question && quizStarted)
    return <LoadingQuestion roomCode={roomCode} playerName={playerName} />;
  if (question)
    return (
      <QuestionScreen
        roomCode={roomCode}
        playerName={playerName}
        connected={connected}
        qid={qid}
        question={question}
        timeLeft={timeLeft}
        timerActive={timerActive}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
        handleSubmit={handleSubmit}
        showResult={showResult}
        result={result}
      />
    );

  return null;
};

export default Quiz;
