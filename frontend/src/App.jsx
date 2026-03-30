import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LiveRoom from './pages/LiveRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/live" element={<LiveRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;