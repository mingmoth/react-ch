import { handleCryptoWSCandlestickChannelMsg } from './cryptoMsgHandler';
import { candlestickDataSize , candlestickUrl } from '../configs/cryptoWSConfig'
import type { CandleStickResponse } from '../types'

export interface CandlestickParams {
  instrument_name: string
  timeframe: string
  count?: number
}

export async function fetchCryptoCandlestickData({
  instrument_name,
  timeframe,
  count = candlestickDataSize
}: CandlestickParams) {
  try {
    // crypto.com get-candlestick api
    // @see: https://exchange-docs.crypto.com/exchange/v1/rest-ws/index.html#public-get-candlestick
    const response = await fetch(`${candlestickUrl}?instrument_name=${instrument_name}&timeframe=${timeframe}&count=${count}`)
    const candlestickResponse = await response.json()
    if(!candlestickResponse?.result) {
      console.error('candlestickResponse', candlestickResponse)
      throw new Error()
    }

    const { data }: { data: CandleStickResponse[] } = candlestickResponse.result
    if(Array.isArray(data) && data.length > 0) {
      return handleCryptoWSCandlestickChannelMsg(data);
    }
    return null
  } catch (error) {
    console.error("Error fetch candlestick history data:", error)
    return null
  }
}