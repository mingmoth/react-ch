import CurrencyIntervalChart from "./CurrencyIntervalChart";
import CurrencyOrderBook from "./CurrencyOrderBook";
import CurrencyPrice from "./CurrencyPrice";

interface CurrencyBoardProps {
  currency: string;
}

export default function CurrencyBoard({ currency }: CurrencyBoardProps) {

  return (
    <div className="currency-board">
      <div className="currency-header">
        <h3 className="currency-title">{currency}</h3>
        <CurrencyPrice currency={currency} />
      </div>
      <div className="currency-content">
        <div className="chart-section">
          <CurrencyIntervalChart currency={currency} />
        </div>
        <CurrencyOrderBook currency={currency} />
      </div>
    </div>
  );
}
