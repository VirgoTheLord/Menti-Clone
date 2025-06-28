const express = require("express");
const cors = require("cors");
const fetchQuestionRouter = require("./routes/fetchQuestionRoute");
const quizRouter = require("./routes/quizRoute");
const connectDB = require("./config/db");
const http = require("http");
const questions = require("./data/questions");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const { WebSocketServer } = require("ws");

connectDB();
const wss = new WebSocketServer({ server });

const rooms = [];
const users = {};
const roomScores = {};

const calculateScore = (timeTaken) => {
  const totalTime = 10;
  const rough = totalTime - timeTaken;
  return Math.max(1, Math.round(rough));
};

app.use("/api/fetch-question", fetchQuestionRouter);
app.use("/api/quiz", quizRouter);

app.get("/api/generate-room-code", (req, res) => {
  const generateCode = () => {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    return `${part1}-${part2}`;
  };
  try {
    const roomCode = generateCode();
    rooms.push(roomCode);
    console.log("Generated room code:", roomCode);

    res.json({ Code: roomCode });
  } catch (error) {
    console.error("Error generating room code:", error);
    res.status(500).json({ error: "Failed to generate room code." });
  }
});

app.post("/api/validate-room-code", (req, res) => {
  const { code, name } = req.body;

  const regex = /^[0-9]{4}-[0-9]{4}$/;
  const isCorrectFormat = regex.test(code);
  if (!isCorrectFormat) {
    return res.status(400).json({
      valid: false,
      message: "Invalid room code format. Use XXXX-XXXX.",
    });
  }
  if (!rooms.includes(code)) {
    rooms.push(code);
    console.log("Room created manually via code:", code);
  }
  if (!users[code]) {
    users[code] = [];
  }

  const alreadyExists = users[code].some((u) => u.name === name);
  if (alreadyExists) {
    return res.status(400).json({
      valid: false,
      message: "User with this name already exists in the room.",
    });
  }

  users[code].push({ name, score: 0 });

  console.log(`User "${name}" joined room ${code}`);
  res.json({ valid: true, message: "Room joined successfully." });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Menti Api Backend configured successfully");
});

liveRooms = {};

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", async (message) => {
    const data = JSON.parse(message);

    if (data.type === "join") {
      const { roomCode, playerName } = data.payload;
      socket.roomCode = roomCode;
      socket.playerName = playerName;

      if (!liveRooms[roomCode]) {
        liveRooms[roomCode] = [];
      }

      if (!liveRooms[roomCode].includes(socket)) {
        liveRooms[roomCode].push(socket);
      }

      liveRooms[roomCode].forEach((client) => {
        client.send(
          JSON.stringify({
            type: "user-joined",
            payload: {
              playerName,
              players: liveRooms[roomCode].map((s) => s.playerName),
            },
          })
        );
      });
    }

    if (data.type === "validate-room") {
      const { code, name } = data.payload;

      const regex = /^[0-9]{4}-[0-9]{4}$/;
      const isCorrectFormat = regex.test(code);
      if (!isCorrectFormat) {
        return socket.send(
          JSON.stringify({
            type: "validation-response",
            payload: {
              valid: false,
              message: "Invalid room code format. Use XXXX-XXXX.",
            },
          })
        );
      }

      if (!rooms.includes(code)) {
        rooms.push(code);
        console.log("Room created manually via code:", code);
      }

      if (!users[code]) {
        users[code] = [];
      }

      const alreadyExists = users[code].some((u) => u.name === name);
      if (alreadyExists) {
        return socket.send(
          JSON.stringify({
            type: "validation-response",
            payload: {
              valid: false,
              message: "User with this name already exists in the room.",
            },
          })
        );
      }

      users[code].push({ name, score: 0 });
      console.log(`User "${name}" joined room ${code}`);

      return socket.send(
        JSON.stringify({
          type: "validation-response",
          payload: {
            valid: true,
            message: "Room joined successfully.",
          },
        })
      );
    }

    if (data.type === "fetch-question") {
      const questionId = parseInt(data.payload.qid, 10);
      const question = questions.find((q) => q.id === questionId);

      if (question) {
        const { correctAnswer, ...safeQuestion } = question;
        socket.send(
          JSON.stringify({
            type: "fetch-question-response",
            payload: safeQuestion,
            totalQuestions: questions.length,
          })
        );
      } else {
        socket.send(
          JSON.stringify({
            type: "error",
            payload: { message: "quiz-ended" },
          })
        );
      }
    }

    if (data.type === "submit-answer") {
      const { answer, qid } = data.payload;
      const question = questions.find((q) => q.id === qid);

      if (!question || !answer) {
        return socket.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Invalid question ID or answer" },
          })
        );
      }

      const isCorrect = answer === question.correctAnswer;

      socket.send(
        JSON.stringify({
          type: "submit-answer-response",
          payload: {
            questionId: qid,
            correctAnswer: question.correctAnswer,
            selectedAnswer: answer,
            isCorrect,
            message: isCorrect ? "Correct!" : "Wrong!",
          },
        })
      );
    }

    if (data.type === "set-scores") {
      const { roomCode, playerName, timeTaken, isCorrect } = data.payload;
      if (!roomCode || !playerName) {
        return socket.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Room code or player name not found" },
          })
        );
      }

      if (!roomScores[roomCode]) {
        roomScores[roomCode] = {};
      }

      const currentPlayer = roomScores[roomCode][playerName] || {
        score: 0,
        timeTaken: 0,
      };

      if (isCorrect) {
        currentPlayer.score += calculateScore(timeTaken);
      }
      currentPlayer.timeTaken += timeTaken;

      roomScores[roomCode][playerName] = currentPlayer;

      socket.send(
        JSON.stringify({
          type: "score-update",
          payload: {
            message: isCorrect
              ? "Score updated successfully"
              : "Answer is Wrong.",
          },
        })
      );

      const leaderboard = Object.entries(roomScores[roomCode])
        .map(([name, info]) => ({ name, ...info }))
        .sort((a, b) => b.score - a.score);

      liveRooms[roomCode]?.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "leaderboard-update",
            payload: leaderboard,
          })
        );
      });
    }
    // ADMIN STARTS QUIZ
    if (data.type === "admin-start") {
      const { roomCode } = data.payload;
      if (!roomCode || !liveRooms[roomCode]) return;

      console.log(`Admin started quiz for room ${roomCode}`);

      // Broadcast quiz started
      liveRooms[roomCode].forEach((client) => {
        client.send(
          JSON.stringify({
            type: "quiz-started",
            payload: { message: "Quiz has been started!" },
          })
        );
      });

      // Send first question - assuming question id 1
      const question = questions.find((q) => q.id === 1);
      if (question) {
        const { correctAnswer, ...safeQuestion } = question;
        liveRooms[roomCode].forEach((client) => {
          client.send(
            JSON.stringify({
              type: "new-question",
              payload: safeQuestion,
              totalQuestions: questions.length,
            })
          );
        });
      }
    }

    // ADMIN SENDS NEXT QUESTION
    if (data.type === "admin-next-question") {
      const { roomCode, qid } = data.payload;
      const question = questions.find((q) => q.id === qid);

      if (!roomCode || !question) return;

      const { correctAnswer, ...safeQuestion } = question;

      liveRooms[roomCode].forEach((client) => {
        client.send(
          JSON.stringify({
            type: "new-question",
            payload: safeQuestion,
            totalQuestions: questions.length,
          })
        );
      });

      console.log(`Sent question ${qid} to room ${roomCode}`);
    }

    // ADMIN ENDS QUIZ
    if (data.type === "admin-end") {
      const { roomCode } = data.payload;
      if (!roomCode || !liveRooms[roomCode]) return;

      liveRooms[roomCode].forEach((client) => {
        client.send(
          JSON.stringify({
            type: "quiz-ended",
            payload: { message: "The quiz has ended!" },
          })
        );
      });

      console.log(`Quiz ended in room ${roomCode}`);
    }
  });

  socket.on("close", () => {
    const { roomCode } = socket;
    if (roomCode && liveRooms[roomCode]) {
      liveRooms[roomCode] = liveRooms[roomCode].filter((s) => s !== socket);
      if (liveRooms[roomCode].length === 0) {
        delete liveRooms[roomCode];
        delete roomScores[roomCode];
      }
      console.log(`Socket left room ${roomCode}`);
    }
  });
});

module.exports = { users };
