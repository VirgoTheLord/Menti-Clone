const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");
const connectDB = require("./config/db");
const fetchQuestionRouter = require("./routes/fetchQuestionRoute");
const quizRouter = require("./routes/quizRoute");
const questions = require("./data/questions");

const handleJoin = require("./wshandlers/joinHandler");
const handleValidateRoom = require("./wshandlers/validateRoomHandler");
const handleFetchQuestion = require("./wshandlers/fetchQuestionHandler");
const handleSubmitAnswer = require("./wshandlers/submitAnswerHandler");
const handleSetScores = require("./wshandlers/setScoresHandler");
const handleAdmin = require("./wshandlers/adminHandler");
const handleLeave = require("./wshandlers/leaveHandler");
const state = require("./state");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

connectDB();

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
    state.rooms.push(roomCode);
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
  if (!state.rooms.includes(code)) {
    state.rooms.push(code);
    console.log("Room created manually via code:", code);
  }
  if (!state.users[code]) {
    state.users[code] = [];
  }
  const alreadyExists = state.users[code].some((u) => u.name === name);
  if (alreadyExists) {
    return res.status(400).json({
      valid: false,
      message: "User with this name already exists in the room.",
    });
  }
  state.users[code].push({ name, score: 0 });
  console.log(`User "${name}" joined room ${code}`);
  res.json({ valid: true, message: "Room joined successfully." });
});

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    const data = JSON.parse(message);
    const { type, payload } = data;

    switch (type) {
      case "join":
        handleJoin(socket, payload);
        break;
      case "validate-room":
        handleValidateRoom(socket, payload);
        break;
      case "fetch-question":
        handleFetchQuestion(socket, payload);
        break;
      case "submit-answer":
        handleSubmitAnswer(socket, payload);
        break;
      case "set-scores":
        handleSetScores(socket, payload);
        break;
      case "admin-start":
      case "admin-next-question":
      case "admin-end":
      case "admin-reset":
        handleAdmin(socket, payload, type);
        break;
      case "leave":
        handleLeave(socket, payload);
        break;
    }
  });

  socket.on("close", () => {
    const { roomCode, playerName, isAdmin } = socket;
    handleLeave(socket, { roomCode, playerName }, isAdmin);
  });

  socket.on("error", (err) => {
    console.error("WebSocket error:", err);
    socket.emit("close");
  });
});

app.get("/", (req, res) => {
  res.send("Menti Api Backend configured successfully");
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
