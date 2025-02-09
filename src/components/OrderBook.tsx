// src/components/OrderBook.tsx
import React from 'react';

interface OrderBookData {
  asks: [number, number][];
  bids: [number, number][];
}

interface OrderBookProps {
  instrument: string;
  data: OrderBookData;
}

const OrderBook: React.FC<OrderBookProps> = ({ instrument, data }) => {
  return (
    <div className="order-book">
      <h3>{instrument}</h3>
      <div className="order-book-tables">
        <div className="order-side sell-side">
          <h4 className="sell-title">賣方 (Asks)</h4>
          <table>
            <thead>
              <tr>
                <th>價格</th>
                <th>數量</th>
              </tr>
            </thead>
            <tbody>
              {data?.asks && data.asks.map((ask, idx) => (
                <tr key={idx}>
                  <td>{ask[0]}</td>
                  <td>{ask[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="order-side buy-side">
          <h4 className="buy-title">買方 (Bids)</h4>
          <table>
            <thead>
              <tr>
                <th>價格</th>
                <th>數量</th>
              </tr>
            </thead>
            <tbody>
              {data?.bids && data.bids.map((bid, idx) => (
                <tr key={idx}>
                  <td>{bid[0]}</td>
                  <td>{bid[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
