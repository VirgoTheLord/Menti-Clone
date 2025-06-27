import React, { createContext, useContext, useRef, useState } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const connectionCount = useRef(0);
  const retryCount = useRef(0);
  const maxRetries = 3; // Limit retry attempts
  const retryDelay = 5000; // 5 seconds between retries

  const connectWebSocket = (roomId) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      connectionCount.current += 1;
      return;
    }

    // Avoid connecting if already attempting a connection
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

    const ws = new WebSocket("ws://192.168.1.23:5000");
    socketRef.current = ws;
    window.WebSocketInstance = ws; // For access in components

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      connectionCount.current += 1;
      retryCount.current = 0; // Reset retry count on success
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      socketRef.current = null;
      window.WebSocketInstance = null;
      // Attempt to reconnect if there are active components
      if (connectionCount.current > 0 && retryCount.current <= maxRetries) {
        setTimeout(() => connectWebSocket(roomId), retryDelay);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      // onclose will handle reconnection
    };

    ws.onmessage = (event) => {
      // Components handle messages directly
    };
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
