import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWebSocket } from "../../utils/websocket/webSocketContext";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();
  const { id: urlRoomCode } = useParams();
  const { connectWebSocket, sendMessage, connected, addMessageHandler } =
    useWebSocket();
  //url room code present in url, entered using code then sets this based on this new things are shown like the link and this
  useEffect(() => {
    if (urlRoomCode) setRoomCode(urlRoomCode);
  }, [urlRoomCode]);

  //this use effect handles incoming WebSocket messages

  useEffect(() => {
    const handleWebSocketMessage = (message) => {
      try {
        //parse message data
        const data = JSON.parse(message.data);

        //if we get validation respoonse we are returnde a boolean check

        if (data.type === "validation-response") {
          const { valid, message } = data.payload;
          //if not valid error
          if (!valid) {
            setError(message);
            setLoading(false);
          } else {
            //else we are valid and can join the room
            sendMessage("join", {
              roomCode,
              playerName: name,
            });
          }
        }
        //now for user-joined

        if (data.type === "user-joined") {
          //we get the active players by filtering out th admin and set it
          const activePlayers = data.payload.players.filter(
            (p) => p !== "__admin__" && !p.startsWith("admin_")
          );
          setPlayers(activePlayers);

          //now since we are part of the active players after validation we can add name to url since we add query param we use encode uricomponent

          if (activePlayers.includes(name.trim())) {
            navigate(`/quiz/${roomCode}?name=${encodeURIComponent(name)}`);
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };
    //declare removehandler

    let removeHandler;
    //if connected is true we add the message handler which will use our function to handle the message
    if (connected) {
      removeHandler = addMessageHandler(handleWebSocketMessage);
    }
    //cleanup

    return () => {
      if (removeHandler) removeHandler();
    };
  }, [connected, name, roomCode, navigate, sendMessage, addMessageHandler]);

  const handleSubmit = (e) => {
    //submit handling
    //prevent defoult to prevent refresh
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
    connectWebSocket(trimmedCode);

    //connection function
    //uses ready state to check for socket state which ensures correct message is sent to bakcend

    const waitForConnection = () => {
      const socket = window.WebSocketInstance;
      if (socket?.readyState === WebSocket.OPEN) {
        sendMessage("validate-room", {
          code: trimmedCode,
          name: trimmedName,
        });
      } else if (socket?.readyState === WebSocket.CLOSED) {
        setError("Failed to connect to WebSocket. Please try again.");
        setLoading(false);
      } else {
        setTimeout(waitForConnection, 100);
      }
    };

    waitForConnection();
  };

  return (
    <div className="w-full h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md h-80vh shadow-xl border-blue-200">
        <CardHeader className="bg-blue-950 text-white rounded-t-lg p-10 text-center -mt-6">
          <h1 className="text-2xl font-bold">Join Room</h1>
          {urlRoomCode && (
            <div className="mt-2 text-blue-300 text-sm">
              Room Code from link:{" "}
              <span className="font-bold">{urlRoomCode}</span>
              <div className="text-xs text-blue-200 mt-1">
                Confirm by entering the same code below
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm text-gray-700 mb-2">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${
                  error
                    ? "border-red-500"
                    : "hover:border-blue-500 focus:border-blue-500 p-2 placeholder:text-xs text-xs"
                }`}
              />
            </div>

            <div>
              <Label htmlFor="roomCode" className="text-sm text-gray-700 mb-2">
                Room Code
              </Label>
              <Input
                id="roomCode"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className={`${
                  error
                    ? "border-red-500"
                    : "hover:border-blue-500 focus:border-blue-500 p-2 placeholder:text-xs text-xs"
                }`}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Validating..." : "Join Room"}
            </Button>

            {urlRoomCode && (
              <button
                type="button"
                onClick={() => {
                  setRoomCode(urlRoomCode);
                  setError("");
                }}
                className="text-blue-600 hover:underline text-sm"
              >
                Use room code from link
              </button>
            )}
          </form>
          <p className="text-xs text-gray-500 text-center">
            WebSocket Status:{" "}
            <span className={connected ? "text-green-600" : "text-red-500"}>
              {connected ? "Connected" : "Disconnected"}
            </span>
          </p>
          //this is the players list which will show the players in the room
          {players.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Players in room:
              </p>
              <ul className="space-y-1 text-sm text-blue-800">
                {players.map((player, idx) => (
                  <li key={idx}>• {player}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoom;
