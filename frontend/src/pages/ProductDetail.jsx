import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SellerReviews from '../components/marketplace/SellerReviews';

export default function ProductDetail() {
  const { id } = useParams();

  const [auction, setAuction] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [error, setError] = useState(null);

  const [bidAmount, setBidAmount] = useState('');
  const [bidStatus, setBidStatus] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Czy user jest zalogowany - wpływa na blokady akcji
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Próba 1: endpoint szczegółowy (wymaga IsAuthenticated domyślnie).
        // Niezalogowani dostają 403 (brak credentiali) lub 401 (wygasły token) –
        // obsługujemy oba przypadki fallbackiem na publiczną listę.
        let response = await fetch(`https://cardbid.up.railway.app/api/auctions/${id}/`, { headers });

        if (response.status === 401 || response.status === 403) {
          const listRes = await fetch('https://cardbid.up.railway.app/api/auctions/');
          if (listRes.ok) {
            const list = await listRes.json();
            const items = Array.isArray(list) ? list : (list.results || []);
            const match = items.find(a => String(a.id) === String(id));
            if (match) {
              setAuction(match);
              setCurrentPrice(parseFloat(match.current_price) || 0);
              return;
            }
          }
          // Aukcja nie znaleziona na publicznej liście (np. nieaktywna lub brak dostępu)
          throw new Error('Auction not found. It may have been ended or requires login.');
        }

        if (!response.ok) {
          throw new Error('Failed to fetch auction data. Please try again later.');
        }

        const data = await response.json();
        setAuction(data);
        setCurrentPrice(parseFloat(data.current_price) || 0);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAuction();
  }, [id, token]);

  const handleBid = async (e) => {
    e.preventDefault();
    if (!token) {
      setBidStatus({ type: 'error', msg: 'You must be logged in.' });
      return;
    }
    setBidStatus({ type: 'loading', msg: 'Sending bid...' });

    try {
      const response = await fetch(`https://cardbid.up.railway.app/api/auctions/${id}/bid/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: bidAmount })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.error || data.detail || 'Auction error.');
      }

      setBidStatus({ type: 'success', msg: 'Offer accepted.' });
      setCurrentPrice(parseFloat(data.new_price));
      setBidAmount('');
    } catch (err) {
      setBidStatus({ type: 'error', msg: err.message });
    }
  };

  const handleBuyNow = async () => {
    if (!token) {
      setBidStatus({ type: 'error', msg: 'You must be logged in.' });
      return;
    }

    setBidStatus({ type: 'loading', msg: 'Processing purchase...' });

    try {
      const response = await fetch(`https://cardbid.up.railway.app/api/auctions/${id}/buy-now/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.error || data.detail || 'Purchase error.');
      }

      setBidStatus({ type: 'success', msg: 'Successfully purchased.' });
    } catch (err) {
      setBidStatus({ type: 'error', msg: err.message });
    }
  };

  if (error) return (
    <div className="p-10">
      <p className="font-bold text-red-400 mb-4">{error}</p>
      <Link to="/marketplace" className="text-blue-400 hover:text-blue-300 text-sm font-bold underline">
        ← Back to marketplace
      </Link>
    </div>
  );
  if (!auction) return <div className="p-10 text-gray-400">Loading...</div>;

  // Rozpoznanie typu — identyczna logika jak w LiveRoom
  const isBuyNow = auction.auction_type === 'buy_now' || auction.auction_type === 'Buy now';
  const isHybrid = auction.auction_type === 'hybrid' || auction.auction_type === 'Auction + Buy Now';

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="mb-4 text-3xl font-bold">{auction.card_details?.name || 'No name'}</h1>

      {!token && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          To place a bid or buy now — <Link to="/login" className="font-bold underline">log in</Link>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Zdjęcie */}
        <div>
          <img
            src={auction.card_details?.image || '/placeholder.png'}
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
                  🛒 BUY NOW
                </span>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/70 mb-1 mt-4">Purchase price</p>
              <p className="text-4xl font-black text-blue-300">
                ${auction.buy_now_price ?? currentPrice}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Seller: {auction.seller_name || '—'} | Grade: {auction.card_details?.grade || '—'}
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
                disabled={!token || bidStatus?.type === 'success'}
                className={`mt-6 w-full rounded-xl px-5 py-4 text-sm font-black uppercase tracking-tighter transition ${
                  !token
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                    : bidStatus?.type === 'success'
                      ? 'bg-blue-600/50 text-white/70 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)] hover:-translate-y-0.5'
                }`}
              >
                {!token
                  ? 'Log in to buy'
                  : bidStatus?.type === 'success' ? 'Purchased' : 'Buy Now'
                }
              </button>
            </div>
          )}

          {/* ===== PANEL: LICYTACJA ===== */}
          {!isBuyNow && (
            <>
              <div className="rounded-2xl border-2 border-yellow-500 bg-yellow-900/20 p-6 shadow-[0_0_20px_rgba(234,179,8,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0">
                  <span className="text-[10px] font-bold bg-yellow-500 text-black px-3 py-1.5 rounded-bl-xl rounded-tr-xl block animate-pulse shadow-sm">
                    🔥 AUCTION
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/70 mb-1 mt-4">Current price</p>
                <p className="text-4xl font-black text-yellow-400">${currentPrice}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Seller: {auction.seller_name || '—'} | Grade: {auction.card_details?.grade || '—'}
                </p>

                {/* Przycisk Kup Teraz dla trybu hybrid */}
                {isHybrid && auction.buy_now_price && (
                  <button
                    onClick={handleBuyNow}
                    disabled={!token}
                    className={`mt-4 w-full rounded-xl px-5 py-3 text-sm font-black uppercase tracking-tighter transition ${
                      !token
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {!token
                      ? 'Log in to buy now'
                      : `Buy Now instantly for $${auction.buy_now_price}`
                    }
                  </button>
                )}
              </div>

              <form onSubmit={handleBid} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-300">
                    Place a bid {token && <span className="text-gray-500 font-normal">(min ${(currentPrice + 1).toFixed(2)})</span>}
                  </span>
                  <input
                    type="number"
                    min={currentPrice + 1}
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    disabled={!token}
                    className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none ${
                      !token
                        ? 'bg-gray-900 text-gray-500 border-gray-700 cursor-not-allowed'
                        : 'bg-gray-950 text-white border-white/10 focus:border-yellow-400'
                    }`}
                    placeholder={token ? `More than $${currentPrice}` : 'Log in to place a bid'}
                  />
                </label>
                <button
                  type="submit"
                  disabled={!token}
                  className={`w-full rounded-xl px-5 py-4 text-sm font-black uppercase tracking-tighter transition ${
                    !token
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                      : 'bg-yellow-500 hover:bg-yellow-400 text-black hover:-translate-y-0.5'
                  }`}
                >
                  {!token ? 'Log in to place a bid' : 'Place a Bid'}
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
              <p className="mb-2 text-[10px] font-bold uppercase text-gray-500">Card description</p>
              <p className="pb-4 text-sm leading-relaxed text-gray-400">
                {auction.card_details?.description || 'No description.'}
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
              {isDetailsExpanded ? 'Collapse' : 'Read more'}
            </button>
          </div>

          {/* Oceny sprzedawcy (per seller, wg /reviews/seller/<id>/) */}
          <SellerReviews sellerId={auction.seller} sellerName={auction.seller_name} />

        </div>
      </div>
    </div>
  );
}
