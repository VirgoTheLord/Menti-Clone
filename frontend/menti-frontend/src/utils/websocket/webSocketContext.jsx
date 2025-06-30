import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";

//initialize websocket context
const WebSocketContext = createContext(null);
//initialize provider so it can apply to all children which use the context, basic syntactual understanding.
export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected");
  const connectionCount = useRef(0);
  const retryCount = useRef(0);
  const retryTimeoutRef = useRef(null);
  const maxRetries = 5;
  const baseRetryDelay = 1000;
  //usecallback used for memoised use, prevent rerenders on every use and to work in tandem with useeffects and useRefs fn, deps

  //messagehandlers in set to ensure unique one for each

  const messageHandlers = useRef(new Set());

  //it something i had ai write for me to get retry delay or prevent continuous reconnection attempts, for easier debugging and prevent crash

  const getRetryDelay = useCallback(() => {
    return Math.min(baseRetryDelay * Math.pow(2, retryCount.current), 10000);
  }, []);

  //method to connect to websocket
  //initialized globally to work on evey page.
  //uses use CallBack functionality which enables me to work the stuff within it if the retry delay has to not passed the required threshhold.

  const connectWebSocket = useCallback(
    (roomId) => {
      //checks the need to if timeout is needed anymore and clears it as we have already connected and set ref to null
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        //we are setting a ready state from backend which ensures that the scoket instance is connected ready and validated.
        connectionCount.current += 1;
        console.log(
          `WebSocket already connected. Connection count: ${connectionCount.current}`
        );
        return;
      }
      //answers the query state of in the process of connecting
      //the state is set by the websocket.readystate which is an existing functionality of websockets.

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        console.log("WebSocket already connecting, waiting...");
        return;
      }

      //the fallback i used ai to write to block off the connectionstate when the retyry count exceeds max retries.

      if (retryCount.current >= maxRetries) {
        console.error(`Max WebSocket retry attempts (${maxRetries}) reached`);
        setConnectionState("error");
        return;
      }
      //logging

      console.log(
        `Attempting WebSocket connection (attempt ${
          retryCount.current + 1
        }/${maxRetries})`
      );
      setConnectionState("connecting");

      //if the socket exists and is created
      //initially set all message hand;ers to null
      //helps reset for every new socket instance and ensure concurrency
      //the socket shoudl onyl be open if its in use
      //else close
      //prevent hanging conenctions in sockets.

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
        //our glabal websocket connection init
        const ws = new WebSocket("ws://localhost:5000");
        socketRef.current = ws;
        //this ai introduced to help me debug using a webinstance type logging
        window.WebSocketInstance = ws;

        //sends back log to ensure websocket connection is established

        ws.onopen = () => {
          console.log("WebSocket connected successfully");
          setConnected(true);
          setConnectionState("connected");
          //since it succceeded reset retry count and set connection count to 1
          connectionCount.current = Math.max(1, connectionCount.current + 1);
          retryCount.current = 0;

          //same logic as bfore for clearing retry timeout

          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        };

        //global on close handler

        ws.onclose = (event) => {
          //helps log the close event and set connection state to disconnected
          console.log(
            `WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`
          );
          setConnected(false);
          setConnectionState("disconnected");

          //when closed we remove the socket reference

          if (socketRef.current === ws) {
            socketRef.current = null;
          }
          if (window.WebSocketInstance === ws) {
            window.WebSocketInstance = null;
          }

          //check retry aattempts and sets retry block for connection
          //the conditions are pretty easy to understand
          //if reached max retries , break and set error state

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

        //on error state to handle errors
        //sets connection state to error and logs the error

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionState("error");
        };

        //global on message handler
        //iterates through all message handlers and calls them with the event
        ws.onmessage = (event) => {
          messageHandlers.current.forEach((handler) => {
            try {
              handler(event);
            } catch (error) {
              console.error("Error in message handler:", error);
            }
          });
        };
        //in catch we call the error and set connection state to error
        //remove socket and websocet instance
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        setConnectionState("error");
        socketRef.current = null;
        window.WebSocketInstance = null;
      }
    },
    //depends on getRetryDelay
    [getRetryDelay]
  );

  //handles disconnecting the websocket

  const disconnectWebSocket = useCallback(() => {
    //obviously reduces disconnection count or when no one is there sèt to 0
    connectionCount.current = Math.max(0, connectionCount.current - 1);
    console.log(
      `Disconnect requested. Connection count: ${connectionCount.current}`
    );

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    //if current connectioncount is 0 we close websocket handshake

    if (connectionCount.current <= 0) {
      console.log("Closing WebSocket connection");
      //set all message handlers to null

      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        //using readState to check if the socket is open or connecting
        //if it is we close it with a normal closure code and reason

        if (
          socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING
        ) {
          socketRef.current.close(1000, "Component unmounted");
        }

        socketRef.current = null;
      }
      //reset for resuse

      window.WebSocketInstance = null;
      connectionCount.current = 0;
      retryCount.current = 0;
      messageHandlers.current.clear();
      setConnected(false);
      setConnectionState("disconnected");
    }
  }, []);

  //method to send messages to the websocket
  //uses a type and a payload

  const sendMessage = useCallback((type, payload) => {
    //websocket exist check
    if (!socketRef.current) {
      console.warn("WebSocket not initialized");
      throw new Error("WebSocket not initialized");
    }
    //connect check using readyState

    if (socketRef.current.readyState === WebSocket.CONNECTING) {
      console.warn("WebSocket still connecting, message queued");
      throw new Error("WebSocket still connecting");
    }
    //if opens perform normal op

    if (socketRef.current.readyState === WebSocket.OPEN) {
      try {
        //stringify because we parse the message on the server side
        const message = JSON.stringify({ type, payload });
        socketRef.current.send(message);
        console.log(`Sent message: ${type}`, payload);
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    } else {
      //just a manual ready state check to ensure the websocket is ready
      //error logging
      //ai said its better to do this so ye
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

  //to add a message handler

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

  //to get the connection info
  //realtime concurrency check
  //returns all current data and references that exist

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
    //default provider syntax to provide these functions and states to all children
    <WebSocketContext.Provider
      value={{
        connectWebSocket,
        disconnectWebSocket,
        sendMessage,
        connected,
        connectionState,
        addMessageHandler,
        getConnectionInfo,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  //instead of using useContext directly which can sometimes lead to errors, or weird, just used as custom hook
  //suggested by ai and was wortha try
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
