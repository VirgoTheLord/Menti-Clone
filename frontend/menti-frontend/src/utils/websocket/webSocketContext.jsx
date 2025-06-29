import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected"); // 'disconnected', 'connecting', 'connected', 'error'
  const connectionCount = useRef(0);
  const retryCount = useRef(0);
  const retryTimeoutRef = useRef(null);
  const maxRetries = 5;
  const baseRetryDelay = 1000; // Start with 1 second

  // Store multiple message handlers
  const messageHandlers = useRef(new Set());

  // Calculate exponential backoff delay
  const getRetryDelay = useCallback(() => {
    return Math.min(baseRetryDelay * Math.pow(2, retryCount.current), 10000);
  }, []);

  const connectWebSocket = useCallback(
    (roomId) => {
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // If already connected, just increment counter
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        connectionCount.current += 1;
        console.log(
          `WebSocket already connected. Connection count: ${connectionCount.current}`
        );
        return;
      }

      // If currently connecting, wait for it to complete
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        console.log("WebSocket already connecting, waiting...");
        return;
      }

      // Check retry limit
      if (retryCount.current >= maxRetries) {
        console.error(`Max WebSocket retry attempts (${maxRetries}) reached`);
        setConnectionState("error");
        return;
      }

      console.log(
        `Attempting WebSocket connection (attempt ${
          retryCount.current + 1
        }/${maxRetries})`
      );
      setConnectionState("connecting");

      // Clean up any existing socket
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
        socketRef.current = null;
      }

      try {
        const ws = new WebSocket("ws://localhost:5000");
        socketRef.current = ws;
        window.WebSocketInstance = ws;

        ws.onopen = () => {
          console.log("WebSocket connected successfully");
          setConnected(true);
          setConnectionState("connected");
          connectionCount.current = Math.max(1, connectionCount.current + 1);
          retryCount.current = 0; // Reset retry count on successful connection

          // Clear any pending retry timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        };

        ws.onclose = (event) => {
          console.log(
            `WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`
          );
          setConnected(false);
          setConnectionState("disconnected");

          // Clean up references
          if (socketRef.current === ws) {
            socketRef.current = null;
          }
          if (window.WebSocketInstance === ws) {
            window.WebSocketInstance = null;
          }

          // Only retry if we had active connections and haven't exceeded retry limit
          if (connectionCount.current > 0 && retryCount.current < maxRetries) {
            const delay = getRetryDelay();
            console.log(`Attempting reconnection in ${delay}ms...`);

            retryTimeoutRef.current = setTimeout(() => {
              retryCount.current += 1;
              connectWebSocket(roomId);
            }, delay);
          } else if (retryCount.current >= maxRetries) {
            console.error("Max retries reached, giving up");
            setConnectionState("error");
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionState("error");

          // Don't immediately retry on error - let onclose handle it
          // This prevents rapid retry loops on connection errors
        };

        // Broadcast messages to all registered handlers
        ws.onmessage = (event) => {
          messageHandlers.current.forEach((handler) => {
            try {
              handler(event);
            } catch (error) {
              console.error("Error in message handler:", error);
            }
          });
        };
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        setConnectionState("error");
        socketRef.current = null;
        window.WebSocketInstance = null;
      }
    },
    [getRetryDelay]
  );

  const disconnectWebSocket = useCallback(() => {
    connectionCount.current = Math.max(0, connectionCount.current - 1);
    console.log(
      `Disconnect requested. Connection count: ${connectionCount.current}`
    );

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Only actually disconnect if no more components need the connection
    if (connectionCount.current <= 0) {
      console.log("Closing WebSocket connection");

      if (socketRef.current) {
        // Remove event listeners to prevent reconnection attempts
        socketRef.current.onopen = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;

        if (
          socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING
        ) {
          socketRef.current.close(1000, "Component unmounted");
        }

        socketRef.current = null;
      }

      window.WebSocketInstance = null;
      connectionCount.current = 0;
      retryCount.current = 0;
      messageHandlers.current.clear();
      setConnected(false);
      setConnectionState("disconnected");
    }
  }, []);

  const sendMessage = useCallback((type, payload) => {
    if (!socketRef.current) {
      console.warn("WebSocket not initialized");
      throw new Error("WebSocket not initialized");
    }

    if (socketRef.current.readyState === WebSocket.CONNECTING) {
      console.warn("WebSocket still connecting, message queued");
      throw new Error("WebSocket still connecting");
    }

    if (socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({ type, payload });
        socketRef.current.send(message);
        console.log(`Sent message: ${type}`, payload);
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    } else {
      const readyStateNames = {
        [WebSocket.CONNECTING]: "CONNECTING",
        [WebSocket.OPEN]: "OPEN",
        [WebSocket.CLOSING]: "CLOSING",
        [WebSocket.CLOSED]: "CLOSED",
      };
      const stateName =
        readyStateNames[socketRef.current.readyState] || "UNKNOWN";
      console.warn(
        `WebSocket not ready. State: ${stateName} (${socketRef.current.readyState})`
      );
      throw new Error(`WebSocket not ready. State: ${stateName}`);
    }
  }, []);

  const addMessageHandler = useCallback((handler) => {
    messageHandlers.current.add(handler);
    console.log(
      `Message handler added. Total handlers: ${messageHandlers.current.size}`
    );

    return () => {
      messageHandlers.current.delete(handler);
      console.log(
        `Message handler removed. Total handlers: ${messageHandlers.current.size}`
      );
    };
  }, []);

  // Helper function to get connection info for debugging
  const getConnectionInfo = useCallback(() => {
    return {
      connected,
      connectionState,
      connectionCount: connectionCount.current,
      retryCount: retryCount.current,
      readyState: socketRef.current?.readyState,
      handlersCount: messageHandlers.current.size,
    };
  }, [connected, connectionState]);

  return (
    <WebSocketContext.Provider
      value={{
        connectWebSocket,
        disconnectWebSocket,
        sendMessage,
        connected,
        connectionState,
        addMessageHandler,
        getConnectionInfo, // For debugging
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
