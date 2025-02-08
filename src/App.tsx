// src/App.tsx
import React, { useEffect, useState, useRef } from 'react';
import OrderBook from './components/OrderBook';
import CandlestickChart from './components/CandlestickChart';
import './style.css';

// 定義最佳五檔資料結構
interface OrderBookData {
  asks: [number, number][];
  bids: [number, number][];
}
interface OrderBooks {
  [instrument: string]: OrderBookData;
}

// 定義 candlestick 資料結構
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

const App: React.FC = () => {

  const instruments = ['BTCUSD-PERP'];
  // const instruments = ['BTCUSD-PERP', 'ETHUSD-PERP', 'XRP_USDT', 'SOL_USDT', 'DOGE_USDT', 'ADA_USDT'];
  const [orderBooks, setOrderBooks] = useState<OrderBooks>({});
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 建立 WebSocket 連線
    const ws = new WebSocket('wss://stream.crypto.com/exchange/v1/market');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      // 訂閱六個交易對的最佳五檔資訊
      instruments.forEach((inst, index) => {
        const subMsg = {
          method: "subscribe",
          params: {
            channels: `book.${inst}`
          },
          id: index + 1
        };
        ws.send(JSON.stringify(subMsg));
      });
      // 訂閱 BTCUSD-PERP 的 1 分鐘 K 線資料
      const candleSubMsg = {
        method: "subscribe",
        params: {
          channels: "candlestick.1m.BTCUSD-PERP"
        },
        id: 100 // 任意 id
      };
      ws.send(JSON.stringify(candleSubMsg));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // 處理 heartbeat 訊息（若 API 定義中 heartbeat 的訊息格式不同，可依文件做調整）
        if (msg.method === "heartbeat") {
          // 例如：收到 heartbeat 時可更新連線狀態，這裡僅記錄
          console.log("Received heartbeat");
          return;
        }
        if(msg.method === 'subscribe') {
          
          // 若訊息包含 channel 與 data，依 channel 分流處理
          if (msg?.result?.channel && msg?.result?.data) {
            // 處理最佳五檔資料 (頻道格式：book.交易對)
            if (msg?.result.channel === "book") {
              console.log('subscribe', msg.result.data);
              // 取得交易對名稱（例如 "book.BTCUSD-PERP"）
              const instrument = msg.result.instrument_name;
              // 預期 msg.data 結構為 { asks: [[price, volume], ...], bids: [[price, volume], ...] }
              // 如收到多於五筆資料，僅取前五筆
              setOrderBooks(prev => ({
                ...prev,
                [instrument]: {
                  asks: msg.result.data[0].asks.slice(0, 5),
                  bids: msg.result.data[0].bids.slice(0, 5)
                }
                
              }));
            }
            // 處理 K 線資料 (頻道格式：candlestick.1m.BTCUSD-PERP)
            else if (msg.result.channel === "candlestick") {
              // 假設 API 回傳的資料結構為：
              // { t: timestamp, o: open, h: high, l: low, c: close, v: volume }
              const candleDataList = msg.result.data;
              if(candleDataList.length > 1) {
                const candleData: Candlestick[] = candleDataList.map((item: CandleStickResponse) => {
                  return {
                    time: new Date(item.t),
                    open: item.o,
                    high: item.h,
                    low: item.l,
                    close: item.c,
                    volume: item.v
                  };
                }).slice(-60);
                setCandlesticks(prev => [...prev, ...candleData]);
              } else if(candleDataList.length === 1) {
                const candleDataRes: CandleStickResponse = candleDataList[0];
                const newCandle: Candlestick = {
                  time: new Date(candleDataRes.t),
                  open: candleDataRes.o,
                  high: candleDataRes.h,
                  low: candleDataRes.l,
                  close: candleDataRes.c,
                  volume: candleDataRes.v
                };
                setCandlesticks(prev => {
                  const updated = [...prev.filter(c => c.time.getTime() !== newCandle.time.getTime()), newCandle];
                  // 依時間排序
                  updated.sort((a, b) => a.time.getTime() - b.time.getTime());
                  return updated.slice(-60);
                });
              }
              // 將新 K 線資料納入陣列（範例中保留最近 60 筆資料）
            }
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      // 此處可考慮加入重連機制
    };

    // 組件卸載時關閉連線
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="app-container">
      {/* <h1>Crypto Dashboard</h1> */}
      <div className="order-books">
        {
          // 將收到的各交易對最佳五檔資料依交易對分別顯示
          instruments.map(inst => (
            <OrderBook key={inst} instrument={inst} data={orderBooks[inst]} />
          ))
        }
      </div>
      <div className="chart-section">
        <h4>BTCUSD-PERP 1 分鐘 K 線圖</h4>
        <CandlestickChart data={candlesticks} width={800} height={400} />
      </div>
    </div>
  );
};

export default App;
