import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cardbid_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cardbid_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-[100] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="text-sm text-gray-300 max-w-4xl">
        <span className="font-bold text-white mr-2">🍪 We value your privacy.</span>
        We use cookies to enhance your browsing experience, securely process payments via Stripe, and keep your session active. By continuing to use CardBid, you consent to our use of cookies.
      </div>
      <button 
        onClick={acceptCookies}
        className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-black uppercase tracking-wider text-xs transition shadow-[0_0_15px_rgba(37,99,235,0.4)]"
      >
        Got it!
      </button>
    </div>
  );
}