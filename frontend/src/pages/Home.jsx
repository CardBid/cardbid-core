import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
        CardBid
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Strona główna w budowie. 
      </p>
      
      <Link 
        to="/live" 
        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition shadow-[0_0_15px_rgba(37,99,235,0.4)]"
      >
        Wejdź do Testowego Live Roomu 🔴
      </Link>
    </div>
  );
}