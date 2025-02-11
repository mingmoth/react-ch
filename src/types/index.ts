export interface Candlestick {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleStickResponse {
  t: Date;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface OrderBookData {
  asks: [number, number][];
  bids: [number, number][];
}
