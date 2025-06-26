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

app.use("/api/fetch-question", fetchQuestionRouter);
app.use("/api/quiz", quizRouter);

app.get("/api/generate-room-code", (req, res) => {
  const generateCode = () => {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    return `${part1}-${part2}`;
  };
  const roomCode = generateCode();
  res.json({ Code: roomCode });
});

app.get("/api/validate-room-code/:code", (req, res) => {
  const { code } = req.params;
  const validate = (code) => {
    if (!code || code.length < 3) {
      return false;
    }
    const regex = /^[0-9]{4}-[0-9]{4}$/;
    return regex.test(code);
  };
  const isValid = validate(code);
  if (isValid) {
    res.json({ valid: true, message: "Room code is valid." });
  } else {
    res
      .status(400)
      .json({ valid: false, message: "Invalid room code format." });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Menti Api Backend configured successfully");
});
