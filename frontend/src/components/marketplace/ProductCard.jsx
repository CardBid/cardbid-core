import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const isFixed = product.type === 'FIXED';
  const imgSrc = product.image ? product.image.replace('http:', 'https:') : '/placeholder.jpg';

  return (
    <article className="group relative flex flex-col rounded-lg border border-white/10 bg-gray-900 transition hover:z-20">
      <Link to={`/product/${product.id}`} className="group/img block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-800">
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top opacity-80 transition duration-300 group-hover/img:opacity-100"
          />
        </div>

        {/* Pełny podgląd tylko po najechaniu na zdjęcie — wychodzi poza ramkę i pokazuje całe zdjęcie. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center opacity-0 transition-opacity duration-300 group-hover/img:opacity-100">
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-[125%] max-w-none -translate-y-4 scale-90 rounded-lg object-contain shadow-2xl ring-1 ring-white/20 transition-transform duration-300 group-hover/img:-translate-y-8 group-hover/img:scale-100"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col space-y-4 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold uppercase text-gray-400">
              {product.category}
            </span>
            <span className={isFixed ? 'text-emerald-300' : 'text-amber-300'}>
              {isFixed ? 'Buy Now' : 'Auction'}
            </span>
          </div>
          <Link to={`/product/${product.id}`} className="block text-lg font-black leading-tight hover:text-amber-300">
            {product.title}
          </Link>
          <p className="mt-2 text-sm text-gray-500">Seller: {product.seller}</p>
        </div>

        {isFixed ? (
          <div className="mt-auto rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs font-bold uppercase text-emerald-300">Buy now</p>
            <p className="mt-1 text-2xl font-black">{product.price}$</p>
            <Link
              to={`/product/${product.id}`}
              className="mt-3 inline-block w-full rounded-lg bg-emerald-400 px-4 py-3 text-center text-sm font-black uppercase text-gray-950 transition hover:bg-emerald-300"
            >
              Buy now
            </Link>
          </div>
        ) : (
          <div className="mt-auto rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-xs font-bold uppercase text-amber-300">Current bid</p>
            <p className="mt-1 text-2xl font-black">{product.currentBid}$</p>
            <Link
              to={`/product/${product.id}`}
              className="mt-3 inline-block w-full rounded-lg bg-amber-400 px-4 py-3 text-center text-sm font-black uppercase text-gray-950 transition hover:bg-amber-300"
            >
              Go to auction
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
