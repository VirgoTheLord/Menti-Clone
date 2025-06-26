const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
});

const scoreModel = mongoose.model("Score", scoreSchema);
module.exports = scoreModel;
