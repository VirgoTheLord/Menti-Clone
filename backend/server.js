const express = require("express");
const cors = require("cors");
const fetchQuestionRouter = require("./routes/fetchQuestionRoute");
const quizRouter = require("./routes/quizRoute");
const connectDB = require("./config/db");
const http = require("http");
const questions = require("./data/questions");
const scores = require("./models/scoreModel");

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
          })
        );
      } else {
        socket.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Question not found" },
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

      try {
        let exist = await scores.findOne({ roomCode, playerName });
        if (exist) {
          if (isCorrect) {
            const score = calculateScore(timeTaken);
            exist.score += score;
            exist.timeTaken += timeTaken || 0;
            await exist.save();
            socket.send(
              JSON.stringify({
                type: "score-update",
                payload: { message: "Score updated successfully" },
              })
            );
          } else {
            exist.timeTaken += timeTaken || 0;
            await exist.save();
            socket.send(
              JSON.stringify({
                type: "score-update",
                payload: { message: "Answer is Wrong." },
              })
            );
          }
        } else {
          const score = calculateScore(timeTaken);
          const newScore = new scores({
            roomCode,
            playerName,
            timeTaken: timeTaken || 0,
            score: isCorrect ? score : 0,
          });
          await newScore.save();
          socket.send(
            JSON.stringify({
              type: "score-update",
              payload: { message: "Score added successfully" },
            })
          );
        }
      } catch (error) {
        console.error("Error setting scores:", error);
        socket.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Internal server error" },
          })
        );
      }
    }
  });

  socket.on("close", () => {
    if (socket.roomCode && liveRooms[socket.roomCode]) {
      liveRooms[socket.roomCode] = liveRooms[socket.roomCode].filter(
        (s) => s !== socket
      );
      console.log(`Socket left room ${socket.roomCode}`);
    }
  });
});

module.exports = { users };
