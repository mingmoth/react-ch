import { memo, useCallback, useEffect, useState } from "react";
import { useCryptoWebSocket } from "../contexts/CryptoWSContext";
import CandlestickChart from "./CandlestickChart";
import ResponsiveContainer from "./common/ResponsiveContainer";

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
const chartHeight = "400px";

function LoadingChart() {
  return (
    <div className="loading-chart" style={{ height: chartHeight }}>
      <div className="loading-chart-section"></div>
    </div>
  );
}

const wsSubscribeMethod = "subscribe";
const wsUnSubscribeMethod = "unsubscribe";
const candlestickChannel = "candlestick";

function CurrencyChart({ currency }: CurrencyChartProps) {
  const { socket } = useCryptoWebSocket();
  const [activeInterval] = useState(intervals[0]);
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);

  const handleCandlestickMsg = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === wsSubscribeMethod) {
          // 修改條件：使用 startsWith 判斷頻道字首，並檢查 instrument_name
          if (
            msg?.result?.channel.startsWith(candlestickChannel) &&
            msg?.result?.instrument_name === currency
          ) {
            const candleDataList = msg.result.data;
            if (Array.isArray(candleDataList)) {
              if (candleDataList.length > 1) {
                const candleData: Candlestick[] = candleDataList
                  .map((item: CandleStickResponse) => ({
                    time: new Date(item.t),
                    open: item.o,
                    high: item.h,
                    low: item.l,
                    close: item.c,
                    volume: item.v,
                  }))
                  .slice(-60);
                // 如果收到的是歷史資料，直接替換狀態
                setCandlesticks(candleData);
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
                  updated.sort((a, b) => a.time.getTime() - b.time.getTime());
                  return updated.slice(-300);
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    },
    [currency]
  );

  useEffect(() => {
    if (socket) {
      const candleSubMsg = {
        method: wsSubscribeMethod,
        params: {
          channels: [`${candlestickChannel}.${activeInterval}.${currency}`],
        },
      };
      try {
        socket.send(JSON.stringify(candleSubMsg));
      } catch (error) {
        console.error("Failed to send subscription message:", error);
      }
      socket.addEventListener("message", handleCandlestickMsg);
      return () => {
        socket.removeEventListener("message", handleCandlestickMsg);
        // unsubscribe candlestick ws
        const unsubMsg = {
          method: wsUnSubscribeMethod,
          params: {
            channels: [`${candlestickChannel}.${activeInterval}.${currency}`],
          },
        }
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(unsubMsg));
          }
        } catch (err) {
          console.error("Failed to send unsubscribe message:", err);
        }
      };
    }
  }, [socket, activeInterval, currency]);

  return (
    <>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer resizingFallback={<LoadingChart />}>
          {({ width, height }) => (
            <CandlestickChart
              key={currency}
              data={candlesticks}
              width={width}
              height={height}
            />
          )}
        </ResponsiveContainer>
      </div>
    </>
  );
}

export default memo(CurrencyChart, (prev, next) => prev.currency === next.currency);
