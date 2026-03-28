import React, { useState } from 'react';

export default function LiveRoom() {
  const [messages, setMessages] = useState([
    { id: 1, user: 'KarcianyŚwir', text: 'Kiedy zaczynamy?!' },
    { id: 2, user: 'System', text: 'Użytkownik X właśnie kupił slota #1!', isSystem: true },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    if (e.key === 'Enter' && newMessage.trim() !== '') {
      setMessages([...messages, { id: Date.now(), user: 'Ty', text: newMessage }]);
      setNewMessage('');
    }
  };
  const [currentPrice, setCurrentPrice] = useState(50); // Aktualna cena slota
  const [bidIncrement, setBidIncrement] = useState(5); // Kwota, o którą podbijamy

  const [isWinning, setIsWinning] = useState(false); 

  const handleBid = () => {
    setCurrentPrice(prevPrice => prevPrice + bidIncrement);
    setIsWinning(true);

    // MOCK: Po 4 sekundach system symuluje, że ktoś inny przebił naszą ofertę o $5
    setTimeout(() => {
      setIsWinning(false);
      setCurrentPrice(prevPrice => prevPrice + 5);
    }, 4000);
  };
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <div className="lg:col-span-9 flex flex-col gap-4">
        
        <div className="bg-black rounded-xl flex items-center justify-center aspect-video border border-gray-800 shadow-2xl relative overflow-hidden">
           {/* Znaczek LIVE */}
           <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
             LIVE
           </div>
          <div className="text-center">
            <span className="block text-gray-600 text-6xl mb-4">🎥</span>
            <span className="text-gray-500 font-bold">Odtwarzacz Wideo</span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 hidden lg:block">
          <h3 className="text-gray-400 font-semibold mb-3">📅 Harmonogram / Sprzedane Sloty</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <div className="bg-gray-800 min-w-[200px] p-3 rounded-lg border border-gray-700 opacity-50">
              <span className="block text-sm text-gray-400">Slot #1</span>
              <span className="font-bold line-through">Chicago Bulls</span>
              <span className="block text-xs text-red-400 mt-1">Sprzedane</span>
            </div>
            <div className="bg-gray-800 min-w-[200px] p-3 rounded-lg border border-gray-700">
              <span className="block text-sm text-gray-400">Slot #3</span>
              <span className="font-bold">Boston Celtics</span>
              <span className="block text-xs text-gray-500 mt-1">Oczekuje...</span>
            </div>
          </div>
        </div>
      </div>

      {/* PRAWA STRONA: Strefa Akcji */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-[calc(100vh-2rem)]">
        
        {/* Aktywna Licytacja */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-5 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">🔥 Licytacja Trwa</h2>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          </div>
          
          <div className="mt-4">
            <span className="block text-2xl font-black mb-1">Los Angeles Lakers</span>
            <span className="block text-gray-400 text-sm mb-4">Paczka: Panini Prizm 2023</span>
            
            {/* 1. Aktualna cena */}
            <div className={`rounded-lg p-3 mb-4 flex justify-between items-center border transition-all duration-300 ${
              isWinning 
                ? 'bg-green-900/30 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                : 'bg-gray-800 border-gray-700'
            }`}>
              <div className="flex flex-col">
                <span className={`font-semibold text-sm uppercase transition-colors ${isWinning ? 'text-green-400' : 'text-gray-400'}`}>
                  Aktualna cena:
                </span>
                {/* Pokazujemy ten napis tylko, gdy isWinning to true */}
                {isWinning && (
                  <span className="text-xs font-bold text-green-500 animate-pulse mt-1">
                    👑 WYGRYWASZ!
                  </span>
                )}
              </div>
              <span className={`text-3xl font-bold transition-colors ${isWinning ? 'text-green-400' : 'text-white'}`}>
                ${currentPrice}
              </span>
            </div>

            {/* 2. Szybkie przyciski wyboru przebicia */}
            <div className="mb-4">
               <span className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Wybierz przebicie:</span>
               <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setBidIncrement(5)} 
                    className={`py-2 rounded-md font-bold text-sm transition ${bidIncrement === 5 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}>
                    +$5
                  </button>
                  <button 
                    onClick={() => setBidIncrement(10)} 
                    className={`py-2 rounded-md font-bold text-sm transition ${bidIncrement === 10 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}>
                    +$10
                  </button>
                  <button 
                    onClick={() => setBidIncrement(25)} 
                    className={`py-2 rounded-md font-bold text-sm transition ${bidIncrement === 25 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}>
                    +$25
                  </button>
               </div>
            </div>
            
            {/* 3. Główny przycisk podbicia */}
            <button 
              onClick={handleBid}
              disabled={isWinning} // Wyłączamy przycisk, gdy wygrywamy (nie licytujemy sami ze sobą)
              className={`w-full py-3 rounded-lg font-bold text-xl transition text-center tracking-wide ${
                isWinning 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,7,0.3)] text-white'
              }`}>
              {isWinning ? 'JESTEŚ NA PROWADZENIU' : `PODBIJ O $${bidIncrement}`}
            </button>
          </div>
        </div>

        {/* Czat Społecznościowy */}
        <div className="bg-gray-900 rounded-xl p-4 flex flex-col border border-gray-800 flex-1 overflow-hidden">
          <h2 className="text-sm font-bold mb-4 text-blue-400 uppercase tracking-wider">💬 Czat</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
            {messages.map(m => (
              <div key={m.id} className="text-sm leading-relaxed break-words">
                <span className="font-bold text-gray-400">{m.user}: </span>
                <span className={m.isSystem ? 'text-green-400 font-semibold' : 'text-gray-200'}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-auto shrink-0">
            <input 
              type="text" 
              placeholder="Napisz..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleSendMessage}
              className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700" 
            />
          </div>
        </div>

      </div>
    </div>
  );
}