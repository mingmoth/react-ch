import { memo, useCallback, useEffect, useState } from "react";
import { useCryptoWebSocket } from "../../contexts/CryptoWSContext";
import { handleCryptoWSCandlestickMsg } from '../../utils/cryptoWSData';
import {
  candlestickChannel,
  candlestickDataSize,
  wsSubscribeMethod,
  wsUnSubscribeMethod,
} from "../../configs/cryptoWSConfig";
import CandlestickChart from "../chart/CandlestickChart";
import ResponsiveContainer from "../common/ResponsiveContainer";

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

function CurrencyChart({ currency }: CurrencyChartProps) {
  const { socket } = useCryptoWebSocket();
  const [activeInterval] = useState(intervals[0]);
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);

  const handleCandlestickMsg = useCallback((event: MessageEvent) => {
    const candleData = handleCryptoWSCandlestickMsg(event, currency);
    if (!candleData) return;
    if (Array.isArray(candleData) && candleData.length > 1) {
      const data = candleData.slice(-candlestickDataSize);
      // 如果收到的是歷史資料，直接替換狀態
      setCandlesticks(data);
    } else if(candleData.length === 1) {
      const data = candleData[0]
      // 更新最後一筆 candlestick 資料
      setCandlesticks((prev) => {
        const updated = [
          ...prev.filter(
            (c) => c.time.getTime() !== data.time.getTime()
          ),
          data,
        ];
        updated.sort((a, b) => a.time.getTime() - b.time.getTime());
        return updated.slice(-candlestickDataSize);
      });
    }

  }, [currency])

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
