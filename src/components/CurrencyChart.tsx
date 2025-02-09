import { useEffect, useState } from "react";
import { useCryptoWebSocket } from "../contexts/CryptoWSContext";
import CandlestickChart from "./CandlestickChart";

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

const intervals = ["1m", "5m", "30m", "1h", "4h", "1D", "7D", "1M"];

export default function CurrencyChart() {
  const { socket } = useCryptoWebSocket();
  const [activeInterval, setActiveInterval] = useState(intervals[0]);
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const intervalClass = (interval: string) =>
    interval === activeInterval ? "interval-btn active" : "interval-btn";

  useEffect(() => {
    if (socket) {
      // 訂閱 BTCUSD-PERP 的 1 分鐘 K 線資料
      const candleSubMsg = {
        method: "subscribe",
        params: {
          channels: `candlestick.${activeInterval}.BTCUSD-PERP`,
        },
        id: 100, // 任意 id
      };
      socket.send(JSON.stringify(candleSubMsg));

      const handleCandlestickMsg = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          // 處理 heartbeat 訊息（若 API 定義中 heartbeat 的訊息格式不同，可依文件做調整）
          if (msg.method === "heartbeat") {
            // 例如：收到 heartbeat 時可更新連線狀態，這裡僅記錄
            console.log("Received heartbeat");
            return;
          }
          if (msg.method === "subscribe") {
            // 若訊息包含 channel 與 data，依 channel 分流處理:處理 K 線資料 (頻道格式：candlestick.1m.BTCUSD-PERP)
            if (msg?.result?.channel === "candlestick") {
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
                  return updated.slice(-60);
                });
              }
              // 將新 K 線資料納入陣列（範例中保留最近 60 筆資料）
            }
            // }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      socket.addEventListener("message", handleCandlestickMsg);
      return () => {
        socket.removeEventListener("message", handleCandlestickMsg);
      };
    }
  }, [socket, activeInterval]);
  return (
    <>
      <h4>BTCUSD-PERP {activeInterval} K 線圖</h4>
      <div className="interval-selector">
        {intervals.map((interval) => (
          <button
            key={interval}
            className={intervalClass(interval)}
            onClick={() => setActiveInterval(interval)}
          >
            {interval}
          </button>
        ))}
      </div>
      <CandlestickChart data={candlesticks} width={800} height={400} />
    </>
  );
}
