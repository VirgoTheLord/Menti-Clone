import React from "react";

const RoomInfo = ({
  roomName,
  roomCode,
  connectionState,
  adminJoined,
  started,
  quizEnded,
}) => {
  const getStatusClass = (state) => {
    switch (state) {
      case "connected":
        return "text-green-400";
      case "connecting":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="space-y-3 mb-6">
      <div>
        <span className="font-medium">Room Name:</span> {roomName || "Untitled"}
      </div>
      <div>
        <span className="font-medium">Room Code:</span>
        <span className="ml-2 text-2xl font-mono text-blue-300">
          {roomCode}
        </span>
      </div>
      <div>
        <span className="font-medium">Connection:</span>{" "}
        <span className={getStatusClass(connectionState)}>
          {connectionState === "connected"
            ? "Connected"
            : connectionState === "connecting"
            ? "Connecting..."
            : connectionState === "error"
            ? "Connection Error"
            : "Disconnected"}
        </span>
      </div>
      <div>
        <span className="font-medium">Admin Status:</span>{" "}
        <span className={adminJoined ? "text-green-400" : "text-yellow-400"}>
          {adminJoined ? "Joined" : "Joining..."}
        </span>
      </div>
      <div>
        <span className="font-medium">Quiz State:</span>{" "}
        <span
          className={
            started
              ? "text-yellow-400"
              : quizEnded
              ? "text-purple-400"
              : "text-blue-400"
          }
        >
          {quizEnded ? "Ended" : started ? "In Progress" : "Waiting"}
        </span>
      </div>
    </div>
  );
};

export default RoomInfo;
