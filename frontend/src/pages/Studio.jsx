import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';

const API = 'https://cardbid.up.railway.app/api';

// --- JWT helper (ten sam wzorzec co w AppLayout) ---
function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// exp w sekundach Unix; true gdy token wygasł.
function isJwtExpired(payload) {
  if (!payload?.exp) return false;
  return payload.exp * 1000 < Date.now();
}

// Wyciąga czytelny komunikat z odpowiedzi DRF (string | {detail} | {field: [...]})
function extractError(data) {
  if (!data) return 'Unknown server error.';
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  const messages = [];
  for (const [field, val] of Object.entries(data)) {
    const items = Array.isArray(val) ? val : [val];
    items.forEach((item) => {
      if (typeof item === 'string') messages.push(`${field}: ${item}`);
    });
  }
  return messages.length ? messages.join('\n') : 'Unknown error.';
}

const AUCTION_TYPES = [
  { value: 'bidding', label: 'Auction' },
  { value: 'buy_now', label: 'Buy now' },
  { value: 'hybrid', label: 'Auction + Buy now' },
];

const EMPTY_FORM = {
  card_name: '',
  category_id: '',
  grade: 'Raw',
  certificate_number: '',
  description: '',
  auction_type: 'bidding',
  starting_price: '',
  buy_now_price: '',
};

export default function Studio() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const payload = token ? decodeJwtPayload(token) : null;
  const role = payload?.role || null;
  const username = payload?.username || null;
  // Date.now() to funkcja nieczysta — chowamy ją w helperze (tak jak AppLayout),
  // żeby nie wołać jej wprost podczas renderu.
  const tokenExpired = useMemo(() => isJwtExpired(payload), [payload]);
  const isStreamer = role === 'streamer' && !tokenExpired;

  // Autoryzowany fetch JSON. Zwraca { ok, data }.
  const authedJson = useCallback(
    async (url, opts = {}) => {
      const headers = { ...(opts.headers || {}) };
      if (token) headers.Authorization = `Bearer ${token}`;
      try {
        const res = await fetch(url, { ...opts, headers });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
      } catch {
        return { ok: false, status: 0, data: { error: 'Connection error.' } };
      }
    },
    [token],
  );

  // ====== SEKCJA A: TRANSMISJA ======
  const [roomTitle, setRoomTitle] = useState('');
  const [room, setRoom] = useState(null); // { id, title, is_live, stream_key, streamer_name }
  const [toggling, setToggling] = useState(false);
  const [roomMsg, setRoomMsg] = useState(null);
  const [roomErr, setRoomErr] = useState(null);
  const [copied, setCopied] = useState(false);

  // Przy wejściu próbujemy odnaleźć własny pokój na liście live (działa tylko gdy jesteśmy na żywo).
  useEffect(() => {
    if (!isStreamer || !username) return;
    let cancelled = false;
    (async () => {
      const { ok, data } = await authedJson(`${API}/live-rooms/`);
      if (cancelled || !ok) return;
      const list = Array.isArray(data) ? data : data?.results || [];
      const mine = list.find((r) => r.streamer_name === username);
      if (mine) {
        setRoom(mine);
        setRoomTitle(mine.title || '');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isStreamer, username, authedJson]);

  const toggleLive = async (goLive) => {
    setToggling(true);
    setRoomMsg(null);
    setRoomErr(null);
    const body = { is_live: goLive };
    if (roomTitle.trim()) body.title = roomTitle.trim();
    const { ok, data } = await authedJson(`${API}/live-rooms/toggle/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setToggling(false);
    if (!ok) {
      setRoomErr(extractError(data));
      return;
    }
    if (data.room) {
      setRoom(data.room);
      if (data.room.title) setRoomTitle(data.room.title);
    }
    setRoomMsg(data.message || (goLive ? 'Stream started.' : 'Stream ended.'));
  };

  const copyStreamKey = async () => {
    if (!room?.stream_key) return;
    try {
      await navigator.clipboard.writeText(room.stream_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setRoomErr('Could not copy the key.');
    }
  };

  // ====== SEKCJA B: NOWA AUKCJA ======
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState(null);
  const [createdAuction, setCreatedAuction] = useState(null); // { auction_id, card_name }
  const [psaLoading, setPsaLoading] = useState(false);
  const [psaMsg, setPsaMsg] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { ok, data } = await authedJson(`${API}/categories/`);
      if (cancelled || !ok) return;
      setCategories(Array.isArray(data) ? data : data?.results || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [authedJson]);

  const onFormChange = (e) => {
    setForm((cur) => ({ ...cur, [e.target.name]: e.target.value }));
  };

  const showStarting = form.auction_type === 'bidding' || form.auction_type === 'hybrid';
  const showBuyNow = form.auction_type === 'buy_now' || form.auction_type === 'hybrid';

  const verifyPsa = async () => {
    const cert = form.certificate_number.trim();
    setPsaMsg(null);
    if (!/^\d{8}$/.test(cert)) {
      setPsaMsg({ type: 'err', text: 'The PSA number must be exactly 8 digits.' });
      return;
    }
    setPsaLoading(true);
    const { ok, data } = await authedJson(`${API}/v1/psa-verify/?cert_number=${encodeURIComponent(cert)}`);
    setPsaLoading(false);
    if (!ok) {
      setPsaMsg({ type: 'err', text: extractError(data) });
      return;
    }
    setForm((cur) => ({
      ...cur,
      card_name: data.card_name || cur.card_name,
      grade: data.grade != null ? String(data.grade) : cur.grade,
    }));
    setPsaMsg({ type: 'ok', text: `Verified: ${data.card_name} (${data.set_name}, ${data.year}), grade ${data.grade}.` });
  };

  const submitAuction = async (e) => {
    e.preventDefault();
    setCreateErr(null);
    setCreatedAuction(null);

    if (!form.card_name.trim()) return setCreateErr('Enter the card name.');
    if (!form.category_id) return setCreateErr('Select a category.');
    if (showStarting && !form.starting_price) return setCreateErr('Enter the starting price.');
    if (showBuyNow && !form.buy_now_price) return setCreateErr('Enter the "Buy now" price.');
    if (
      form.auction_type === 'hybrid' &&
      Number(form.buy_now_price) <= Number(form.starting_price)
    ) {
      return setCreateErr('In hybrid mode the "Buy now" price must be higher than the starting price.');
    }

    // multipart/form-data — nie ustawiamy Content-Type, przeglądarka doda boundary.
    // Świadomie NIE wysyłamy start_date/end_date: backend ustawi start = teraz
    // (przy przyszłej dacie CreateAuctionView wywala się na Auction.Status.PENDING).
    const fd = new FormData();
    fd.append('card_name', form.card_name.trim());
    fd.append('category_id', form.category_id);
    fd.append('grade', form.grade || 'Raw');
    fd.append('certificate_number', form.certificate_number.trim());
    fd.append('description', form.description.trim());
    fd.append('auction_type', form.auction_type);
    if (showStarting) fd.append('starting_price', form.starting_price);
    if (showBuyNow) fd.append('buy_now_price', form.buy_now_price);
    if (imageFile) fd.append('image', imageFile);

    setCreating(true);
    const { ok, data } = await authedJson(`${API}/auctions/create/`, { method: 'POST', body: fd });
    setCreating(false);
    if (!ok) {
      setCreateErr(extractError(data));
      return;
    }
    setCreatedAuction({ auction_id: data.auction_id, card_name: form.card_name.trim() });
    setForm(EMPTY_FORM);
    setImageFile(null);
    setPsaMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // STUB B->C: dodanie aukcji do kolejki pokoju jako slot.
  // Brak endpointu po stronie backendu (CreateAuctionView tworzy tylko Auction, bez AuctionSlot).
  // Gdy backend doda np. POST /api/rooms/<room_id>/slots/ {auction_id}, wystarczy podmienić ciało tej funkcji.
  const [queueStubMsg, setQueueStubMsg] = useState(null);
  const addToQueue = () => {
    setQueueStubMsg(
      'This feature is waiting for a backend endpoint (adding an auction to a room as a slot). ' +
        'The auction has been created and is available on the marketplace, but for now it cannot be automatically added to the stream queue.',
    );
  };

  // ====== SEKCJA C: KOLEJKA / SLOTY ======
  const [manageRoomId, setManageRoomId] = useState('');
  const [timeline, setTimeline] = useState({ opened: [], waiting_to_open: [], current: null, queue: [] });
  const [slotMsg, setSlotMsg] = useState(null);
  const [slotErr, setSlotErr] = useState(null);
  const [busySlot, setBusySlot] = useState(null);

  // Po starcie transmisji / wykryciu pokoju – domyślnie zarządzamy własnym pokojem.
  useEffect(() => {
    if (room?.id && !manageRoomId) setManageRoomId(String(room.id));
  }, [room, manageRoomId]);

  const fetchTimeline = useCallback(async () => {
    if (!manageRoomId) return;
    const { ok, data } = await authedJson(`${API}/rooms/${manageRoomId}/timeline/`);
    if (!ok) return;
    setTimeline({
      opened: data.opened || [],
      waiting_to_open: data.waiting_to_open || [],
      current: data.current || null,
      queue: data.queue || [],
    });
  }, [manageRoomId, authedJson]);

  useEffect(() => {
    if (!manageRoomId) return;
    fetchTimeline();
    const id = setInterval(fetchTimeline, 10000);
    return () => clearInterval(id);
  }, [manageRoomId, fetchTimeline]);

  const activateSlot = async (slotId) => {
    setBusySlot(slotId);
    setSlotMsg(null);
    setSlotErr(null);
    const { ok, data } = await authedJson(`${API}/slots/${slotId}/activate/`, { method: 'POST' });
    setBusySlot(null);
    if (!ok) return setSlotErr(extractError(data));
    setSlotMsg(data.message || 'Slot activated.');
    fetchTimeline();
  };

  const openSlot = async (slotId) => {
    setBusySlot(slotId);
    setSlotMsg(null);
    setSlotErr(null);
    const { ok, data } = await authedJson(`${API}/slots/${slotId}/open/`, { method: 'POST' });
    setBusySlot(null);
    if (!ok) return setSlotErr(extractError(data));
    setSlotMsg(data.message || 'Pack opened.');
    fetchTimeline();
  };

  // ====== GATING ======
  if (!token || tokenExpired) {
    return (
      <Blocker
        icon="🔒"
        title="Login required"
        subtitle="Log in with a streamer account to open the studio."
        action={
          <Link to="/login" className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-black text-gray-950 transition hover:bg-emerald-300">
            Log in
          </Link>
        }
      />
    );
  }

  if (!isStreamer) {
    return (
      <Blocker
        icon="🚫"
        title="Streamers only"
        subtitle={`This studio is available only for accounts with the "streamer" role. Your role: ${role || 'none'}.`}
        action={
          <Link to="/marketplace" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
            Back to marketplace
          </Link>
        }
      />
    );
  }

  // ====== WIDOK ======
  const inputCls =
    'mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight">🎬 Streamer Studio</h1>
        <p className="mt-1 text-sm text-gray-400">
          Logged in as <span className="font-bold text-white">{username}</span> (streamer)
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ====== SEKCJA A: TRANSMISJA ====== */}
        <section className="rounded-2xl border border-white/10 bg-gray-900 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            📡 Stream
          </h2>

          <div className="mb-4 flex items-center gap-3">
            <span
              className={`inline-block h-3 w-3 rounded-full ${room?.is_live ? 'animate-pulse bg-red-500' : 'bg-gray-600'}`}
            />
            <span className="text-sm font-bold">
              {room?.is_live ? 'Live' : room ? 'Offline' : 'Status unknown (start a stream)'}
            </span>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-gray-300">Stream title</span>
            <input
              type="text"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="e.g. Evening Pokémon pack opening"
              className={inputCls}
            />
          </label>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => toggleLive(true)}
              disabled={toggling}
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-black uppercase text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {toggling ? '...' : 'Start'}
            </button>
            <button
              onClick={() => toggleLive(false)}
              disabled={toggling}
              className="flex-1 rounded-lg border border-white/15 px-4 py-3 text-sm font-bold uppercase text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              End
            </button>
          </div>

          {room?.stream_key && (
            <div className="mt-5 rounded-lg border border-white/10 bg-gray-950 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Stream key (for OBS)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-black/50 px-3 py-2 text-xs text-emerald-300">{room.stream_key}</code>
                <button
                  onClick={copyStreamKey}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              {room.id && (
                <Link to={`/live/${room.id}`} className="mt-3 inline-block text-xs font-bold text-emerald-400 hover:text-emerald-300">
                  Preview room →
                </Link>
              )}
            </div>
          )}

          {roomMsg && <Note type="ok">{roomMsg}</Note>}
          {roomErr && <Note type="err">{roomErr}</Note>}
        </section>

        {/* ====== SEKCJA B: NOWA AUKCJA ====== */}
        <section className="rounded-2xl border border-white/10 bg-gray-900 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            ➕ New auction
          </h2>

          <form onSubmit={submitAuction} className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-gray-300">PSA certificate number (optional)</span>
              <div className="mt-2 flex gap-2">
                <input
                  name="certificate_number"
                  value={form.certificate_number}
                  onChange={onFormChange}
                  placeholder="8 digits"
                  className="flex-1 rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={verifyPsa}
                  disabled={psaLoading}
                  className="rounded-lg bg-white/10 px-4 py-3 text-xs font-bold uppercase text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  {psaLoading ? '...' : 'Check PSA'}
                </button>
              </div>
            </label>
            {psaMsg && <Note type={psaMsg.type}>{psaMsg.text}</Note>}

            <label className="block">
              <span className="text-sm font-bold text-gray-300">Card name *</span>
              <input name="card_name" value={form.card_name} onChange={onFormChange} className={inputCls} />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-300">Category *</span>
              <select name="category_id" value={form.category_id} onChange={onFormChange} className={inputCls}>
                <option value="">-- Select a category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold text-gray-300">Grade</span>
                <input name="grade" value={form.grade} onChange={onFormChange} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-300">Auction type</span>
                <select name="auction_type" value={form.auction_type} onChange={onFormChange} className={inputCls}>
                  {AUCTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {showStarting && (
                <label className="block">
                  <span className="text-sm font-bold text-gray-300">Starting price *</span>
                  <input
                    name="starting_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.starting_price}
                    onChange={onFormChange}
                    className={inputCls}
                  />
                </label>
              )}
              {showBuyNow && (
                <label className="block">
                  <span className="text-sm font-bold text-gray-300">"Buy now" price *</span>
                  <input
                    name="buy_now_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.buy_now_price}
                    onChange={onFormChange}
                    className={inputCls}
                  />
                </label>
              )}
            </div>

            <label className="block">
              <span className="text-sm font-bold text-gray-300">Description</span>
              <textarea name="description" rows={3} value={form.description} onChange={onFormChange} className={`${inputCls} resize-none`} />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-300">Card image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="mt-2 w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-white/20"
              />
            </label>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-lg bg-amber-400 px-5 py-3 text-sm font-black uppercase text-gray-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Creating auction...' : 'Create auction'}
            </button>

            {createErr && <Note type="err">{createErr}</Note>}
          </form>

          {createdAuction && (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-bold text-emerald-300">
                ✓ Created auction #{createdAuction.auction_id} — {createdAuction.card_name}
              </p>
              <button
                onClick={addToQueue}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20"
              >
                Add to stream queue
                <span className="rounded bg-amber-500/30 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200">
                  no endpoint
                </span>
              </button>
              {queueStubMsg && <Note type="warn">{queueStubMsg}</Note>}
            </div>
          )}
        </section>
      </div>

      {/* ====== SEKCJA C: KOLEJKA / SLOTY ====== */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-gray-900 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            🗂️ Stream queue
          </h2>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            Room ID:
            <input
              type="number"
              value={manageRoomId}
              onChange={(e) => setManageRoomId(e.target.value)}
              placeholder="—"
              className="w-24 rounded-lg border border-white/10 bg-gray-950 px-3 py-1.5 text-white outline-none focus:border-emerald-400"
            />
          </label>
        </div>

        {!manageRoomId ? (
          <p className="text-sm text-gray-500">
            Start a stream or enter a room ID to load the slot queue.
          </p>
        ) : (
          <>
            {slotMsg && <Note type="ok">{slotMsg}</Note>}
            {slotErr && <Note type="err">{slotErr}</Note>}

            <SlotGroup title="🔥 Live now" empty="No active slot.">
              {timeline.current && (
                <SlotRow slot={timeline.current} badge="active" />
              )}
            </SlotGroup>

            <SlotGroup title="⏳ In queue" empty="The queue is empty.">
              {timeline.queue.map((s) => (
                <SlotRow
                  key={s.slot_id}
                  slot={s}
                  badge="queue"
                  action={
                    <ActionBtn busy={busySlot === s.slot_id} onClick={() => activateSlot(s.slot_id)}>
                      Activate
                    </ActionBtn>
                  }
                />
              ))}
            </SlotGroup>

            <SlotGroup title="📦 Waiting to open" empty="Nothing waiting to open.">
              {timeline.waiting_to_open.map((s) => (
                <SlotRow
                  key={s.slot_id}
                  slot={s}
                  badge="waiting"
                  action={
                    <ActionBtn busy={busySlot === s.slot_id} onClick={() => openSlot(s.slot_id)} variant="open">
                      Open pack
                    </ActionBtn>
                  }
                />
              ))}
            </SlotGroup>

            <SlotGroup title="✅ Opened" empty="No opened packs.">
              {timeline.opened.map((s) => (
                <SlotRow key={s.slot_id} slot={s} badge="opened" />
              ))}
            </SlotGroup>
          </>
        )}
      </section>
    </div>
  );
}

// ====== Małe komponenty pomocnicze ======

function Blocker({ icon, title, subtitle, action }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-8 text-center shadow-2xl">
        <div className="mb-4 text-5xl">{icon}</div>
        <h1 className="mb-2 text-xl font-black uppercase tracking-tight">{title}</h1>
        <p className="mb-6 text-sm text-gray-400">{subtitle}</p>
        {action}
      </div>
    </div>
  );
}

function Note({ type = 'ok', children }) {
  const styles = {
    ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    err: 'border-red-500/30 bg-red-500/10 text-red-300',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  };
  return (
    <p className={`mt-3 whitespace-pre-line rounded-lg border p-3 text-sm font-semibold ${styles[type]}`}>{children}</p>
  );
}

function SlotGroup({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">{title}</h3>
      {items.length > 0 ? <div className="space-y-2">{items}</div> : <p className="text-xs text-gray-600">{empty}</p>}
    </div>
  );
}

function SlotRow({ slot, badge, action }) {
  const badges = {
    active: { cls: 'bg-yellow-500 text-black', label: 'NOW' },
    queue: { cls: 'bg-blue-600 text-white', label: 'IN QUEUE' },
    waiting: { cls: 'bg-gray-600 text-white', label: 'WAITING' },
    opened: { cls: 'bg-gray-700 text-gray-300', label: 'OPENED' },
  };
  const b = badges[badge] || badges.queue;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-950 px-4 py-3">
      <span className="text-xs font-bold text-gray-500">#{slot.order}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{slot.card_name}</p>
        <p className="text-xs text-gray-500">
          ${Number(slot.price ?? 0).toFixed(2)}
          {slot.winner ? ` · winner: ${slot.winner}` : ''}
        </p>
      </div>
      <span className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider ${b.cls}`}>{b.label}</span>
      {action}
    </div>
  );
}

function ActionBtn({ children, onClick, busy, variant = 'activate' }) {
  const cls =
    variant === 'open'
      ? 'bg-gray-200 text-gray-950 hover:bg-white'
      : 'bg-emerald-500 text-gray-950 hover:bg-emerald-400';
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {busy ? '...' : children}
    </button>
  );
}
