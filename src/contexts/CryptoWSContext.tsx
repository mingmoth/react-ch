// src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface IWebSocketContext {
  socket: WebSocket | null;
}

const WebSocketContext = createContext<IWebSocketContext>({ socket: null });

export const CryptoWebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // 建立連線的函式
  const connectWebSocket = () => {
    const ws = new WebSocket('wss://stream.crypto.com/exchange/v1/market');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket 連線已建立");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // 處理 heartbeat 訊息
      if (msg.method === "heartbeat") {
        console.log("Received heartbeat", msg);
        return;
      }
      // 其他訊息可以在這裡進行處理或透過其他方式通知相關元件
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket 連線已關閉");
      setSocket(null);
      wsRef.current = null;
    };
  };

  useEffect(() => {
    // 頁面首次載入時連線
    connectWebSocket();

    // 當頁面變回可見時，重新檢查並連線
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 如果目前沒有連線，或連線狀態非 OPEN（數值 1）
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log("頁面回到可見狀態，重新連線 WebSocket");
          connectWebSocket();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 清除監聽器
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // 根據需求，可以在 unmount 時關閉連線
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

// 自定義 hook
export const useCryptoWebSocket = () => {
  return useContext(WebSocketContext);
};
