import "./OrderBook.css";
import { orderSize } from "../../configs/cryptoWSConfig";
import type { OrderBookData } from "../../types";

interface OrderBookProps {
  data: OrderBookData;
}

/**
 * 根據傳入的資料陣列渲染表格列，
 * 若資料不存在或為空則渲染預設數量列。
 */
const renderRows = (
  rows: [number, number][] | undefined,
) => {
  try {
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((row) => (
        <div className="order-row">
          <div>{row[0]}</div>
          <div>{row[1]}</div>
        </div>
      ));
    }
  } catch (error) {
    console.error("Error rendering rows:", error);
  }
  return Array.from({ length: orderSize }, (_, _idx) => (
    <div className="order-row">
      <div>-</div>
      <div>-</div>
    </div>
  ));
};

export default function OrderBook({ data }: OrderBookProps) {
  return (
    <div className="order-book">
      <div className="order-book-tables">
        <div className="order-side buy-side">
          <h4 className="buy-title">買方 (Bids)</h4>
          <div className="order-head buy-side">
            <div>Price</div>
            <div>Amount</div>
          </div>
          <div className="order-content buy-side">
            {renderRows(data?.bids)}
          </div>
        </div>
        <div className="order-side sell-side">
          <h4 className="sell-title">賣方 (Asks)</h4>
          <div className="order-head sell-side">
            <div>Price</div>
            <div>Amount</div>
          </div>
          <div className="order-content sell-side">
            {renderRows(data?.asks)}
          </div>
        </div>
      </div>
    </div>
  );
}
