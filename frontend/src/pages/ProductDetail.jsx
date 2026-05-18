import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function ProductDetail() {
  const { id } = useParams();
  
  const [auction, setAuction] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [error, setError] = useState(null);
  
  const [bidAmount, setBidAmount] = useState('');
  const [bidStatus, setBidStatus] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/api/auctions/${id}/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          throw new Error('Aukcja nie istnieje lub backend odmówił współpracy.');
        }

        const data = await response.json();
        setAuction(data);
        setCurrentPrice(parseFloat(data.current_price));
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAuction();
  }, [id]);

  const handleBid = async (e) => {
    e.preventDefault();
    setBidStatus({ type: 'loading', msg: 'Wysyłanie oferty...' });

    const token = localStorage.getItem('access_token');
    if (!token) {
      setBidStatus({ type: 'error', msg: 'Zaloguj się najpierw, bez konta nic tu nie kupisz.' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/auctions/${id}/bid/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: bidAmount })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Serwer odrzucił ofertę bez słowa wyjaśnienia.');
      }

      setBidStatus({ type: 'success', msg: 'Oferta przyjęta!' });
      setCurrentPrice(parseFloat(data.new_price));
      setBidAmount('');
    } catch (err) {
      setBidStatus({ type: 'error', msg: err.message });
    }
  };

  const handleBuyNow = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setBidStatus({ type: 'error', msg: 'Zaloguj się najpierw!' });
      return;
    }

    setBidStatus({ type: 'loading', msg: 'Przetwarzanie zakupu...' });

    try {
      const response = await fetch(`http://localhost:8000/api/auctions/${id}/buy-now/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd zakupu.');
      }

      setBidStatus({ type: 'success', msg: 'Zakup zakończony sukcesem! 🎉' });
    } catch (err) {
      setBidStatus({ type: 'error', msg: err.message });
    }
  };

  if (error) return <div className="p-10 font-bold text-red-500">Wystąpił błąd: {error}</div>;
  if (!auction) return <div className="p-10 text-gray-400">Pobieranie danych z API...</div>;

  // Rozpoznanie typu — identyczna logika jak w LiveRoom
  const isBuyNow = auction.auction_type === 'buy_now' || auction.auction_type === 'Tylko Kup Teraz';
  const isHybrid = auction.auction_type === 'hybrid' || auction.auction_type === 'Licytacja + Kup Teraz';

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="mb-4 text-3xl font-bold">{auction.card_details?.name || 'Brak nazwy'}</h1>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Zdjęcie */}
        <div>
          <img 
            src={auction.card_details?.image ? `http://localhost:8000${auction.card_details.image}` : '/placeholder.png'} 
            alt={auction.card_details?.name} 
            className="w-full rounded-lg border border-gray-700"
          />
        </div>

        {/* Panel boczny */}
        <div className="space-y-6">

          {/* ===== PANEL: KUP TERAZ ===== */}
          {isBuyNow && (
            <div className="rounded-2xl border-2 border-blue-500/50 bg-blue-900/20 p-6 shadow-[0_0_20px_rgba(37,99,235,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0">
                <span className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-bl-xl rounded-tr-xl block shadow-sm">
                  🛒 KUP TERAZ
                </span>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/70 mb-1 mt-4">Cena zakupu</p>
              <p className="text-4xl font-black text-blue-300">
                {auction.buy_now_price ?? currentPrice} PLN
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Sprzedawca: {auction.seller_name} | Grade: {auction.card_details?.grade}
              </p>

              {bidStatus && (
                <div className={`mt-4 p-3 rounded-xl font-bold text-sm ${
                  bidStatus.type === 'error' ? 'bg-red-900/30 border border-red-500 text-red-300' :
                  bidStatus.type === 'success' ? 'bg-green-900/30 border border-green-500 text-green-300' :
                  'bg-gray-800 text-gray-300'
                }`}>
                  {bidStatus.msg}
                </div>
              )}

              <button
                onClick={handleBuyNow}
                disabled={bidStatus?.type === 'success'}
                className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-tighter text-white transition hover:bg-blue-500 hover:-translate-y-0.5 shadow-[0_10px_20px_rgba(37,99,235,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bidStatus?.type === 'success' ? 'Zakupiono ✓' : 'Kup Teraz'}
              </button>
            </div>
          )}

          {/* ===== PANEL: LICYTACJA ===== */}
          {!isBuyNow && (
            <>
              <div className="rounded-2xl border-2 border-yellow-500 bg-yellow-900/20 p-6 shadow-[0_0_20px_rgba(234,179,8,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0">
                  <span className="text-[10px] font-bold bg-yellow-500 text-black px-3 py-1.5 rounded-bl-xl rounded-tr-xl block animate-pulse shadow-sm">
                    🔥 LICYTACJA
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/70 mb-1 mt-4">Aktualna cena</p>
                <p className="text-4xl font-black text-yellow-400">{currentPrice} PLN</p>
                <p className="mt-1 text-xs text-gray-500">
                  Sprzedawca: {auction.seller_name} | Grade: {auction.card_details?.grade}
                </p>

                {/* Przycisk Kup Teraz dla trybu hybrid */}
                {isHybrid && auction.buy_now_price && (
                  <button
                    onClick={handleBuyNow}
                    className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-tighter text-white transition hover:bg-blue-500"
                  >
                    Kup Teraz od razu za {auction.buy_now_price} PLN
                  </button>
                )}
              </div>

              <form onSubmit={handleBid} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-300">Przebij ofertę</span>
                  <input
                    type="number"
                    min={currentPrice + 1}
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                    placeholder={`Musi być więcej niż ${currentPrice} PLN`}
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-yellow-500 px-5 py-4 text-sm font-black uppercase tracking-tighter text-black transition hover:bg-yellow-400 hover:-translate-y-0.5"
                >
                  Licytuj
                </button>
              </form>

              {bidStatus && (
                <div className={`p-4 rounded-xl font-bold ${
                  bidStatus.type === 'error' ? 'bg-red-900/30 border border-red-500 text-red-300' :
                  bidStatus.type === 'success' ? 'bg-green-900/30 border border-green-500 text-green-300' :
                  'bg-gray-800 text-gray-300'
                }`}>
                  {bidStatus.msg}
                </div>
              )}
            </>
          )}

          {/* Opis karty (wspólny) */}
          <div className="relative rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className={`overflow-hidden transition-all ${isDetailsExpanded ? 'max-h-[1000px]' : 'max-h-32'}`}>
              <p className="mb-2 text-[10px] font-bold uppercase text-gray-500">Opis karty</p>
              <p className="pb-4 text-sm leading-relaxed text-gray-400">
                {auction.card_details?.description || 'Brak opisu dostarczonego przez wystawiającego.'}
              </p>
              
              {!isDetailsExpanded && (
                <div className="pointer-events-none absolute bottom-10 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent"></div>
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="mt-2 w-full border-t border-gray-800 pt-4 text-sm font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300"
            >
              {isDetailsExpanded ? 'Zwiń' : 'Czytaj więcej'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}