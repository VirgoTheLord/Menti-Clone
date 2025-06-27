const express = require("express");
const cors = require("cors");
const fetchQuestionRouter = require("./routes/fetchQuestionRoute");
const quizRouter = require("./routes/quizRoute");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

connectDB();

const rooms = [];
const users = {};

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

// app.get("/api/add-code/:code", (req, res) => {
//   const { code } = req.params;
//   const regex = /^[0-9]{4}-[0-9]{4}$/;
//   if (!rooms.includes(code) && regex.test(code)) {
//     rooms.push(code);
//     console.log("Added room code:", code);
//     res.json({ message: "Room code added successfully." });
//   } else if (!regex.test(code)) {
//     res
//       .status(400)
//       .json({ message: "Invalid room code format. Use XXXX-XXXX." });
//   } else {
//     res.status(400).json({ message: "Room code already exists." });
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Menti Api Backend configured successfully");
});

module.exports = { users };
