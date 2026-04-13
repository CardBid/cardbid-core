import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from '../components/VideoPlayer';

const videoJsOptions = {
  autoplay: true,
  muted: true,
  controls: true,
  fill: true,         
  responsive: true,
  sources: [{
    src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    type: 'application/x-mpegURL'
  }]
};

export default function LiveRoom() {

  const [messages, setMessages] = useState([
    { id: 1, user: 'KarcianyŚwir', text: 'Kiedy zaczynamy?!' },
    { id: 2, user: 'System', text: 'Użytkownik X właśnie kupił slota #1!', isSystem: true },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const chatContainerRef = useRef(null);
  
  //funkcja wysyłania
  const handleSendMessage = (e) => {
    if (e && e.key !== 'Enter') return; 

    if (newMessage.trim() !== '') {
      //Doklejamy nową wiadomość, a potem ucinamy do 50 ostatnich
      setMessages(prev => [...prev, { id: Date.now(), user: 'Ty', text: newMessage }].slice(-50));
      setNewMessage('');
    }
  };

  const [currentPrice, setCurrentPrice] = useState(50); // Aktualna cena slota
  const [bidIncrement, setBidIncrement] = useState(5); // Kwota, o którą podbijamy

  const [isWinning, setIsWinning] = useState(false); 

  const handleBid = () => {
    setCurrentPrice(prevPrice => prevPrice + bidIncrement);
    setIsWinning(true);

    //Po 4 sekundach system symuluje, że ktoś inny przebił naszą ofertę o $5
    setTimeout(() => {
      setIsWinning(false);
      setCurrentPrice(prevPrice => prevPrice + 5);
    }, 4000);
  };
  
  //Harmonogram streamu (Oś czasu)
  const timelineSlots = [
    { id: 1, time: '20:00', title: 'Chicago Bulls', status: 'opened', info: 'Otwarto', winner: 'Janek' },
    { id: 2, time: '20:15', title: 'Boston Celtics', status: 'queued', info: 'Otwarcie ok. 20:45', winner: 'KarcianyŚwir' },
    { id: 3, time: '20:30', title: 'Los Angeles Lakers', status: 'active', info: 'Licytacja trwa!', winner: null },
    { id: 4, time: '20:45', title: 'Golden State', status: 'upcoming', info: 'Licytacja za 15 min', winner: null },
    { id: 5, time: '21:00', title: 'Miami Heat', status: 'upcoming', info: 'Licytacja za 30 min', winner: null },
  ];

  //Symulacja przychodzących wiadomości (odpala się co 5-10 sekund)
  useEffect(() => {
    const fakeUsers = ['PikaPika', 'CardMaster', 'Zbiórka', 'FanatykKart'];
    const fakeMessages = ['Lecimy z tym!', 'Ale emocje 🔥','🔥🔥🔥', 'Ile jeszcze zostało?'];

    const interval = setInterval(() => {
      const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
      const randomText = fakeMessages[Math.floor(Math.random() * fakeMessages.length)];
      
      setMessages(prev => [...prev, { id: Date.now(), user: randomUser, text: randomText }].slice(-50));
    }, Math.random() * 5000 + 5000); // Losowy czas od 5s do 10s

    return () => clearInterval(interval); // Czyszczenie interwału po zamknięciu komponentu
  }, []);
  
  //Auto-scroll na dół przy każdej nowej wiadomości
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <div className="lg:col-span-9 flex flex-col gap-4">
        
        <div className="bg-black rounded-xl flex items-center justify-center aspect-video border border-gray-800 shadow-2xl relative overflow-hidden w-full">
          {/* Znaczek LIVE */}
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse z-20">
            LIVE
          </div>
          
          {/* Prawdziwy odtwarzacz */}
          <VideoPlayer options={videoJsOptions} />
        </div>

        {/* Strefa pod wideo - Interaktywna Oś Czasu (Timeline) */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 hidden lg:flex flex-col">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
              <span>📅 Harmonogram Otwierania</span>
              <span className="bg-gray-800 text-gray-500 px-2 py-0.5 rounded text-xs">Kolejka na dziś</span>
            </h3>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 custom-scrollbar">
            {timelineSlots.map((slot) => {
              let borderStyle = "border-gray-700";
              let bgStyle = "bg-gray-800";
              let textStyle = "text-gray-400";
              let badge = null;

              if (slot.status === 'opened') {
                bgStyle = "bg-gray-800/50";
                borderStyle = "border-gray-800";
                textStyle = "text-gray-600 line-through";
                badge = <span className="text-[10px] font-bold bg-gray-700 text-gray-400 px-2 py-1 rounded-bl-lg rounded-tr-lg">✅ ZAKOŃCZONE</span>;
              } else if (slot.status === 'queued') {
                borderStyle = "border-blue-500/50";
                bgStyle = "bg-blue-900/20";
                textStyle = "text-gray-200";
                badge = <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">📦 W KOLEJCE</span>;
              } else if (slot.status === 'active') {
                borderStyle = "border-yellow-500";
                bgStyle = "bg-yellow-900/20";
                textStyle = "text-yellow-400";
                badge = <span className="text-[10px] font-bold bg-yellow-500 text-black px-2 py-1 rounded-bl-lg rounded-tr-lg animate-pulse">🔥 TERAZ</span>;
              } else {
                badge = <span className="text-[10px] font-bold bg-gray-700 text-gray-400 px-2 py-1 rounded-bl-lg rounded-tr-lg">⏳ WKRÓTCE</span>;
              }

              return (
                <div key={slot.id} className={`min-w-[220px] p-4 rounded-xl border-2 transition-all ${borderStyle} ${bgStyle} relative flex flex-col justify-between shrink-0 overflow-hidden`}>
                  <div className="absolute top-0 right-0 z-10">
                    {badge}
                  </div>
                  
                  <div className="mt-2">
                    <span className="block text-xs text-gray-500 font-mono mb-1">Slot #{slot.id}</span>
                    <span className={`font-bold text-lg block ${textStyle} pr-16`}>{slot.title}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <span className={`block text-xs font-medium ${slot.status === 'active' ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {slot.info}
                    </span>
                    {slot.winner && (
                      <span className="block text-xs text-gray-500 mt-1 truncate">
                        Wygrał: <span className="text-gray-300 font-semibold">{slot.winner}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
              disabled={isWinning} // Wyłącz przycisk, gdy użytkownik jest na prowadzeniu
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
          
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
            {messages.map(m => (
              <div key={m.id} className="text-sm leading-relaxed break-words">
                <span className="font-bold text-gray-400">{m.user}: </span>
                <span className={m.isSystem ? 'text-green-400 font-semibold' : 'text-gray-200'}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-auto shrink-0 flex gap-2">
            <input 
              type="text" 
              placeholder="Napisz..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleSendMessage}
              className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700" 
            />
            {/* Przycisk Wyślij */}
            <button 
              onClick={() => handleSendMessage()} 
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg transition border border-blue-500 hover:border-blue-400 flex items-center justify-center"
              title="Wyślij wiadomość"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>    

      </div>
    </div>
  );
}