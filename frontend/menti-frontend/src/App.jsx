import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/common/Home";
import Dashboard from "./components/common/Dashboard";
import UserLayout from "./components/layout/UserLayout";
import CreateRoom from "./components/common/CreateRoom";
import JoinRoom from "./components/common/JoinRoom";
import Quiz from "./components/common/Quiz";
import { WebSocketProvider } from "./utils/webSocketContext";

const App = () => {
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UserLayout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create-room" element={<CreateRoom />} />
            <Route path="join-room" element={<JoinRoom />} />
            <Route path="join-room/:id" element={<JoinRoom />} />
            <Route path="quiz/:id" element={<Quiz />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WebSocketProvider>
  );
};

export default App;
