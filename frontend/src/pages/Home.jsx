import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-5xl font-black mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        Strona Główna (W budowie)
      </h1>
      <p className="text-gray-500 mb-12 uppercase tracking-[0.3em] text-sm font-bold">Panel Deweloperski CardBid</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        
        {/* 1. Live Room */}
        <Link 
          to="/live" 
          className="bg-gray-900 border border-gray-800 p-8 rounded-3xl hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] transition-all group flex flex-col items-center text-center"
        >
          <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🎥</div>
          <h2 className="text-xl font-black mb-3 uppercase italic">Live Room</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Główny widok transmisji na żywo z czatem i zbiorczym harmonogramem wielu paczek.
          </p>
        </Link>

        {/* 2. Indywidualna Licytacja */}
        <Link 
          to="/product/1" 
          className="bg-gray-900 border border-gray-800 p-8 rounded-3xl hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-all group flex flex-col items-center text-center"
        >
          <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🔥</div>
          <h2 className="text-xl font-black mb-3 uppercase italic text-yellow-500">Licytacja Produktu</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Strona <span className="text-yellow-500 font-bold">indywidualnej licytacji</span>. Zawiera szczegóły i możliwość licytacji wybranego produktu.
          </p>
        </Link>

        {/* 3. Indywidualny Zakup Teraz */}
        <Link 
          to="/product/2" 
          className="bg-gray-900 border border-gray-800 p-8 rounded-3xl hover:border-green-500/50 hover:shadow-[0_0_30_rgba(34,197,94,0.1)] transition-all group flex flex-col items-center text-center"
        >
          <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🛒</div>
          <h2 className="text-xl font-black mb-3 uppercase italic text-green-500">Zakup Teraz</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Strona <span className="text-green-500 font-bold">indywidualnego zakupu</span> (Buy It Now). Zawiera szczegóły i pozwala na natychmiastowy zakup wybranego produktu.
          </p>
        </Link>

      </div>

    </div>
  );
}