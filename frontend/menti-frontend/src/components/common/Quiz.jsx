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
        if (saved.question) setQuestion(saved.question);
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
            break;

          case "new-question":
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
            localStorage.setItem(
              `quiz-${roomCode}`,
              JSON.stringify({
                qid: data.payload.id,
                question: data.payload,
                quizCompleted: false,
                timeLeft: 10,
                selectedAnswer: "",
                totalQuestions: data.totalQuestions,
                quizStarted: true,
              })
            );
            break;

          case "submit-answer-response":
            setResult(data.payload);
            setShowResult(true);
            setTimerActive(false);
            setWaitingForNext(true);
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
            setPlayers(data.payload.players.filter((p) => p !== "__admin__"));
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

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
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
    localStorage.removeItem(`quiz-${roomCode}`);
    setShowLeaderboard(false);
    disconnectWebSocket();
    navigate("/");
  };

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
