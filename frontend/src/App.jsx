import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LiveRoom from './pages/LiveRoom';
import ProductDetail from './pages/ProductDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/live" element={<LiveRoom />} />

        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;