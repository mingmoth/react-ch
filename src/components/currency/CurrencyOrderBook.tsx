import { useCallback, useState } from "react";
import { useCryptoWSChannelSubscribe } from '../../hooks/useCryptoWSSubscribe';
import { handleCryptoWSBookChannelMsg } from "../../utils/cryptoMsgHandler";
import { bookInstrumentDepth,orderBookChannel } from "../../configs/cryptoWSConfig";
import OrderBook from "../orderbook/OrderBook";
import type { OrderBookData } from "../../types";

interface CurrencyOrderBookProps {
  currency: string;
}

export default function CurrencyOrderBook({ currency }: CurrencyOrderBookProps) {
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    asks: [],
    bids: [],
  });

  // 註冊 orderbook 訊息
  const channel = `${orderBookChannel}.${currency}.${bookInstrumentDepth}`;

  const handleOrderBookMsg = useCallback((data: OrderBookData[]) => {
    const orderBookData = handleCryptoWSBookChannelMsg(data)
    if(!orderBookData) return;
    setOrderBook(orderBookData);
  }, [currency]);

  // subscribe ws orderbook
  useCryptoWSChannelSubscribe(channel, handleOrderBookMsg);

  return <OrderBook data={orderBook} />;
}
