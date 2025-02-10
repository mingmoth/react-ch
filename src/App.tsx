import { CryptoWebSocketProvider } from "./contexts/CryptoWSContext";
import CurrencyBoard from "./components/CurrencyBoard";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

const App = () => {
  const currencies = ['BTCUSD-PERP', 'ETHUSD-PERP', 'XRP_USDT', 'SOL_USDT', 'DOGE_USDT', 'ADA_USDT'];
  return (
    <CryptoWebSocketProvider>
      <ErrorBoundary>
        <div className="app-container">
          {currencies.map((currency) => (
            <CurrencyBoard key={currency} currency={currency} />
          ))}
        </div>
      </ErrorBoundary>
    </CryptoWebSocketProvider>
  );
};

export default App;
