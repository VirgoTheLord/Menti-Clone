// backend/state.js

//rooms has the list of all rooms when created and validated
//users maps roomcodes to concurrent users in the room and thier score is tracked, roomcode is key
//liverroms hold live quiz session info of every room
//roomScores maps roomcodes to the scores of users in the room, used for leaderboard
const rooms = [];
const users = {};
const liveRooms = {};
const roomScores = {};

module.exports = { rooms, users, liveRooms, roomScores };
