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

  // concurrent save to save reloads
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
      timestamp: Date.now(), //timestamp for freshness check
      ...updates,
    };

    localStorage.setItem(`quiz-${roomCode}`, JSON.stringify(currentState));
  };
  //clear after end
  const clearGameState = () => {
    localStorage.removeItem(`quiz-${roomCode}`);
  };

  //smtg i made with ai to checl age of saved state and not use ti if its old
  //but dont really think its needed
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`quiz-${roomCode}`));
    if (saved && saved.timestamp) {
      const timeSinceLastSave = Date.now() - saved.timestamp;
      const maxAllowedAge = 30000;

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
        clearGameState();
      }
    }
  }, [roomCode]);

  useEffect(() => {
    //connect
    if (!roomCode || !playerName) return;
    connectWebSocket(roomCode);
    //handlemessage fn to pass to addMessageHandler

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "quiz-started":
            setQuizStarted(true);
            setWaitingForStart(false);
            saveGameState({ quizStarted: true, waitingForStart: false });
            break;
          //easy to understand reset logic to account for admin sending each qn

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
          //this case was optioonal but it was fun to make, it was an ai suggestion,
          case "quiz-reset":
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
      //one thing i got to fix
      //constant sends of join with a 100ms delay
      //got to verride this soon
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
    //dk if is efficient but since its temporary and its concurrency i decided to keep it
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => {
          const newTime = t - 1;
          saveGameState({ timeLeft: newTime });
          return newTime;
        });
      }, 1000);
    }
    //if timer ends auto submit
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
    //send leave for backend updation
    if (connected && roomCode && playerName) {
      sendMessage("leave", { roomCode, playerName });
    }
    //resets all state and disconnects

    clearGameState();
    setShowLeaderboard(false);
    disconnectWebSocket();
    navigate("/");
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      //uses connected state to ensure connection is still active and roomc and playerName
      if (connected && roomCode && playerName) {
        sendMessage("leave", { roomCode, playerName });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      //cleanup of event listener
      window.removeEventListener("beforeunload", handleBeforeUnload);

      //leave to ensure consisten backend updation and state check

      if (connected && roomCode && playerName) {
        sendMessage("leave", { roomCode, playerName });
      }

      //clear only if ended and left
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
