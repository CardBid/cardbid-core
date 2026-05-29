import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { WS_BASE, getToken, authFetch, asList } from '../../lib/api';
import { IconBolt, IconTrophy, IconInfo, IconX } from '../icons';

// Dzwonek powiadomień: lista z REST + live push przez WebSocket (ws/notifications/).
// Backend realnie generuje tylko typ 'outbid' (przebicie w licytacji).
function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(diff)) return '';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}

const TYPE_ICON = {
  outbid: IconBolt,
  won: IconTrophy,
  system: IconInfo,
};

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);
  const wsRef = useRef(null);
  const toastTimer = useRef(null);

  const unread = items.filter((n) => !n.is_read).length;

  const loadList = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await authFetch('/notifications/');
      setItems(asList(data));
    } catch {
      // niezalogowany / sesja wygasła - cicho pomijamy
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Zamykanie dropdownu klikiem poza
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // WebSocket: live push przy przebiciu. Reconnect z backoffem, cleanup na unmount.
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    let attempt = 0;
    let retryTimer = null;

    const connect = () => {
      if (cancelled) return;
      let socket;
      try {
        socket = new WebSocket(`${WS_BASE}/notifications/?token=${encodeURIComponent(token)}`);
      } catch {
        scheduleReconnect();
        return;
      }
      wsRef.current = socket;

      socket.onopen = () => { attempt = 0; };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data);
          const msg = data.message || 'New notification';
          // Pokaż toast i dociągnij świeżą listę z backendu (rekord już zapisany w DB).
          setToast(msg);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 5000);
          loadList();
        } catch {
          // ignoruj niepoprawny JSON
        }
      };

      socket.onerror = () => { /* onclose poleci zaraz po */ };

      socket.onclose = (event) => {
        if (cancelled || event.code === 1000) return;
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
      attempt += 1;
      retryTimer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      const s = wsRef.current;
      if (s && (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING)) {
        try { s.close(1000, 'unmount'); } catch { /* noop */ }
      }
      wsRef.current = null;
    };
  }, [loadList]);

  const markRead = async (id) => {
    // optymistycznie
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await authFetch(`/notifications/${id}/read/`, { method: 'POST' });
    } catch {
      loadList(); // rollback do stanu z serwera
    }
  };

  const markAllRead = async () => {
    const unreadItems = items.filter((n) => !n.is_read);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    // Brak endpointu zbiorczego - wołamy pojedynczo.
    await Promise.allSettled(
      unreadItems.map((n) => authFetch(`/notifications/${n.id}/read/`, { method: 'POST' }))
    );
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Notifications"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-lg border border-white/10 bg-gray-900 shadow-xl z-50">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-black text-white">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">
                  Mark all
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${
                      n.is_read ? 'opacity-60' : ''
                    }`}
                  >
                    {(() => {
                      const Icon = TYPE_ICON[n.notification_type] || IconInfo;
                      return <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />;
                    })()}
                    <span className="flex-1">
                      <span className="block text-sm text-white">{n.message}</span>
                      <span className="mt-0.5 block text-[11px] text-gray-500">{timeAgo(n.created_at)}</span>
                    </span>
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />}
                  </button>
                ))
              )}
            </div>

            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="block border-t border-white/10 px-4 py-3 text-center text-xs font-bold text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Go to account
            </Link>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-lg border border-emerald-500/30 bg-gray-900 px-4 py-3 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
          <IconBolt className="h-5 w-5 shrink-0 text-emerald-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{toast}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white" aria-label="Close">
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
