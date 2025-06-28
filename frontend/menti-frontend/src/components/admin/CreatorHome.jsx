import React from "react";
import { useNavigate } from "react-router-dom";

const CreatorHome = () => {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    navigate("/create/room");
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-700 overflow-hidden">
          Mandi.com Creator Dashboard
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Manage your live quiz sessions with ease.
        </p>

        <button
          onClick={handleCreateRoom}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-md text-lg transition duration-200"
        >
          Create New Room
        </button>
      </div>
    </div>
  );
};

export default CreatorHome;
