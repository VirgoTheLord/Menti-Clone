import React, { useState } from "react";
import WebSocket, { WebSocketServer } from "ws";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateRoom = () => {
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateRoomCode = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/generate-room-code"
      );
      setRoomCode(res.data.Code);
    } catch (err) {
      console.error("Error generating room code:", err);
      alert("Failed to generate room code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!roomName.trim() || !roomCode.trim()) {
      alert("Please fill in both fields.");
      return;
    }

    if (!/^\d{4}-\d{4}$/.test(roomCode)) {
      alert("Invalid room code format. Please use XXXX-XXXX.");
      return;
    }

    // ✅ Redirect to JoinRoom with pre-filled room code
    navigate(`/join-room/${roomCode}`);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-blue-950 text-white w-full max-w-md rounded-lg shadow-lg p-8 flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-bold text-center">Create Room</h1>

        <div className="w-full">
          <input
            type="text"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
            className="w-full p-3 rounded-md border border-gray-300 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Room Code (e.g., 2245-4354)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              required
              className="flex-1 p-3 rounded-md border border-gray-300 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={generateRoomCode}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "..." : "Generate"}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-950"
        >
          Create Room
        </button>
      </div>
    </div>
  );
};

export default CreateRoom;
