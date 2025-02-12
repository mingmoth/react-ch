import { candlestickDataSize , candlestickUrl} from '../configs/cryptoWSConfig'

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
    const response = await fetch(`${candlestickUrl}?instrument_name=${instrument_name}&timeframe=${timeframe}&count=${count}`)
    const candlestickResponse = await response.json()
    if(!candlestickResponse?.result) {
      console.error('candlestickResponse', candlestickResponse)
      throw new Error()
    }

    const { data } = candlestickResponse.result
    if(Array.isArray(data) && data.length > 0) {
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
  } catch (error) {
    console.error("Error fetch candlestick history data:", error)
    return null
  }
}