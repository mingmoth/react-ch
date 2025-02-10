import { CryptoWebSocketProvider } from "./contexts/CryptoWSContext";
import CurrencyBoard from "./components/CurrencyBoard";
import "./App.css";
import "./style.css";

const App = () => {
  const currencies = ['BTCUSD-PERP', 'ETHUSD-PERP', 'XRP_USDT', 'SOL_USDT', 'DOGE_USDT', 'ADA_USDT'];
  return (
    <CryptoWebSocketProvider>
      <div className="app-container">
        {currencies.map((currency) => (
          <CurrencyBoard key={currency} currency={currency} />
        ))}
      </div>
    </CryptoWebSocketProvider>
  );
};

export default App;
