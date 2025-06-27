const mongoose = require("mongoose");
const scores = require("./models/scoreModel");
const dotenv = require("dotenv");

dotenv.config();

mongoose.connect(process.env.MONGODB_URL);

const seed = async () => {
  try {
    await scores.deleteMany({});
    console.log("Scores collection cleared");
    process.exit();
  } catch (error) {
    console.error("Error while seeding the database:", error);
    process.exit(1);
  }
};

seed();
