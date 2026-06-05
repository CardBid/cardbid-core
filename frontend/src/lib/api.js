// Wspólne helpery do komunikacji z API CardBid.
// Wcześniej każda strona inline'owała te same fetch'e i dekodowanie JWT - tu jest jedno miejsce.

export const API_BASE = 'https://cardbid.up.railway.app/api';
export const WS_BASE = 'wss://cardbid.up.railway.app/ws';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// Dekoduje payload JWT (base64url -> JSON). Zwraca null jak coś nie tak.
export function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// Aktualny user z tokenu (lub null gdy brak/wygasł).
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  return {
    username: payload.username || 'User',
    role: payload.role || null,
  };
}

// Bezpieczny fetch zwracający sparsowany JSON albo null (przy błędzie sieci / nie-OK / nie-JSON).
export async function safeJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Fetch z nagłówkiem Authorization. Rzuca z .status na nie-OK, żeby UI mogło rozróżnić błędy.
export async function authFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { data = await res.json(); } catch { data = null; }
  }

  if (!res.ok) {
    const err = new Error((data && (data.error || data.detail)) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Normalizuje odpowiedź listową (DRF paginacja {results:[]} albo czysta tablica).
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}
