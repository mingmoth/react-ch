import { createContext, useContext, useEffect, useRef, useState } from 'react';

const cryptoWSHeartbeat = "public/heartbeat";
const cryptoWSRespondHeartbeat = "public/respond-heartbeat";

interface CryptoWebSocketContext {
  socket: WebSocket | null;
}

const WebSocketContext = createContext<CryptoWebSocketContext>({ socket: null });

export const CryptoWebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);


  function connectWebSocket () {
    try {
      const ws = new WebSocket('wss://stream.crypto.com/exchange/v1/market');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connect");
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { id, method } = msg;
          // 處理 heartbeat 訊息
          if (method === cryptoWSHeartbeat) {
            console.log("Received heartbeat", id);
            const heartbeatResponse = {
              id,
              method: cryptoWSRespondHeartbeat,
            };
            try {
              ws.send(JSON.stringify(heartbeatResponse));
            } catch (sendError) {
              console.error("Error sending heartbeat response:", sendError);
            }
            return;
          }
        } catch (parseError) {
          console.error("Error parsing WebSocket message:", parseError);
        }
      };

      ws.onerror = (event: Event) => {
        console.error("WebSocket error:", event);
      };

      ws.onclose = (event: CloseEvent) => {
        console.log("WebSocket close:", event);
        setSocket(null);
        wsRef.current = null;
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  useEffect(() => {
    // 首次載入時建立連線
    connectWebSocket();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log("Reconnect WebSocket");
          connectWebSocket();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 清除監聽
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useCryptoWebSocket = () => {
  return useContext(WebSocketContext);
};
