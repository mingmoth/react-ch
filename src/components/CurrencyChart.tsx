import { memo, useEffect, useState } from "react";
import { useCryptoWebSocket } from "../contexts/CryptoWSContext";
import CandlestickChart from "./CandlestickChart";
import ResponsiveContainer from "./ResponsiveContainer";

interface CurrencyChartProps {
  currency: string;
}

export interface CandleStickResponse {
  t: Date;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
export interface Candlestick {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const intervals = ["1m", "5m", "15m", "30m", "1h", "4h", "1D"];
const chartHeight = '400px';

function LoadingChart() {
  return (
    <div className="loading-chart" style={{ height: chartHeight }}>
      <div className="loading-chart-section"></div>
    </div>
  );
}

const wsSubscribeMethod = "subscribe";
const candlestickChannel = "candlestick";

function CurrencyChart({ currency }: CurrencyChartProps) {
  const { socket } = useCryptoWebSocket();
  const [activeInterval, setActiveInterval] = useState(intervals[0]);
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);

  // const intervalClass = (interval: string) =>
  //   interval === activeInterval ? "interval-btn active" : "interval-btn";

  const handleCandlestickMsg = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.method === wsSubscribeMethod) {
        // 若訊息包含 channel 與 data，依 channel 分流處理:處理 K 線資料 (頻道格式：candlestick.1m.BTCUSD-PERP)
        if (msg?.result?.channel === candlestickChannel && msg?.result?.instrument_name === currency) {
          // 假設 API 回傳的資料結構為：
          // { t: timestamp, o: open, h: high, l: low, c: close, v: volume }
          const candleDataList = msg.result.data;
          if (candleDataList.length > 1) {
            const candleData: Candlestick[] = candleDataList
              .map((item: CandleStickResponse) => {
                return {
                  time: new Date(item.t),
                  open: item.o,
                  high: item.h,
                  low: item.l,
                  close: item.c,
                  volume: item.v,
                };
              })
              .slice(-60);
            setCandlesticks((prev) => [...prev, ...candleData]);
          } else if (candleDataList.length === 1) {
            const candleDataRes: CandleStickResponse = candleDataList[0];
            const newCandle: Candlestick = {
              time: new Date(candleDataRes.t),
              open: candleDataRes.o,
              high: candleDataRes.h,
              low: candleDataRes.l,
              close: candleDataRes.c,
              volume: candleDataRes.v,
            };
            setCandlesticks((prev) => {
              const updated = [
                ...prev.filter(
                  (c) => c.time.getTime() !== newCandle.time.getTime()
                ),
                newCandle,
              ];
              // 依時間排序
              updated.sort((a, b) => a.time.getTime() - b.time.getTime());
              return updated.slice(-300);
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  };

  useEffect(() => {
    if (socket) {
      // 訂閱 BTCUSD-PERP 的 1 分鐘 K 線資料
      const candleSubMsg = {
        method: wsSubscribeMethod,
        params: {
          channels: [`${candlestickChannel}.${activeInterval}.${currency}`],
        },
      };
      socket.send(JSON.stringify(candleSubMsg));

      socket.addEventListener("message", handleCandlestickMsg);
      return () => {
        socket.removeEventListener("message", handleCandlestickMsg);
      };
    }
  }, [socket]);

  return (
    <>
      <div style={{ width: '100%' , height: chartHeight }}>
        <ResponsiveContainer resizingFallback={<LoadingChart />}>
          {({ width, height }) => (
            <CandlestickChart key={currency} data={candlesticks} width={width} height={height} />
          )}
        </ResponsiveContainer>
      </div>
    </>
  );
}

export default memo(CurrencyChart, (prev, next) => prev.currency === next.currency);
