import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import LiveRoom from './pages/LiveRoom';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Register from './pages/Register';
import Studio from './pages/Studio';
import Account from './pages/Account';
import TopUp from './pages/TopUp';
import CreateAuction from './pages/CreateAuction';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';

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
          <Route path="/live/:id" element={<LiveRoom />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/account" element={<Account />} />
          <Route path="/top-up" element={<TopUp />} />
          <Route path="/create-auction" element={<CreateAuction />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
