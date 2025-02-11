import {
  candlestickChannel,
  orderBookChannel,
  orderSize,
  wsSubscribeMethod,
} from "../configs/cryptoWSConfig";
import type { CandleStickResponse } from "../types";

export function handleCryptoWSOrderBookMsg(event: MessageEvent, currency: string) {
  try {
    const msg = JSON.parse(event.data);
    if (msg.method === wsSubscribeMethod) {
      if (
        msg?.result?.channel === orderBookChannel &&
        msg?.result?.instrument_name === currency
      ) {
        // 第一筆的 asks 與 bids，各取前五筆
        if (msg.result.data && msg.result.data[0]) {
          return {
            asks: msg.result.data[0].asks.slice(0, orderSize),
            bids: msg.result.data[0].bids.slice(0, orderSize),
          };
        }
      }
    }
  } catch (error) {
    console.error("Error processing WebSocket message:", error);
    return null;
  }
}

export function handleCryptoWSCandlestickMsg(event: MessageEvent, currency: string) {
  try {
    const msg = JSON.parse(event.data);
    if (msg.method === wsSubscribeMethod) {
      if (
        msg?.result?.channel.startsWith(candlestickChannel) &&
        msg?.result?.instrument_name === currency
      ) {
        const candleDataList = msg.result.data;
        if (Array.isArray(candleDataList)) {
          return candleDataList.map((item: CandleStickResponse) => ({
            time: new Date(item.t),
            open: item.o,
            high: item.h,
            low: item.l,
            close: item.c,
            volume: item.v,
          }));
        }
      }
    }
  } catch (error) {
    console.error("Error processing WebSocket message:", error);
    return null;
  }
}