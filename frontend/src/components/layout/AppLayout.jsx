import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useMemo, useState, useRef, useEffect } from 'react';
import NotificationBell from '../notifications/NotificationBell';

// --- Helpery JWT ---
// Dekoduje payload JWT (base64url -> JSON). Zwraca null jak coś nie tak.
function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // padding
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function readCurrentUser() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  // exp w sekundach Unix - sprawdzamy czy nie wygasł
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  return {
    username: payload.username || 'User',
    role: payload.role || null,
  };
}

const baseNavItems = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/live', label: 'Live Room' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Re-evaluate przy każdej zmianie route (login -> nawigacja gdziekolwiek odswiezy navbar)
  // plus event 'storage' dla cross-tab logout
  const [tick, setTick] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const onStorage = (e) => { if (e.key === 'access_token') setTick(t => t + 1); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const user = useMemo(() => readCurrentUser(), [location, tick]);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }
    const token = localStorage.getItem('access_token');
    fetch('https://cardbid.up.railway.app/api/user/balance/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.available_balance !== undefined) {
          setBalance(data.available_balance);
        }
      })
      .catch(() => {});
  }, [user, tick]);

  // Link "Studio" widoczny tylko dla streamerów (panel zarządzania transmisją)
  const navItems = useMemo(() => {
    if (user?.role === 'streamer') {
      return [...baseNavItems, { to: '/studio', label: 'Studio' }];
    }
    return baseNavItems;
  }, [user]);

  // === AUTO-REFRESH ACCESS TOKEN ===
  // Schedule refresh 60s przed wygaśnięciem accessa. Korzystamy z refresh_token
  // (SimpleJWT trzyma go ~24h domyślnie). Dzięki temu user nie wylatuje co 5 min.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    if (!token || !refresh) return;

    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return;

    const msUntilRefresh = payload.exp * 1000 - Date.now() - 60_000; // 60s przed wygaśnięciem

    const doRefresh = async () => {
      try {
        const res = await fetch('https://cardbid.up.railway.app/auth/refresh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) {
          // Refresh token też wygasł albo backend padł - logujemy ciszej
          // i czekamy aż user się sam zaloguje. Nie czyszczę tokenów,
          // bo gdy backend jest chwilowo niedostępny user nie traci sesji.
          return;
        }
        const data = await res.json();
        if (data.access) {
          localStorage.setItem('access_token', data.access);
          // SimpleJWT z ROTATE_REFRESH_TOKENS=True może zwrócić też nowy refresh
          if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
          setTick(t => t + 1); // re-render dla navbara
        }
      } catch {
        // sieć padła - pominij, spróbujemy później
      }
    };

    // Jeśli już blisko / po expiration → odśwież natychmiast.
    // Inaczej zaplanuj na 60s przed expiration.
    if (msUntilRefresh <= 0) {
      doRefresh();
      return;
    }
    const timer = setTimeout(doRefresh, msUntilRefresh);
    return () => clearTimeout(timer);
  }, [tick, location]);

  // Dropdown z opcją wyloguj
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setMenuOpen(false);
    setTick(t => t + 1); // re-render natychmiast w tej karcie
    navigate('/login');
  };

  // Inicjały do avatara (pierwsza litera nicku)
  const initial = user ? (user.username[0] || '?').toUpperCase() : '';

  // Kolor avatara wg roli (delikatne rozróżnienie wizualne)
  const avatarColor =
    user?.role === 'streamer' ? 'bg-rose-500' :
    user?.role === 'admin'    ? 'bg-purple-500' :
    user?.role === 'seller'   ? 'bg-amber-500' :
                                'bg-emerald-500';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          
          {/* LOGO */}
          <NavLink to="/marketplace" className="flex items-center gap-3">
            <div className="shrink-0">
              <img
                src="/cardbid.svg"
                alt="CardBid Logo"
                className="h-10 w-auto"
              />
            </div>
            <span className="hidden sm:block leading-tight">
              <span className="block text-lg font-black">CardBid</span>
              <span className="block text-xs font-bold uppercase text-gray-500">Marketplace & Live</span>
            </span>
          </NavLink>

          {/* DESKTOP NAV (Środkowa) */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-bold transition ${
                    isActive
                      ? 'bg-white text-gray-950'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* BALANCE (Widoczny na większych ekranach lub zawsze, zależy od preferencji) */}
                {balance !== null && (
                  <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-gray-900 pl-3 pr-1 py-1">
                    <span className="text-sm font-black text-emerald-400">
                      ${Number(balance).toFixed(2)}
                    </span>
                    <Link
                      to="/top-up"
                      title="Add funds"
                      className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white transition hover:bg-white/20 hover:text-emerald-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </Link>
                  </div>
                )}

                <NotificationBell />

                {/* PROFIL DROPDOWN */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-2 md:gap-3 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 md:px-3 md:py-2 transition hover:bg-white/10"
                  >
                    <span className={`grid h-7 w-7 md:h-8 md:w-8 place-items-center rounded-full text-xs md:text-sm font-black text-gray-950 ${avatarColor}`}>
                      {initial}
                    </span>
                    <span className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-sm font-bold text-white">{user.username}</span>
                    </span>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-gray-900 shadow-xl py-1 z-50">
                      <div className="px-3 py-2 border-b border-white/10 sm:hidden">
                        <p className="text-sm font-bold text-white">{user.username}</p>
                        {user.role && (
                          <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{user.role}</p>
                        )}
                      </div>
                      <NavLink
                        to="/account"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 text-left text-sm font-bold text-gray-200 transition hover:bg-white/10"
                      >
                        My account
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-left text-sm font-bold text-red-400 transition hover:bg-red-500/10"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="hidden md:inline-block rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="hidden md:inline-block rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-gray-950 transition hover:bg-amber-300"
                >
                  Sign up
                </NavLink>
              </>
            )}

            {/* HAMBURGER BUTTON (Tylko Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE NAV MENU (Rozwija się w dół) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-gray-950 px-4 py-4 space-y-3">
            {user && balance !== null && (
               <div className="flex items-center justify-between rounded-lg border border-white/10 bg-gray-900 px-4 py-3">
                 <span className="text-sm font-bold text-gray-400">Available balance:</span>
                 <div className="flex items-center gap-3">
                   <span className="text-base font-black text-emerald-400">${Number(balance).toFixed(2)}</span>
                   <Link to="/top-up" className="rounded bg-white/10 px-3 py-1 text-xs font-black uppercase text-white hover:bg-white/20">Add funds</Link>
                 </div>
               </div>
            )}
            
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-3 text-base font-bold transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {!user && (
              <div className="pt-2 flex flex-col gap-2 border-t border-white/10 mt-2">
                <NavLink
                  to="/login"
                  className="block rounded-lg border border-white/15 px-4 py-3 text-center text-sm font-bold text-gray-300 transition hover:bg-white/10"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="block rounded-lg bg-amber-400 px-4 py-3 text-center text-sm font-black text-gray-950 transition hover:bg-amber-300"
                >
                  Sign up
                </NavLink>
              </div>
            )}
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}