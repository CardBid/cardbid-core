import { useState } from 'react';

export default function BuyNowPanel({ product, compact = false }) {
  const [status, setStatus] = useState('idle');

  const handleBuyNow = () => {
    setStatus('processing');

    window.setTimeout(() => {
      setStatus('success');
    }, 700);
  };

  if (!product || product.type !== 'FIXED') {
    return null;
  }

  const isProcessing = status === 'processing';
  const isSuccess = status === 'success';

  return (
    <div className={compact ? 'space-y-3' : 'rounded-xl border border-white/10 bg-gray-900 p-5'}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Buy now</p>
          <p className="mt-1 text-3xl font-black text-white">{product.price} PLN</p>
        </div>
        <p className="text-right text-xs font-bold uppercase text-gray-500">
          Available: {product.stock}
        </p>
      </div>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={isProcessing || isSuccess}
        className={`mt-4 w-full rounded-lg px-5 py-4 text-sm font-black uppercase transition ${
          isSuccess
            ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
            : 'bg-emerald-500 text-gray-950 hover:bg-emerald-400 disabled:cursor-wait disabled:bg-emerald-500/60'
        }`}
      >
        {isProcessing ? 'Processing...' : isSuccess ? 'Purchase reserved' : 'Buy instantly'}
      </button>

      {isSuccess && (
        <p className="text-sm font-semibold text-emerald-300">
          Your purchase has been reserved. You'll receive a confirmation soon.
        </p>
      )}
    </div>
  );
}
