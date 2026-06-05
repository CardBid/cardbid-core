import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Information We Collect</h2>
            <p>CardBid collects personal data strictly necessary to provide our services. This includes your username, email address, physical shipping address (for item delivery), and regional data (for accurate VAT and tax calculations).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. Payment Processing</h2>
            <p>We do not store your credit card information. All payment processing is securely handled by Stripe. We only receive verification tokens (Webhooks) and transaction statuses to update your internal CardBid wallet balance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. Cookies and Session Data</h2>
            <p>We use local storage and cookies (e.g., JWT Tokens) to maintain your authenticated session and secure your real-time WebSocket connections during live auctions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">4. Your Rights (GDPR)</h2>
            <p>You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact our support team.</p>
          </section>
        </div>
      </div>
    </div>
  );
}