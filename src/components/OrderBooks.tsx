import { useEffect, useState } from "react";
import { useCryptoWebSocket } from "../contexts/CryptoWSContext";
import OrderBook from "./OrderBook";

interface OrderBookData {
  asks: [number, number][];
  bids: [number, number][];
}
interface OrderBooks {
  [instrument: string]: OrderBookData;
}

export default function OrderBooks() {
  const instruments = ['BTCUSD-PERP', 'ETHUSD-PERP', 'XRP_USDT', 'SOL_USDT', 'DOGE_USDT', 'ADA_USDT'];
  const { socket } = useCryptoWebSocket();
  const [orderBooks, setOrderBooks] = useState<OrderBooks>({});

  useEffect(() => {
    // 當 WebSocket 連線建立時訂閱最佳五檔資料
    if (socket) {
      instruments.forEach((inst, index) => {
        const subMsg = {
          method: "subscribe",
          params: {
            channels: `book.${inst}`,
          },
          id: index + 1,
        };
        socket.send(JSON.stringify(subMsg));
      });

      const handleOrderBookMsg = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          // 處理 heartbeat 訊息（若 API 定義中 heartbeat 的訊息格式不同，可依文件做調整）
          if (msg.method === "heartbeat") {
            // 例如：收到 heartbeat 時可更新連線狀態，這裡僅記錄
            console.log("Received heartbeat");
            return;
          }
          if (msg.method === "subscribe") {
            // 若訊息包含 channel 與 data，依 channel 分流處理：處理最佳五檔資料 (頻道格式：book.交易對)
            if (msg?.result?.channel === "book") {
              // console.log('subscribe', msg.result.data);
              // 取得交易對名稱（例如 "book.BTCUSD-PERP"）
              const instrument = msg.result.instrument_name;
              // 預期 msg.data 結構為 { asks: [[price, volume], ...], bids: [[price, volume], ...] }
              // 如收到多於五筆資料，僅取前五筆
              setOrderBooks((prev) => ({
                ...prev,
                [instrument]: {
                  asks: msg.result.data[0].asks.slice(0, 5),
                  bids: msg.result.data[0].bids.slice(0, 5),
                },
              }));
            }
            // }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
      socket.addEventListener("message", handleOrderBookMsg);
      return () => {
        socket.removeEventListener("message", handleOrderBookMsg);
      };
    }
  }, [socket]);

  return (
    <div className="order-books">
      {
        // 將收到的各交易對最佳五檔資料依交易對分別顯示
        instruments.map((inst) => (
          <OrderBook key={inst} instrument={inst} data={orderBooks[inst]} />
        ))
      }
    </div>
  );
}
