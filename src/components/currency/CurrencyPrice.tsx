import { useCallback, useRef, useState } from "react";
import useCryptoWSSubscribe from "../../hooks/useCryptoWSSubscribe";
import { handleCryptoWSTradeMsg } from "../../utils/cryptoMsgHandler";
import {
  tradeChannel,
  wsSubscribeMethod,
  wsUnSubscribeMethod,
} from "../../configs/cryptoWSConfig";

interface CurrencyPriceProps {
  currency: string;
}

export default function CurrencyPrice({ currency }: CurrencyPriceProps) {
  const [currPrice, setCurrPrice] = useState(0);
  const prevPrice = useRef(0);

  const subMsg = {
    method: wsSubscribeMethod,
    params: { channels: [`${tradeChannel}.${currency}`] },
  };

  const unsubMsg = {
    method: wsUnSubscribeMethod,
    params: { channels: [`${tradeChannel}.${currency}`] },
  };

  const handleTradeMsg = useCallback(
    (event: MessageEvent) => {
      const tradeData = handleCryptoWSTradeMsg(event, currency);
      if (!tradeData) return;
      const { p: price } = tradeData;
      if (price) {
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

  useCryptoWSSubscribe(subMsg, unsubMsg, handleTradeMsg);

  return <h3 className="currency-price" style={{ color: priceColor() }}>{currPrice}</h3>;
}
