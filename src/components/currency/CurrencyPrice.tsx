import { useCallback, useRef, useState } from "react";
import { useCryptoWSChannelSubscribe } from "../../hooks/useCryptoWSSubscribe";
import { handleCryptoWSTickerChannelMsg } from "../../utils/cryptoMsgHandler";
import { tickerChannel } from "../../configs/cryptoWSConfig";
import type { CandleStickResponse } from "../../types";

interface CurrencyPriceProps {
  currency: string;
}

export default function CurrencyPrice({ currency }: CurrencyPriceProps) {
  const [currPrice, setCurrPrice] = useState(0);
  const prevPrice = useRef(0);

  // 註冊 candlestick 訊息
  const channel = `${tickerChannel}.${currency}`;

  const handleCandlestickMsg = useCallback(
    (data: CandleStickResponse[]) => {
      const candleData = handleCryptoWSTickerChannelMsg(data);
      if (!candleData) return;
      if (candleData.length === 1) {
        const data = candleData[0];
        // 更新最後一筆 candlestick 資料
        const { price } = data;
        if(price === 0 || !price) return;
        setCurrPrice((prev) => {
          prevPrice.current = prev;
          return price;
        });
      }
    },
    [currency]
  );

  const priceColor = () =>
    currPrice > prevPrice.current
      ? "green"
      : currPrice < prevPrice.current
      ? "red"
      : "gray";

  useCryptoWSChannelSubscribe(channel, handleCandlestickMsg);

  return (
    <h3 className="currency-price" style={{ color: priceColor() }}>
      {currPrice === 0 ? "-" : currPrice}
    </h3>
  );
}
