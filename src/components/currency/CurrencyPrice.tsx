import { useCallback, useRef, useState } from "react";
import useCryptoWSSubscribe from "../../hooks/useCryptoWSSubscribe";
import { handleCryptoWSCandlestickMsg } from "../../utils/cryptoMsgHandler";
import {
  candlestickChannel,
  wsSubscribeMethod,
  wsUnSubscribeMethod,
} from "../../configs/cryptoWSConfig";
import { intervals } from '../../configs/chart';

interface CurrencyPriceProps {
  currency: string;
}

export default function CurrencyPrice({ currency }: CurrencyPriceProps) {
  const [currPrice, setCurrPrice] = useState(0);
  const prevPrice = useRef(0);

  // 註冊 candlestick 訊息
    const subMsg = {
      method: wsSubscribeMethod,
      params: { channels: [`${candlestickChannel}.${intervals[0]}.${currency}`] },
    };
  
    // unsubscribe candlestick
    const unsubMsg = {
      method: wsUnSubscribeMethod,
      params: { channels: [`${candlestickChannel}.${intervals[0]}.${currency}`] },
    };
  
    const handleCandlestickMsg = useCallback((event: MessageEvent) => {
      const candleData = handleCryptoWSCandlestickMsg(event, currency);
      if (!candleData) return;
      if(candleData.length === 1) {
        const data = candleData[0]
        // 更新最後一筆 candlestick 資料
        const { close } = data
        setCurrPrice((prev) => {
          prevPrice.current = prev;
          return close
        })
      }}, [currency])

  const priceColor = () =>
    currPrice > prevPrice.current
      ? "green"
      : currPrice < prevPrice.current
      ? "red"
      : "gray";

  useCryptoWSSubscribe(subMsg, unsubMsg, handleCandlestickMsg);

  return <h3 className="currency-price" style={{ color: priceColor() }}>{currPrice === 0 ? '-' : currPrice}</h3>;
}
