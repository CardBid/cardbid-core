import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api';

const PRESET_AMOUNTS = [10, 50, 100, 250, 500];

export default function TopUp() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError(null);

    const value = parseFloat(amount);
    if (isNaN(value) || value < 5) {
      setError('The minimum top-up amount is $5.00.');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/top-up/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      });

      const data = await res.json();
      console.log('Top-up response:', data);

      if (!res.ok) {
        setError(data.error || data.detail || 'Could not initialize payment.');
        setLoading(false);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Received invalid response from server.');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 md:px-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      <div className="rounded-2xl border border-white/10 bg-gray-900 p-6 md:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">Add Funds</h1>
          <p className="mt-2 text-sm text-gray-400">
            Top up your CardBid balance to place bids and buy cards instantly.
          </p>
        </div>

        <form onSubmit={handleCheckout} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">Select amount</label>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`rounded-lg border px-0 py-2 text-sm font-bold transition ${
                    amount === String(preset)
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                      : 'border-white/10 bg-gray-950 text-gray-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Or enter custom amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-white/10 bg-gray-950 pl-8 pr-4 py-3 text-white outline-none transition focus:border-emerald-400"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-300 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full rounded-lg bg-emerald-400 px-5 py-4 text-sm font-black uppercase text-gray-950 transition hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting to Stripe...' : 'Proceed to Checkout'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          Payments are securely processed by Stripe.
        </p>
      </div>
    </div>
  );
}