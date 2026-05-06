import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import LiveRoom from './pages/LiveRoom';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Marketplace />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dev" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/live" element={<LiveRoom />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
