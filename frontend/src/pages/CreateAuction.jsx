import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, safeJson, asList } from '../lib/api';

export default function CreateAuction() {
  const navigate = useNavigate();
  
  // Stan formularza
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    card_name: '',
    category_id: '',
    description: '',
    grade: 'Raw',
    certificate_number: '',
    auction_type: 'bidding',
    starting_price: '',
    buy_now_price: '',
    start_date: '',
    end_date: ''
  });
  const [image, setImage] = useState(null);
  
  // Stany UI
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Pobierz kategorie przy ładowaniu
  useEffect(() => {
    safeJson(`${API_BASE}/categories/`)
      .then((data) => setCategories(asList(data)))
      .catch(() => console.error("Failed to fetch categories"));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedCategory = categories.find(c => String(c.id) === formData.category_id);
  
  const isCardCategory = selectedCategory 
    ? !selectedCategory.name.toLowerCase().includes('box') && !selectedCategory.name.toLowerCase().includes('pack')
    : true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (!isCardCategory && (key === 'grade' || key === 'certificate_number')) {
        return; 
      }
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });
    
    if (!isCardCategory) {
        data.append('grade', 'N/A');
    }

    if (image) {
      data.append('image', image);
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error("You must be logged in.");

      const res = await fetch(`${API_BASE}/auctions/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create auction.");
      }

      navigate('/account'); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <p className="text-sm font-black uppercase text-emerald-300">Marketplace</p>
        <h1 className="mt-1 text-3xl font-black text-white">List an Item for Sale</h1> {/* Zmiana z Card na Item */}
        <p className="mt-2 text-sm text-gray-400">Fill in the details below to start your auction or list a buy-now item.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-white/10 bg-gray-900 p-6 md:p-8">
        
        {/* --- SEKCJA PRZEDMIOTU --- */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2">Item Details</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              {/* Dynamiczna nazwa etykiety */}
              <span className="text-xs font-bold text-gray-400">{isCardCategory ? 'Card Name *' : 'Product Name *'}</span>
              <input required name="card_name" value={formData.card_name} onChange={handleChange} placeholder={isCardCategory ? "e.g. Charizard Base Set" : "e.g. Pokemon Base Set Booster Box"} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-gray-400">Category *</span>
              <select required name="category_id" value={formData.category_id} onChange={handleChange} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400">
                <option value="">— Select Category —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>

          {isCardCategory && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-gray-400">Grade</span>
                <select name="grade" value={formData.grade} onChange={handleChange} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400">
                  <option value="Raw">Raw (Ungraded)</option>
                  <option value="PSA 10">PSA 10</option>
                  <option value="PSA 9">PSA 9</option>
                  <option value="BGS 10">BGS 10</option>
                  <option value="BGS 9.5">BGS 9.5</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-gray-400">Certificate Number (if graded)</span>
                <input name="certificate_number" value={formData.certificate_number} onChange={handleChange} placeholder="e.g. 84123912" className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
              </label>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-bold text-gray-400">Description</span>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the condition, specific features, etc." className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-gray-400">{isCardCategory ? 'Card Image' : 'Product Image'}</span>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="mt-1 w-full text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500/20 file:px-4 file:py-2 file:text-xs file:font-bold file:text-emerald-400 hover:file:bg-emerald-500/30" />
          </label>
        </div>

        {/* --- SEKCJA AUKCJI --- */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2">Listing Format</h2>
          
          <label className="block">
            <span className="text-xs font-bold text-gray-400">Format *</span>
            <select name="auction_type" value={formData.auction_type} onChange={handleChange} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400">
              <option value="bidding">Auction (Bidding Only)</option>
              <option value="buy_now">Buy It Now</option>
              <option value="hybrid">Hybrid (Bidding + Buy Now)</option>
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            {(formData.auction_type === 'bidding' || formData.auction_type === 'hybrid') && (
              <label className="block">
                <span className="text-xs font-bold text-gray-400">Starting Price ($) *</span>
                <input required type="number" step="0.01" min="0.01" name="starting_price" value={formData.starting_price} onChange={handleChange} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
              </label>
            )}

            {(formData.auction_type === 'buy_now' || formData.auction_type === 'hybrid') && (
              <label className="block">
                <span className="text-xs font-bold text-gray-400">Buy Now Price ($) *</span>
                <input required type="number" step="0.01" min="0.01" name="buy_now_price" value={formData.buy_now_price} onChange={handleChange} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
              </label>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-gray-400">Start Date (Leave empty for 'Now')</span>
              <input type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-gray-400">End Date (Leave empty for +7 Days)</span>
              <input type="datetime-local" name="end_date" value={formData.end_date} onChange={handleChange} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm font-bold text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-emerald-400 px-6 py-4 text-sm font-black uppercase tracking-wide text-gray-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {busy ? 'Creating Listing...' : 'List Card'}
        </button>

      </form>
    </div>
  );
}