import { useCallback, useEffect, useRef, useState } from "react";
import { useCryptoWSChannelSubscribe } from "../../hooks/useCryptoWSSubscribe";
import { handleCryptoWSCandlestickChannelMsg } from "../../utils/cryptoMsgHandler";
import { fetchCryptoCandlestickData } from "../../utils/candlestickApi";
import { candlestickChannel, candlestickDataSize } from "../../configs/cryptoWSConfig";
import { chartHeight } from "../../configs/chart";
import CandlestickChart from "../chart/CandlestickChart";
import ResponsiveContainer from "../common/ResponsiveContainer";
import type { Candlestick, CandleStickResponse } from "../../types";

function LoadingChart() {
  return (
    <div className="loading-chart" style={{ height: chartHeight }}>
      <div className="loading-chart-section"></div>
    </div>
  );
}

interface CurrencyChartProps {
  currency: string;
  interval: string;
}

export default function CurrencyChart({
  currency,
  interval,
}: CurrencyChartProps) {
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const isCandleHistoryFetch = useRef(false);

  // 註冊 candlestick channel
  const channel = `${candlestickChannel}.${interval}.${currency}`;

  const handleCandlestickMsg = useCallback(
    (data: CandleStickResponse[]) => {
      const candleData = handleCryptoWSCandlestickChannelMsg(data);
      if (!candleData) return;
      if (candleData.length === 1) {
        const data = candleData[0];
        // 更新最後一筆 candlestick 資料
        setCandlesticks((prev) => {
          const updated = [
            ...prev.filter((c) => c.time.getTime() !== data.time.getTime()),
            data,
          ];
          updated.sort((a, b) => a.time.getTime() - b.time.getTime());
          return updated.slice(-candlestickDataSize);
        });
      }
      // else if (Array.isArray(candleData) && candleData.length > 1) {
      //   return;
        // 改由打api 來完成
        // const data = candleData.slice(-candlestickDataSize);
        // // 如果收到的是歷史資料，直接替換狀態
        // setCandlesticks(data);
      // }
    },
    [currency]
  );

  useCryptoWSChannelSubscribe(channel, handleCandlestickMsg);

  async function getCandleHistoryData() {
    const data = await fetchCryptoCandlestickData({
      instrument_name: currency,
      timeframe: interval,
    });
    if (!data || data.length <= 1) return;
    setCandlesticks(data);
  }

  useEffect(() => {
    if (!isCandleHistoryFetch.current) {
      getCandleHistoryData();
      isCandleHistoryFetch.current = true;
    }
  }, [currency, interval]);

  return (
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
  );
}
