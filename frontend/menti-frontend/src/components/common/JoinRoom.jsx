import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id: urlRoomCode } = useParams();

  useEffect(() => {
    if (urlRoomCode) {
      setRoomCode(urlRoomCode);
    }
  }, [urlRoomCode]);

  const validateRoomCode = async (code, name) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/validate-room-code",
        {
          code,
          name,
        }
      );
      return res.data.valid;
    } catch (err) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedCode = roomCode.trim();
    const trimmedName = name.trim();

    if (!trimmedCode || !trimmedName) {
      setError("Please enter both name and room code.");
      return;
    }

    if (urlRoomCode && urlRoomCode !== trimmedCode) {
      setError(
        `Room code mismatch. Expected: ${urlRoomCode}, but you entered: ${trimmedCode}`
      );
      return;
    }

    setLoading(true);
    const isValidRoom = await validateRoomCode(trimmedCode, trimmedName);
    setLoading(false);

    if (!isValidRoom) {
      setError("Invalid room code or name already taken.");
      return;
    }

    console.log(`${trimmedName} joining room: ${trimmedCode}`);
    navigate(`/quiz/${trimmedCode}?name=${encodeURIComponent(trimmedName)}`);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-blue-950 text-white w-full max-w-md rounded-lg shadow-lg p-8 flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-bold text-center">Join Room</h1>

        {urlRoomCode && (
          <div className="w-full bg-blue-800 p-3 rounded-md text-center">
            <p className="text-sm">
              Room Code from link:{" "}
              <span className="font-bold">{urlRoomCode}</span>
            </p>
            <p className="text-xs text-blue-200 mt-1">
              Confirm by entering the same code below
            </p>
          </div>
        )}

        <div className="w-full">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full p-3 rounded-md border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 ${
              error
                ? "border-red-500 bg-red-900/20"
                : "border-gray-300 bg-blue-900/20"
            }`}
          />
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className={`w-full p-3 rounded-md border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error
                ? "border-red-500 bg-red-900/20"
                : "border-gray-300 bg-blue-900/20"
            }`}
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-950"
        >
          {loading ? "Validating..." : "Join Room"}
        </button>

        {urlRoomCode && (
          <button
            onClick={() => {
              setRoomCode(urlRoomCode);
              setError("");
            }}
            className="text-blue-300 hover:text-blue-100 text-sm underline"
          >
            Use room code from link
          </button>
        )}
      </div>
    </div>
  );
};

export default JoinRoom;
