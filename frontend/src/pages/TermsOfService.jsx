import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Acceptance of Terms</h2>
            <p>By accessing and using the CardBid platform, you accept and agree to be bound by the terms and provision of this agreement. Our platform facilitates live-streamed auctions and direct purchases of collectible cards.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. User Accounts and Wallets</h2>
            <p>Users must register to place bids or buy items. Financial transactions and balance top-ups are securely processed via third-party providers (Stripe). CardBid reserves the right to freeze funds during active bids to ensure market integrity.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. Bidding and Purchasing Rules</h2>
            <p>All bids placed during live streams or via the marketplace are binding. Once a bid is placed and accepted as the highest, the user is legally obligated to complete the transaction if they win. The "Buy Now" feature executes an immediate, irreversible transaction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">4. Broadcaster Guidelines</h2>
            <p>Streamers utilizing the Live Room feature must adhere to community guidelines. Opening packs and showcasing cards must be done transparently. CardBid is not responsible for the physical condition of the cards shown on stream, though we utilize API checks for graded items.</p>
          </section>
          
          <p className="text-xs text-gray-500 mt-10">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}