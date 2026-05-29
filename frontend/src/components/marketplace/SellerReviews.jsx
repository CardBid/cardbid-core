import { useState, useEffect } from 'react';
import { API_BASE, safeJson, asList } from '../../lib/api';
import { IconStar } from '../icons';

// Read-only gwiazdki dla danej wartości (0-5, wspiera połówki wizualnie przez zaokrąglenie).
function Stars({ value, className = '' }) {
  const rounded = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} className={`h-[1em] w-[1em] ${n <= rounded ? 'text-amber-400' : 'text-gray-600'}`} />
      ))}
    </span>
  );
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(diff)) return '';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Backend nie ma endpointu agregującego, więc średnią/liczbę liczymy z listy /reviews/seller/<id>/.
export default function SellerReviews({ sellerId, sellerName }) {
  const [reviews, setReviews] = useState(null); // null = ładowanie
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    safeJson(`${API_BASE}/reviews/seller/${sellerId}/`).then((data) => {
      if (!cancelled) setReviews(asList(data));
    });
    return () => { cancelled = true; };
  }, [sellerId]);

  if (!sellerId) return null;

  const count = reviews?.length ?? 0;
  const avg = count > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
  const visible = expanded ? reviews : reviews?.slice(0, 3);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Seller {sellerName ? `· ${sellerName}` : ''}
        </p>
      </div>

      {reviews === null ? (
        <p className="mt-3 text-sm text-gray-500">Loading reviews…</p>
      ) : count === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No reviews yet for this seller.</p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-black text-white">{avg.toFixed(1)}</span>
            <span>
              <Stars value={avg} className="text-lg" />
              <span className="mt-0.5 block text-xs text-gray-500">
                {count} {count === 1 ? 'review' : 'reviews'}
              </span>
            </span>
          </div>

          <ul className="mt-4 space-y-3">
            {visible.map((r) => (
              <li key={r.id} className="border-t border-white/5 pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{r.buyer_name || 'Buyer'}</span>
                  <Stars value={r.rating} className="text-xs" />
                </div>
                {r.comment && <p className="mt-1 text-sm text-gray-400">{r.comment}</p>}
                <p className="mt-0.5 text-[11px] text-gray-600">{timeAgo(r.created_at)}</p>
              </li>
            ))}
          </ul>

          {count > 3 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 w-full border-t border-gray-800 pt-4 text-sm font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300"
            >
              {expanded ? 'Show less' : `Show all ${count} reviews`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
