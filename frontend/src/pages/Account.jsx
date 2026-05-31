import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, safeJson, asList, API_BASE, getCurrentUser } from '../lib/api';
import { IconStar, IconCheck } from '../components/icons';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'bids', label: 'My auctions' },
  { id: 'selling', label: 'My listings' },
  { id: 'orders', label: 'Orders' },
  { id: 'settings', label: 'Settings' },
];

// --- Saldo ---
function BalanceCard() {
  const [bal, setBal] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    authFetch('/user/balance/').then(setBal).catch(() => setErr(true));
  }, []);

  const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-6">
      <p className="text-sm font-black uppercase tracking-wide text-emerald-300">Account balance</p>
      {err ? (
        <p className="mt-3 text-sm text-gray-500">Could not load balance.</p>
      ) : (
        <>
          <p className="mt-2 text-4xl font-black text-white">{money(bal?.available_balance)}</p>
          <p className="mt-1 text-xs text-gray-500">available</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-white">{money(bal?.balance)}</p>
            </div>
            <div className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-xs text-gray-500">Frozen</p>
              <p className="font-bold text-amber-400">{money(bal?.frozen_balance)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Gwiazdki (do wystawiania oceny) ---
function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`transition ${n <= value ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
          aria-label={`${n} stars`}
        >
          <IconStar className="h-7 w-7" />
        </button>
      ))}
    </div>
  );
}

// --- Modal oceny sprzedawcy ---
function ReviewModal({ auction, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await authFetch('/reviews/create/', {
        method: 'POST',
        body: { seller: auction.seller, auction: auction.id, rating, comment },
      });
      onDone(auction.id);
    } catch (e) {
      if (e.status === 400) setErr('This auction has already been reviewed.');
      else if (e.status === 401) setErr('Session expired. Please log in again.');
      else setErr('Could not save your review.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-white">Rate seller</h3>
        <p className="mt-1 text-sm text-gray-400">
          {auction.card_details?.name || 'Card'} · seller {auction.seller_name || '—'}
        </p>

        <div className="mt-4">
          <StarInput value={rating} onChange={setRating} />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Comment (optional)"
          className="mt-4 w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />

        {err && <p className="mt-3 text-sm font-bold text-red-400">{err}</p>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-black uppercase text-gray-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Submit review'}
          </button>
          <button onClick={onClose} className="rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/10">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AuctionRow({ a, children }) {
  const img = a.card_details?.image?.replace('http:', 'https:');
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-gray-900 p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-800">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-white">{a.card_details?.name || 'Card'}</p>
        <p className="text-xs text-gray-500">Seller: {a.seller_name || '—'}</p>
        <p className="mt-1 text-sm font-black text-emerald-400">${Number(a.current_price ?? 0).toFixed(2)}</p>
      </div>
      {children}
    </div>
  );
}

// --- Moje aukcje: aktualnie wygrywane + wygrane ---
function BidsSection() {
  const [winning, setWinning] = useState([]);
  const [winningErr, setWinningErr] = useState(false);
  const [won, setWon] = useState([]);
  const [reviewed, setReviewed] = useState({});
  const [modalAuction, setModalAuction] = useState(null);

  useEffect(() => {
    // Aktualnie wygrywane - endpoint bez serializera po stronie backendu, więc może zwrócić 500.
    authFetch('/user/active-bids/')
      .then((d) => setWinning(asList(d)))
      .catch(() => setWinningErr(true));
    authFetch('/user/inventory/')
      .then((d) => setWon(asList(d)))
      .catch(() => setWon([]));
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-black text-white">Currently winning</h2>
        {winningErr ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            The endpoint for currently winning auctions is not responding correctly (backend error). This section will work once it is fixed.
          </p>
        ) : winning.length === 0 ? (
          <p className="text-sm text-gray-500">You're not currently leading any auction.</p>
        ) : (
          <div className="space-y-3">
            {winning.map((a) => (
              <AuctionRow key={a.id} a={a}>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">LEADING</span>
              </AuctionRow>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black text-white">Won</h2>
        {won.length === 0 ? (
          <p className="text-sm text-gray-500">You don't have any won auctions yet.</p>
        ) : (
          <div className="space-y-3">
            {won.map((a) => (
              <AuctionRow key={a.id} a={a}>
                {reviewed[a.id] ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400"><IconStar className="h-3.5 w-3.5" /> Reviewed</span>
                ) : (
                  <button
                    onClick={() => setModalAuction(a)}
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-white/10"
                  >
                    Rate seller
                  </button>
                )}
              </AuctionRow>
            ))}
          </div>
        )}
      </section>

      {modalAuction && (
        <ReviewModal
          auction={modalAuction}
          onClose={() => setModalAuction(null)}
          onDone={(id) => {
            setReviewed((p) => ({ ...p, [id]: true }));
            setModalAuction(null);
          }}
        />
      )}
    </div>
  );
}

// --- Zamówienia (mock - backend nie ma endpointów śledzenia) ---
const FAKE_STAGES = ['Paid', 'Packed', 'Shipped', 'Delivered'];

function OrdersSection() {
  const [won, setWon] = useState([]);
  useEffect(() => {
    authFetch('/user/inventory/').then((d) => setWon(asList(d))).catch(() => setWon([]));
  }, []);

  // Deterministyczny "status" na podstawie id aukcji, żeby nie skakał przy re-renderze.
  const orders = won.map((a) => {
    const stage = a.id % FAKE_STAGES.length;
    const tracking = `CB${String(a.id).padStart(6, '0')}PL`;
    return { auction: a, stageIdx: stage, tracking };
  });

  return (
    <div>
      <div className="mb-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-gray-400">
        Order tracking is for demonstration only — the backend does not provide logistics data yet.
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">No orders. Win an auction to see your shipment here.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(({ auction, stageIdx, tracking }) => (
            <div key={auction.id} className="rounded-xl border border-white/10 bg-gray-900 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white">{auction.card_details?.name || 'Card'}</p>
                  <p className="text-xs text-gray-500">Tracking no.: {tracking}</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                  {FAKE_STAGES[stageIdx]}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {FAKE_STAGES.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center">
                    <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                      i <= stageIdx ? 'bg-emerald-400 text-gray-950' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {i < stageIdx ? <IconCheck className="h-4 w-4" /> : i + 1}
                    </div>
                    {i < FAKE_STAGES.length - 1 && (
                      <div className={`h-1 flex-1 ${i < stageIdx ? 'bg-emerald-400' : 'bg-gray-800'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-gray-500">
                {FAKE_STAGES.map((s) => <span key={s} className="flex-1 text-center">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Ustawienia konta ---
function SettingsSection() {
  const [countries, setCountries] = useState([]);
  const [username, setUsername] = useState('');
  const [shipping, setShipping] = useState('');
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const cData = await safeJson(`${API_BASE}/countries/`);
      const list = asList(cData);
      setCountries(list);

      const settings = await authFetch('/user/settings/').catch(() => null);
      setUsername(getCurrentUser()?.username || '');
      if (settings) {
        setShipping(settings.shipping_address || '');
        // settings zwraca country_code/state_code - mapujemy na id z listy krajów
        const c = list.find((x) => x.code === settings.country_code);
        if (c) {
          setCountryId(String(c.id));
          const st = (c.states || []).find((s) => s.code === settings.state_code);
          if (st) setStateId(String(st.id));
        }
      }
    })();
  }, []);

  const selectedCountry = countries.find((c) => String(c.id) === String(countryId));
  const states = selectedCountry?.states || [];

  const onCountryChange = (id) => {
    setCountryId(id);
    setStateId('');
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);

    const body = { shipping_address: shipping };
    if (username) body.username = username;
    if (countryId) body.country_id = Number(countryId);
    if (stateId) body.state_id = Number(stateId);

    try {
      const res = await authFetch('/user/settings/', { method: 'PATCH', body });
      setMsg(res?.message || 'Settings saved.');
    } catch (e2) {
      if (e2.status === 400 && /taken/i.test(e2.message)) setErr('This username is already taken.');
      else if (e2.status === 401) setErr('Session expired. Please log in again.');
      else setErr('Could not save settings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-lg space-y-5">
      <label className="block">
        <span className="text-sm font-bold text-gray-300">Username</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-gray-300">Shipping address</span>
        <textarea
          value={shipping}
          onChange={(e) => setShipping(e.target.value)}
          rows={2}
          className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-gray-300">Country</span>
        <select
          value={countryId}
          onChange={(e) => onCountryChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
        >
          <option value="">— select —</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      {selectedCountry?.has_states && (
        <label className="block">
          <span className="text-sm font-bold text-gray-300">Region/state</span>
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
          >
            <option value="">— select —</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      )}

      {msg && <p className="text-sm font-bold text-emerald-400">{msg}</p>}
      {err && <p className="text-sm font-bold text-red-400">{err}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-emerald-400 px-6 py-3 text-sm font-black uppercase text-gray-950 transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {busy ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}

function EditAuctionModal({ auction, onClose, onRefresh }) {
  const [cardName, setCardName] = useState(auction.card_details?.name || '');
  const [startPrice, setStartPrice] = useState(auction.starting_price || '');
  const [buyNowPrice, setBuyNowPrice] = useState(auction.buy_now_price || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setBusy(true);
    try {
      await authFetch(`/auctions/${auction.id}/manage/`, {
        method: 'PATCH',
        body: { card_name: cardName, starting_price: startPrice, buy_now_price: buyNowPrice },
      });
      onRefresh();
      onClose();
    } catch (e) {
      setErr(e.message || 'Error updating auction.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-white mb-4">Edit Listing</h3>
        
        <label className="block mb-3">
          <span className="text-xs font-bold text-gray-400">Name</span>
          <input value={cardName} onChange={(e) => setCardName(e.target.value)} className="mt-1 w-full rounded border border-white/10 bg-gray-950 px-3 py-2 text-white outline-none" />
        </label>
        
        <div className="flex gap-3 mb-4">
          <label className="flex-1">
            <span className="text-xs font-bold text-gray-400">Starting Price ($)</span>
            <input type="number" step="0.01" value={startPrice} onChange={(e) => setStartPrice(e.target.value)} className="mt-1 w-full rounded border border-white/10 bg-gray-950 px-3 py-2 text-white outline-none" />
          </label>
          <label className="flex-1">
            <span className="text-xs font-bold text-gray-400">Buy Now ($)</span>
            <input type="number" step="0.01" value={buyNowPrice} onChange={(e) => setBuyNowPrice(e.target.value)} className="mt-1 w-full rounded border border-white/10 bg-gray-950 px-3 py-2 text-white outline-none" />
          </label>
        </div>

        {err && <p className="mb-4 text-xs font-bold text-red-400">{err}</p>}

        <div className="flex gap-2">
          <button onClick={submit} disabled={busy} className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-black text-gray-950 hover:bg-emerald-400">
            {busy ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-gray-300 hover:bg-white/10">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SellingSection() {
  const [auctions, setAuctions] = useState([]);
  const [editing, setEditing] = useState(null);
  
  const fetchAuctions = () => {
    authFetch('/user/selling/')
      .then((d) => setAuctions(asList(d)))
      .catch(() => setAuctions([]));
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await authFetch(`/auctions/${id}/manage/`, { method: 'DELETE' });
      setAuctions(auctions.filter(a => a.id !== id));
    } catch (e) {
      alert(e.message || 'Cannot delete auction. It might be already ended.');
    }
  };

  if (auctions.length === 0) {
    return <p className="text-sm text-gray-500">You haven't listed any cards for sale yet.</p>;
  }

  return (
    <div className="space-y-3">
      {auctions.map((a) => (
        <AuctionRow key={a.id} a={a}>
          <div className="flex flex-col gap-1 items-end sm:flex-row">
            {a.status === 'active' || a.status === 'pending' ? (
              <>
                <button onClick={() => setEditing(a)} className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600/40 transition">
                  Edit
                </button>
                <button onClick={() => handleDelete(a.id)} className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-600/40 transition">
                  Delete
                </button>
              </>
            ) : (
              <span className="text-xs font-bold text-gray-500 bg-gray-800 px-3 py-1 rounded">ENDED</span>
            )}
          </div>
        </AuctionRow>
      ))}

      {editing && (
        <EditAuctionModal 
          auction={editing} 
          onClose={() => setEditing(null)} 
          onRefresh={fetchAuctions} 
        />
      )}
    </div>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const user = getCurrentUser();

  // Guard: niezalogowany → login
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <p className="text-sm font-black uppercase text-emerald-300">Your account</p>
        <h1 className="mt-1 text-3xl font-black text-white">{user.username}</h1>
        {user.role && <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{user.role}</p>}
      </header>

      <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-bold transition ${
              tab === t.id ? 'border-emerald-400 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="grid gap-5 md:grid-cols-2">
          <BalanceCard />
        </div>
      )}

      {tab === 'bids' && <BidsSection />}
      {tab === 'selling' && <SellingSection />}
      {tab === 'orders' && <OrdersSection />}
      {tab === 'settings' && <SettingsSection />}
    </div>
  );
}
