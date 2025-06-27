import React, { createContext, useContext, useRef, useState } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const connectionCount = useRef(0);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const retryDelay = 5000;

  const connectWebSocket = (roomId) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      connectionCount.current += 1;
      return;
    }
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    retryCount.current += 1;
    if (retryCount.current > maxRetries) {
      console.error("Max WebSocket retry attempts reached");
      return;
    }

    const ws = new WebSocket("ws://localhost:5000");
    socketRef.current = ws;
    window.WebSocketInstance = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      connectionCount.current += 1;
      retryCount.current = 0;
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      socketRef.current = null;
      window.WebSocketInstance = null;
      if (connectionCount.current > 0 && retryCount.current <= maxRetries) {
        setTimeout(() => connectWebSocket(roomId), retryDelay);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onmessage = (event) => {};
  };

  const disconnectWebSocket = () => {
    connectionCount.current -= 1;
    if (connectionCount.current <= 0 && socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      window.WebSocketInstance = null;
      connectionCount.current = 0;
      retryCount.current = 0;
    }
  };

  const sendMessage = (type, payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("WebSocket not connected yet.");
    }
  };

  return (
    <WebSocketContext.Provider
      value={{ connectWebSocket, disconnectWebSocket, sendMessage, connected }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
