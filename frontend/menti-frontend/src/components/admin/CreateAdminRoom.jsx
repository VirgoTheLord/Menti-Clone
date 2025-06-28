import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateAdminRoom = () => {
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
      alert("Failed to generate room code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!roomName.trim() || !roomCode.trim()) {
      alert("Room name and code required.");
      return;
    }

    if (!/^\d{4}-\d{4}$/.test(roomCode)) {
      alert("Room code must be in XXXX-XXXX format.");
      return;
    }

    // Redirect to Quiz Admin control page with query params or state
    navigate(`/create/quiz/${roomCode}`, {
      state: {
        roomCode,
        roomName,
      },
    });
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-blue-950 text-white w-full max-w-md rounded-lg shadow-lg p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">Create Admin Room</h1>

        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="w-full p-3 rounded-md border border-gray-300 text-white bg-blue-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Room Code (e.g. 1234-5678)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="flex-1 p-3 rounded-md border border-gray-300 text-white bg-blue-900 placeholder-gray-400"
          />
          <button
            onClick={generateRoomCode}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md"
          >
            {loading ? "..." : "Generate"}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md"
        >
          Go to Quiz Control Panel
        </button>
      </div>
    </div>
  );
};

export default CreateAdminRoom;
