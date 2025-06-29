import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const handleJoinRoom = () => {
    navigate("/join-room");
  };
  const handleAdminRoom = () => {
    navigate("/create");
  };
  return (
    <div className="w-[100vw] h-[100vh] mx-auto">
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-4xl font-bold mb-4 overflow-hidden">
          Welcome to Mandi.com
        </h1>
        <p className="text-lg mb-8">
          Your interactive platform for real-time engagement.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={handleJoinRoom}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Join Room
          </button>
          <button
            onClick={handleAdminRoom}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Admin Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
