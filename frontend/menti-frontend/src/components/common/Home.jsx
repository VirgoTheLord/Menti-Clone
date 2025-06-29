import React from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { useState } from "react";

const Home = () => {
  const [roomCode, setRoomCode] = useState("");

  const navigate = useNavigate();

  const handleJoinRoomWithCode = () => {
    ///check if in format XXXX-XXXX
    const regex = /^[0-9]{4}-[0-9]{4}$/;

    const trimmedCode = roomCode.trim();
    const isFormatted = regex.test(trimmedCode);
    if (!trimmedCode || !isFormatted) {
      alert("Your code is either invalid or not in XXXX-XXXX format.");
      return;
    }

    navigate(`/join-room/${trimmedCode}`);
  };

  const handleJoinRoom = () => {
    navigate("/join-room");
  };

  const handleAdminRoom = () => {
    navigate("/create");
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="relative z-20 bg-[#001a4e] shadow-xs w-full">
        <div className="flex items-center justify-center gap-2 p-4 max-w-7xl mx-auto">
          <Input
            type="text"
            placeholder="Enter Room Code To Join as XXXX-XXXX"
            className="text-black w-full max-w-sm h-8 bg-white placeholder:text-gray-400 placeholder:text-xs"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />

          <Button
            size="sm"
            className="bg-blue-500 text-white hover:bg-blue-600 rounded-full text-xs"
            onClick={handleJoinRoomWithCode}
          >
            Join Room
          </Button>
        </div>
      </div>

      <section
        className="relative w-full h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/landing-2.png')` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col justify-center h-full max-w-7xl mx-auto px-6 text-white">
          <h1 className="text-6xl md:text-8xl font-black font-barlow-condensed mb-4 text-left overflow-hidden">
            Welcome to MandiMeter.
          </h1>
          <p className="text-lg md:text-2xl max-w-xl text-left text-gray-200">
            Engage your audience in real-time with live quizzes, polls, and
            feedback.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10">
          <Card className=" rounded-2xl border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-800">
                Create a Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Host live quizzes and control the pace. Share the room code with
                your audience.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAdminRoom}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Create Room
              </Button>
            </CardFooter>
          </Card>

          <Card className=" rounded-2xl border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-800">
                Join a Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Enter a room code and join the quiz in real-time. No login
                required.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleJoinRoom}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Join Room
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
