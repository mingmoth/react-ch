import { memo, useState } from "react";
import { intervals } from "../../configs/chart";
import CurrencyChart from "./CurrencyChart";

interface CurrencyIntervalChartProps {
  currency: string;
}

function CurrencyIntervalChart({ currency }: CurrencyIntervalChartProps) {
  const [activeInterval, setActiveInterval] = useState(intervals[0]);

  function getIntervalClass(interval: string) {
    return interval === activeInterval ? "currency-interval active" : "currency-interval";
  }

  function handleClickInterval(interval: string) {
    if(!intervals.includes(interval) || interval === activeInterval) return;
    console.log(currency, '圖表切換時間區間', interval);
    setActiveInterval(interval)
  }
  return (
    <>
      <div className="currency-intervals">
        {intervals.map((interval) => (
          <button
            key={interval}
            className={getIntervalClass(interval)}
            onClick={() => handleClickInterval(interval)}
          >
            {interval}
          </button>
        ))}
      </div>
      <CurrencyChart key={activeInterval} currency={currency} interval={activeInterval} />
    </>
  );
}

export default memo(
  CurrencyIntervalChart,
  (prev, next) => prev.currency === next.currency
);
