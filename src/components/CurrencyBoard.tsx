import { useEffect, useState } from "react";
import { useCryptoWebSocket } from "../contexts/CryptoWSContext";
import CurrencyChart from "./CurrencyChart";
import OrderBook from "./OrderBook";

interface CurrencyBoardProps {
  currency: string;
}

interface OrderBookData {
  asks: [number, number][];
  bids: [number, number][];
}

const subscribeChannel = "book";
const bookInstrumentDepth = 10;

export default function CurrencyBoard({ currency }: CurrencyBoardProps) {
  const { socket } = useCryptoWebSocket();
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    asks: [],
    bids: [],
  });

  function handleOrderBookMsg(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.method === "subscribe") {
        // 若訊息包含 channel 與 data，依 channel 分流處理：處理最佳五檔資料 (頻道格式：book.交易對)
        if (msg?.result?.channel === "book" && msg?.result?.instrument_name === currency) {
          // 如收到多於五筆資料，僅取前五筆
          setOrderBook({
            asks: msg.result.data[0].asks.slice(0, 5),
            bids: msg.result.data[0].bids.slice(0, 5),
          });
        }
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }

  useEffect(() => {
    if (!socket) return;
    const subMsg = {
      method: "subscribe",
      params: {
        channels: [`${subscribeChannel}.${currency}.${bookInstrumentDepth}`],
      },
    };
    socket.send(JSON.stringify(subMsg));

    socket.addEventListener("message", handleOrderBookMsg);
    return () => {
      socket.removeEventListener("message", handleOrderBookMsg);
    };
  }, [socket]);

  return (
    <div className="currency-board" >
      <div>
      <OrderBook currency={currency} data={orderBook}  />
      </div>
      <div className="chart-section">
        <CurrencyChart currency={currency} />
      </div>
    </div>
  );
}
