import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/marketplace/ProductCard';

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', label: 'All' }]);
  const [liveRooms, setLiveRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const safeFetchJson = useCallback(async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const [pData, cData, lData] = await Promise.all([
        safeFetchJson('https://cardbid.up.railway.app/api/auctions/'),
        safeFetchJson('https://cardbid.up.railway.app/api/categories/'),
        safeFetchJson('https://cardbid.up.railway.app/api/live-rooms/')
      ]);
      
      setProducts(pData?.results || pData || []);
      setCategories([{ id: 'all', label: 'All' }, ...(cData || [])]);
      setLiveRooms(lData || []);
      setLoading(false);
    };
    loadAll();
  }, [safeFetchJson]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'all' || String(p.category.id) === String(activeCategory);
      const matchesQuery = normalizedQuery.length === 0 || 
                     p.card_details?.name?.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, products]);

  const featuredLive = liveRooms.length > 0 ? liveRooms[0] : null;

  if (loading) return <div className="text-white text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <section className="border-b border-white/10 bg-gray-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_0.7fr] md:px-6">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase text-emerald-300">Live-commerce MVP</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
              Marketplace kart, paczek i transmisji live
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400">
              Przegladaj oferty 24/7, filtruj kategorie i korzystaj z przygotowanego flow Kup teraz.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#catalog"
                className="rounded-lg bg-emerald-400 px-5 py-3 text-sm font-black uppercase text-gray-950 transition hover:bg-emerald-300"
              >
                Przegladaj katalog
              </a>
              <Link
                to="/live"
                className="rounded-lg border border-white/15 px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-white/10"
              >
                Wejdz do Live Room
              </Link>
            </div>
          </div>

          <Link
            to={featuredLive.href}
            className="flex min-h-[260px] flex-col justify-between rounded-lg border border-red-500/30 bg-black p-5 shadow-2xl shadow-red-950/30"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-red-600 px-3 py-1 text-xs font-black uppercase">
                {featuredLive.startsAt}
              </span>
              <span className="text-sm font-bold text-gray-400">{featuredLive.viewers} widzow</span>
            </div>
            <div>
              <p className="text-sm font-bold uppercase text-gray-500">Teraz promowane</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">{featuredLive.title}</h2>
              <p className="mt-2 text-gray-400">Host: {featuredLive.host}</p>
            </div>
          </Link>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-gray-500">Katalog ofert</p>
            <h2 className="mt-1 text-3xl font-black text-white">Marketplace</h2>
          </div>
          <label className="w-full md:max-w-sm">
            <span className="sr-only">Szukaj ofert</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj po nazwie, kategorii lub sprzedawcy"
              className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-400"
            />
          </label>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-black transition ${
                activeCategory === category.id
                  ? 'bg-white text-gray-950'
                  : 'border border-white/10 bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((p) => {
            const mappedProduct = {
              id: p.id,
              image: p.card_details?.image || '',
              category: p.card_details?.category_name || 'Others',
              type: (p.auction_type === 'buy_now' || p.auction_type === 'Buy Now') ? 'FIXED' : 'AUCTION',
              title: p.card_details?.name || 'Unknown product',
              seller: p.seller_name || 'Unknown seller',
              currentBid: p.current_price
            };

            return <ProductCard key={p.id} product={mappedProduct} />;
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-gray-900 p-8 text-center text-gray-400">
            Brak ofert dla wybranych filtrow.
          </div>
        )}
      </section>
    </div>
  );
}
