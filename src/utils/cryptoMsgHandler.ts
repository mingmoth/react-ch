import { orderSize } from "../configs/cryptoWSConfig";
import type { CandleStickResponse, OrderBookData } from "../types";


export function handleCryptoWSBookChannelMsg(data: OrderBookData[]) {
  if (Array.isArray(data) && data.length > 0) {
    return {
      asks: data[0].asks.slice(0, orderSize),
      bids: data[0].bids.slice(0, orderSize),
    };
  }
  return null
}

export function handleCryptoWSCandlestickChannelMsg(data: CandleStickResponse[]) {
  if (Array.isArray(data) && data.length > 0) {
    return data.map((item) => ({
      time: new Date(item.t),
      open: Number(item.o),
      high: Number(item.h),
      low: Number(item.l),
      close: Number(item.c),
      volume: Number(item.v),
    }));
  }
  return null
}

export function handleCryptoWSTickerChannelMsg(data: any) {
  if (Array.isArray(data) && data.length > 0) {
    return data.map((tick) => {
      return {
        high: Number(tick.h),
        low: Number(tick.l),
        price: Number(tick.a),
        time: new Date(tick.t),
      }
    })
  }
}
