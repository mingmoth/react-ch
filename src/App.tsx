import { CryptoWebSocketProvider } from './contexts/CryptoWSContext';
import CurrencyChart from './components/CurrencyChart';
import OrderBooks from './components/OrderBooks';
import './style.css';

const App = () => {
  return (
    <CryptoWebSocketProvider>
    <div className="app-container">
      <OrderBooks />

      <div className="chart-section">
        <CurrencyChart />
      </div>
    </div>
    </CryptoWebSocketProvider>
  );
};

export default App;
