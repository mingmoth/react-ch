import { useCallback, useState } from "react";
import useCryptoWSSubscribe from '../../hooks/useCryptoWSSubscribe';
import { handleCryptoWSOrderBookMsg } from "../../utils/cryptoMsgHandler";
import {
  bookInstrumentDepth,
  orderBookChannel,
  wsSubscribeMethod,
  wsUnSubscribeMethod,
} from "../../configs/cryptoWSConfig";
import CurrencyChart from "./CurrencyChart";
import OrderBook from "../orderbook/OrderBook";
import CurrencyPrice from "./CurrencyPrice";
import type { OrderBookData } from "../../types";

interface CurrencyBoardProps {
  currency: string;
}

export default function CurrencyBoard({ currency }: CurrencyBoardProps) {
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    asks: [],
    bids: [],
  });

  // 註冊 orderbook 訊息
  const subMsg = {
    method: wsSubscribeMethod,
    params: { channels: [`${orderBookChannel}.${currency}.${bookInstrumentDepth}`] },
  };

  // unsubscribe orderbook
  const unsubMsg = {
    method: wsUnSubscribeMethod,
    params: { channels: [`${orderBookChannel}.${currency}.${bookInstrumentDepth}`] },
  };

  const handleOrderBookMsg = useCallback((event: MessageEvent) => {
    const msg = handleCryptoWSOrderBookMsg(event, currency);
    if(!msg) return;
    setOrderBook(msg);
  }, [currency]);

  // subscribe ws orderbook
  useCryptoWSSubscribe(subMsg, unsubMsg, handleOrderBookMsg);

  return (
    <div className="currency-board">
      <div className="currency-header">
        <h3>{currency}</h3>
        <CurrencyPrice currency={currency} />
      </div>
      <div className="currency-content">
        <div className="chart-section">
          <CurrencyChart currency={currency} />
        </div>
        <OrderBook data={orderBook} />
      </div>
    </div>
  );
}
