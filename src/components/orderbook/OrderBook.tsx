import "./OrderBook.css";

interface OrderBookData {
  asks: [number, number][];
  bids: [number, number][];
}

interface OrderBookProps {
  currency: string;
  data: OrderBookData;
}

type OrderType = "asks" | "bids";

// 五檔報價
const orderSize = 5;
const orderTypes: OrderType[] = ["asks", "bids"];

/**
 * 根據傳入的資料陣列渲染表格列，
 * 若資料不存在或為空則渲染預設數量列。
 */
const renderRows = (
  rows: [number, number][] | undefined,
  type: OrderType = orderTypes[0]
) => {
  try {
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((row, idx) => (
        <tr key={idx}>
          <td>{type === "asks" ? row[0] : row[1]}</td>
          <td>{type === "asks" ? row[1] : row[0]}</td>
        </tr>
      ));
    }
  } catch (error) {
    console.error("Error rendering rows:", error);
  }
  return Array.from({ length: orderSize }, (_, idx) => (
    <tr key={idx}>
      <td>-</td>
      <td>-</td>
    </tr>
  ));
};

export default function OrderBook({ currency, data }: OrderBookProps) {
  return (
    <div className="order-book">
      <h3>{currency}</h3>
      <div className="order-book-tables">
        <div className="order-side buy-side">
          <h4 className="buy-title">買方 (Bids)</h4>
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>{renderRows(data?.bids, "bids")}</tbody>
          </table>
        </div>
        <div className="order-side sell-side">
          <h4 className="sell-title">賣方 (Asks)</h4>
          <table>
            <thead>
              <tr>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>{renderRows(data?.asks, "asks")}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
