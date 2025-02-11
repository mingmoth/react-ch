import { memo, useCallback, useState } from "react";
import useCryptoWSSubscribe from '../../hooks/useCryptoWSSubscribe';
import { handleCryptoWSCandlestickMsg } from '../../utils/cryptoMsgHandler';
import {
  candlestickChannel,
  candlestickDataSize,
  wsSubscribeMethod,
  wsUnSubscribeMethod,
} from "../../configs/cryptoWSConfig";
import { intervals, chartHeight } from '../../configs/chart';
import CandlestickChart from "../chart/CandlestickChart";
import ResponsiveContainer from "../common/ResponsiveContainer";
import type { Candlestick } from "../../types";

function LoadingChart() {
  return (
    <div className="loading-chart" style={{ height: chartHeight }}>
      <div className="loading-chart-section"></div>
    </div>
  );
}

interface CurrencyChartProps {
  currency: string;
}

function CurrencyChart({ currency }: CurrencyChartProps) {
  const [activeInterval] = useState(intervals[0]);
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);

  // 註冊 candlestick 訊息
  const subMsg = {
    method: wsSubscribeMethod,
    params: { channels: [`${candlestickChannel}.${activeInterval}.${currency}`] },
  };

  // unsubscribe candlestick
  const unsubMsg = {
    method: wsUnSubscribeMethod,
    params: { channels: [`${candlestickChannel}.${activeInterval}.${currency}`] },
  };

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

  // subscribe ws candlestick
  useCryptoWSSubscribe(subMsg, unsubMsg, handleCandlestickMsg)

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
