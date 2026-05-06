import { Link } from 'react-router-dom';
import BuyNowPanel from './BuyNowPanel';

export default function ProductCard({ product }) {
  const isFixed = product.type === 'FIXED';

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-gray-900">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-gray-800">
          <img
            src={product.image}
            alt=""
            className="h-full w-full object-cover opacity-80 transition duration-300 hover:scale-105 hover:opacity-100"
          />
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold uppercase text-gray-400">
              {product.category}
            </span>
            <span className={isFixed ? 'text-emerald-300' : 'text-amber-300'}>
              {isFixed ? 'Buy Now' : 'Aukcja'}
            </span>
          </div>
          <Link to={`/product/${product.id}`} className="block text-lg font-black leading-tight hover:text-amber-300">
            {product.title}
          </Link>
          <p className="mt-2 text-sm text-gray-500">Sprzedawca: {product.seller}</p>
        </div>

        {isFixed ? (
          <BuyNowPanel product={product} compact />
        ) : (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-xs font-bold uppercase text-amber-300">Aktualna oferta</p>
            <p className="mt-1 text-2xl font-black">{product.currentBid} PLN</p>
            <Link
              to={`/product/${product.id}`}
              className="mt-3 inline-block w-full rounded-lg bg-amber-400 px-4 py-3 text-center text-sm font-black uppercase text-gray-950 transition hover:bg-amber-300"
            >
              Przejdz do licytacji
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
