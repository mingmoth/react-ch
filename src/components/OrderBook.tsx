import "../styles/OrderBook.css";

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
const orderType: OrderType[] = ["asks", "bids"];

/**
 * 根據傳入的資料陣列渲染表格列，
 * 若資料不存在或為空則回傳 orderSize 筆預設的 placeholder 列
 */
const renderRows = (
  rows?: [number, number][],
  type: OrderType = orderType[0]
) => {
  if (rows && rows.length > 0) {
    return rows.map((row, idx) => (
      <tr key={idx}>
        <td>{type === "asks" ? row[0] : row[1]}</td>
        <td>{type === "asks" ? row[1] : row[0]}</td>
      </tr>
    ));
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
            <tbody>{renderRows(data?.bids, orderType[1])}</tbody>
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
            <tbody>{renderRows(data?.asks)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
