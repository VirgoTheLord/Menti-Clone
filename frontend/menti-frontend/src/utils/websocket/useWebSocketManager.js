import { useCallback, useRef, useState } from "react";

export const useWebSocketManager = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected");
  const connectionCount = useRef(0);
  const retryCount = useRef(0);
  const retryTimeoutRef = useRef(null);
  const maxRetries = 5;
  const baseRetryDelay = 1000;
  const messageHandlers = useRef(new Set());

  const getRetryDelay = useCallback(() => {
    return Math.min(baseRetryDelay * Math.pow(2, retryCount.current), 10000);
  }, []);

  const connectWebSocket = useCallback(
    (roomId) => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        connectionCount.current += 1;
        return;
      }

      if (socketRef.current?.readyState === WebSocket.CONNECTING) return;

      if (retryCount.current >= maxRetries) {
        setConnectionState("error");
        return;
      }

      setConnectionState("connecting");

      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        socketRef.current.close();
        socketRef.current = null;
      }

      try {
        const ws = new WebSocket("ws://192.168.1.21:5000");
        socketRef.current = ws;
        window.WebSocketInstance = ws;

        ws.onopen = () => {
          setConnected(true);
          setConnectionState("connected");
          connectionCount.current = Math.max(1, connectionCount.current + 1);
          retryCount.current = 0;
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        };

        ws.onclose = (event) => {
          setConnected(false);
          setConnectionState("disconnected");
          if (socketRef.current === ws) socketRef.current = null;
          if (window.WebSocketInstance === ws) window.WebSocketInstance = null;

          if (connectionCount.current > 0 && retryCount.current < maxRetries) {
            const delay = getRetryDelay();
            retryTimeoutRef.current = setTimeout(() => {
              retryCount.current += 1;
              connectWebSocket(roomId);
            }, delay);
          } else {
            setConnectionState("error");
          }
        };

        ws.onerror = () => {
          setConnectionState("error");
        };

        ws.onmessage = (event) => {
          messageHandlers.current.forEach((handler) => {
            try {
              handler(event);
            } catch (error) {
              console.error("Message handler error:", error);
            }
          });
        };
      } catch (error) {
        console.error("WebSocket init error:", error);
        setConnectionState("error");
        socketRef.current = null;
        window.WebSocketInstance = null;
      }
    },
    [getRetryDelay]
  );

  const disconnectWebSocket = useCallback(() => {
    connectionCount.current = Math.max(0, connectionCount.current - 1);

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (connectionCount.current <= 0) {
      if (socketRef.current) {
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
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not ready");
    }

    const message = JSON.stringify({ type, payload });
    socketRef.current.send(message);
  }, []);

  const addMessageHandler = useCallback((handler) => {
    messageHandlers.current.add(handler);
    return () => messageHandlers.current.delete(handler);
  }, []);

  const getConnectionInfo = useCallback(
    () => ({
      connected,
      connectionState,
      connectionCount: connectionCount.current,
      retryCount: retryCount.current,
      readyState: socketRef.current?.readyState,
      handlersCount: messageHandlers.current.size,
    }),
    [connected, connectionState]
  );

  return {
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    addMessageHandler,
    connected,
    connectionState,
    getConnectionInfo,
  };
};
