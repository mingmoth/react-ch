import { useCallback, useEffect, useState } from "react";
import { useCryptoWebSocket } from "../../contexts/CryptoWSContext";
import { handleCryptoWSOrderBookMsg } from "../../utils/cryptoWSData";
import {
  bookInstrumentDepth,
  orderBookChannel,
  wsSubscribeMethod,
  wsUnSubscribeMethod,
} from "../../configs/cryptoWSConfig";
import CurrencyChart from "./CurrencyChart";
import OrderBook from "../orderbook/OrderBook";

interface CurrencyBoardProps {
  currency: string;
}

interface OrderBookData {
  asks: [number, number][];
  bids: [number, number][];
}

export default function CurrencyBoard({ currency }: CurrencyBoardProps) {
  const { socket } = useCryptoWebSocket();
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    asks: [],
    bids: [],
  });

  const handleOrderBookMsg = useCallback((event: MessageEvent) => {
    const msg = handleCryptoWSOrderBookMsg(event, currency);
    if(!msg) return;
    setOrderBook(msg);
  }, [currency]);

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
