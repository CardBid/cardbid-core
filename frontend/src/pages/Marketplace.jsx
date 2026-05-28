import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/marketplace/ProductCard';

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', label: 'All' }]);
  const [liveRooms, setLiveRooms] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);

  const safeFetchJson = useCallback(async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, []);

  const loadAuctions = async (url, append = false) => {
    setLoading(true);
    const data = await safeFetchJson(url);
    
    if (data) {
      const results = data.results || (Array.isArray(data) ? data : []);
      setProducts(prev => append ? [...prev, ...results] : results);
      setNextUrl(data.next);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchBaseData = async () => {
      const [cData, lData] = await Promise.all([
        safeFetchJson('https://cardbid.up.railway.app/api/categories/'),
        safeFetchJson('https://cardbid.up.railway.app/api/live-rooms/')
      ]);
      
      const rawCategories = Array.isArray(cData) ? cData : (cData?.results || []);
      const formattedCategories = rawCategories.map(c => ({ id: c.id, label: c.name }));
      
      setCategories([{ id: 'all', label: 'All' }, ...formattedCategories]);
      setLiveRooms(Array.isArray(lData) ? lData : (lData?.results || []));
    };
    fetchBaseData();
  }, [safeFetchJson]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.append('category', activeCategory);
    if (query) params.append('search', query);
    
    const url = `https://cardbid.up.railway.app/api/auctions/?${params.toString()}`;
    loadAuctions(url, false);
  }, [activeCategory, query, safeFetchJson]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (nextUrl && !loading) {
          loadAuctions(nextUrl, true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextUrl, loading]);

  const featuredLive = liveRooms.length > 0 ? liveRooms[0] : null;

  return (
    <div className="min-h-screen bg-gray-950">
      <section className="border-b border-white/10 bg-gray-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_0.7fr] md:px-6">
           <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase text-emerald-300">Live-commerce MVP</p>
            <h1 className="mt-4 text-4xl font-black text-white md:text-6xl">Marketplace</h1>
            <p className="mt-5 text-gray-400">Search offers 24/7 and filter categories.</p>
          </div>
          {featuredLive && (
             <div className="bg-black p-5 border border-red-500/30 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="bg-red-600 text-xs px-2 py-1 rounded font-bold uppercase">LIVE</span>
                  <h2 className="text-2xl font-black mt-2 text-white">{featuredLive.title}</h2>
                </div>
                <Link to={`/live/${featuredLive.id}`} className="mt-4 text-blue-400 hover:text-blue-300 font-bold">
                  Join the live stream →
                </Link>
             </div>
          )}
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between md:items-end">
           <div>
            <p className="text-sm font-black uppercase text-gray-500">Offers</p>
            <h2 className="mt-1 text-3xl font-black text-white">Products</h2>
          </div>
          <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for cards, categories..."
              className="w-full md:max-w-sm rounded-lg bg-gray-900 border border-white/10 p-3 text-white outline-none focus:border-emerald-400"
          />
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-black transition ${activeCategory === cat.id ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 border border-white/10'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {products.map((p) => {
            const isBuyNow = (p.auction_type === 'buy_now' || p.auction_type === 'Buy Now');
            
            const mappedProduct = {
              id: p.id,
              image: p.card_details?.image?.replace('http:', 'https:') || '',
              category: p.card_details?.category_name || 'Other',
              type: isBuyNow ? 'FIXED' : 'AUCTION',
              title: p.card_details?.name || 'Unnamed',
              seller: p.seller_name || 'Unknown',
              
              price: p.buy_now_price ?? 0, 
              currentBid: p.current_price ?? 0,
              
              stock: 1
            };

            return <ProductCard key={p.id} product={mappedProduct} />;
          })}
        </div>
        {loading && products.length > 0 && (
           <div className="text-center py-10 font-bold text-gray-500">
             Loading next offers...
           </div>
        )}
      </section>
    </div>
  );
}