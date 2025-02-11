import { useCallback, useEffect, useState } from "react";
import { useCryptoWebSocket } from "../contexts/CryptoWSContext";
import CurrencyChart from "./CurrencyChart";
import OrderBook from "./orderbook/OrderBook";

interface CurrencyBoardProps {
  currency: string;
}

interface OrderBookData {
  asks: [number, number][];
  bids: [number, number][];
}

const wsSubscribeMethod = "subscribe";
const wsUnSubscribeMethod = "unsubscribe";
const orderBookChannel = "book";
const bookInstrumentDepth = 10;

export default function CurrencyBoard({ currency }: CurrencyBoardProps) {
  const { socket } = useCryptoWebSocket();
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    asks: [],
    bids: [],
  });

  const handleOrderBookMsg = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.method === wsSubscribeMethod) {
        if (
          msg?.result?.channel === orderBookChannel &&
          msg?.result?.instrument_name === currency
        ) {
          // 第一筆的 asks 與 bids，各取前五筆
          if (msg.result.data && msg.result.data[0]) {
            setOrderBook({
              asks: msg.result.data[0].asks.slice(0, 5),
              bids: msg.result.data[0].bids.slice(0, 5),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }, [currency])

  useEffect(() => {
    if (!socket) return;
    const subMsg = {
      method: wsSubscribeMethod,
      params: {
        channels: [`${orderBookChannel}.${currency}.${bookInstrumentDepth}`],
      },
    };

    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(subMsg));
      } else {
        console.warn("Socket is not open. Current readyState:", socket.readyState);
      }
    } catch (err) {
      console.error("Failed to send subscription message:", err);
    }

    socket.addEventListener("message", handleOrderBookMsg);
    return () => {
      socket.removeEventListener("message", handleOrderBookMsg);
      // unsubscribe order book ws
      const unsubMsg = {
        method: wsUnSubscribeMethod,
        params: { channels: [`${orderBookChannel}.${currency}.${bookInstrumentDepth}`] },
      };
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(unsubMsg));
        }
      } catch (err) {
        console.error("Failed to send unsubscribe message:", err);
      }
    };
  }, [socket, currency]);

  return (
    <div className="currency-board">
      <OrderBook currency={currency} data={orderBook} />
      <div className="chart-section">
        <CurrencyChart currency={currency} />
      </div>
    </div>
  );
}
