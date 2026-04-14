import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoPlayer from '../components/VideoPlayer';

// --- KONFIGURACJA WIDEO ---
const videoJsOptions = {
  autoplay: true,
  muted: true,
  controls: false, 
  fill: true,
  responsive: true,
  sources: [{
    src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    type: 'application/x-mpegURL'
  }]
};

export default function LiveRoom() {
  // --- STANY ODTWARZACZA I WIDOKU ---
  const [playerInstance, setPlayerInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0); 
  const [isTheater, setIsTheater] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Domyślne widoczności nakładek na wideo
  const [showOverlayChat, setShowOverlayChat] = useState(false);
  const [showOverlayBid, setShowOverlayBid] = useState(true);

  // --- LOGIKA PRZESUWANIA PANELI (DRAG & DROP) ---
  const [bidPos, setBidPos] = useState({ x: 0, y: 0 });
  const [chatPos, setChatPos] = useState({ x: 0, y: 0 });
  const dragInfo = useRef({ type: null, startX: 0, startY: 0 });

  const handlePointerDown = (e, type) => {
    dragInfo.current = { type, startX: e.clientX, startY: e.clientY };
    e.target.setPointerCapture(e.pointerId); // Utrzymuje chwyt, nawet gdy kursor ucieknie z elementu
  };

const handlePointerMove = (e) => {
    if (!dragInfo.current.type || !videoContainerRef.current) return;
    
    const container = videoContainerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    
    if (dragInfo.current.type === 'bid') {
      setBidPos(p => ({ 
        x: Math.max(-(container.width - 208 - 16), Math.min(16, p.x + dx)), // max w lewo do krawędzi, max w prawo do punktu startu
        y: Math.max(-(container.height - 180 - 96), Math.min(96, p.y + dy)) // max w górę, max w dół
      }));
    }
    if (dragInfo.current.type === 'chat') {
      setChatPos(p => ({ 
        x: Math.max(-16, Math.min(container.width - 288 - 16, p.x + dx)),  
        y: Math.max(-(container.height - 256 - 96), Math.min(96, p.y + dy)) 
      }));
    }

    dragInfo.current.startX = e.clientX;
    dragInfo.current.startY = e.clientY;
  };

  const handlePointerUp = (e) => {
    if (dragInfo.current.type) {
      e.target.releasePointerCapture(e.pointerId);
      dragInfo.current.type = null;
    }
  };

  // --- NASŁUCHIWANIE PEŁNEGO EKRANU ---
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const videoContainerRef = useRef(null);

  const handlePlayerReady = useCallback((player) => {
    setPlayerInstance(player);
    setVolume(player.volume());
    
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('volumechange', () => {
      setIsMuted(player.muted());
      setVolume(player.volume());
    });
  }, []);

  // --- STEROWANIE WIDEO ---
  const togglePlay = () => {
    if (!playerInstance) return;
    if (playerInstance.paused()) playerInstance.play();
    else playerInstance.pause();
  };

  const toggleMute = () => {
    if (!playerInstance) return;
    playerInstance.muted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (playerInstance) {
      playerInstance.volume(newVol);
      playerInstance.muted(newVol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else videoContainerRef.current.requestFullscreen();
  };

  // --- STANY LICYTACJI I CZATU ---
  const [currentPrice, setCurrentPrice] = useState(50);
  const [bidIncrement, setBidIncrement] = useState(5);
  const [isWinning, setIsWinning] = useState(false);
  
  const [messages, setMessages] = useState([
    { id: 1, user: 'KarcianyŚwir', text: 'Kiedy zaczynamy?!' },
    { id: 2, user: 'System', text: 'Użytkownik X właśnie kupił slota #1!', isSystem: true },
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  const chatContainerRef = useRef(null);
  const overlayChatRef = useRef(null); 

  const handleBid = () => {
    setCurrentPrice(prev => prev + bidIncrement);
    setIsWinning(true);
    setTimeout(() => setIsWinning(false), 4000);
  };

  const handleSendMessage = (e) => {
    if (e && e.key !== 'Enter') return; 
    if (newMessage.trim() !== '') {
      setMessages(prev => [...prev, { id: Date.now(), user: 'Ty', text: newMessage }].slice(-50));
      setNewMessage('');
    }
  };

  // ZWRÓCONE ORYGINALNE DANE DO CZATU
  useEffect(() => {
    const fakeUsers = ['PikaPika', 'CardMaster', 'Zbiórka', 'FanatykKart'];
    const fakeMessages = ['Lecimy z tym!', 'Ale emocje 🔥','🔥🔥🔥', 'Ile jeszcze zostało?'];
    
    const interval = setInterval(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        user: fakeUsers[Math.floor(Math.random() * fakeUsers.length)], 
        text: fakeMessages[Math.floor(Math.random() * fakeMessages.length)] 
      }].slice(-50));
    }, Math.random() * 5000 + 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    if (overlayChatRef.current) overlayChatRef.current.scrollTop = overlayChatRef.current.scrollHeight;
  }, [messages]);

  // ZWRÓCONE WSZYSTKIE SLOTY HARMONOGRAMU
  const timelineSlots = [
    { id: 1, time: '20:00', title: 'Chicago Bulls', status: 'opened', info: 'Otwarto', winner: 'Janek' },
    { id: 2, time: '20:15', title: 'Boston Celtics', status: 'queued', info: 'Otwarcie ok. 20:45', winner: 'KarcianyŚwir' },
    { id: 3, time: '20:30', title: 'Los Angeles Lakers', status: 'active', info: 'Licytacja trwa!', winner: null },
    { id: 4, time: '20:45', title: 'Golden State', status: 'upcoming', info: 'Licytacja za 15 min', winner: null },
    { id: 5, time: '21:00', title: 'Miami Heat', status: 'upcoming', info: 'Licytacja za 30 min', winner: null },
  ];

  // --- GŁÓWNY WIDOK ---
  return (
    // Zmiana układu: grid działa tylko w trybie standardowym. W kinowym strona to elastyczna kolumna
    <div className={`min-h-screen bg-gray-950 text-white p-4 transition-all duration-500 ${isTheater ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-12 gap-6'}`}>
      
      {/* LEWA STRONA (Wideo + Harmonogram) */}
      <div className={`${isTheater ? 'w-full mb-8 flex flex-col gap-6' : 'lg:col-span-9 flex flex-col gap-4'}`}>
        
      {/* === KONTENER WIDEO === */}
        <div 
          ref={videoContainerRef}
          className={`bg-black rounded-xl flex flex-col relative overflow-hidden shadow-2xl group transition-all duration-300
            ${(isTheater || isFullscreen) ? 'w-full h-[60vh] lg:h-[80vh] border border-gray-800' : 'aspect-video border border-gray-800 w-full min-h-[40vh] lg:min-h-[60vh]'}
          `}
        >
          {/* Znaczek LIVE */}
          <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse z-20 shadow-lg pointer-events-none">
            LIVE
          </div>
          
          <VideoPlayer options={videoJsOptions} onReady={handlePlayerReady} />

          {/*PRZESUWALNY OVERLAY LICYTACJI (Tylko w trybie kinowym/pełnoekranowym lub na Mobile) */}
          <div 
            style={{ transform: `translate(${bidPos.x}px, ${bidPos.y}px)` }}
            className={`absolute bottom-24 right-4 w-52 bg-gray-900/85 backdrop-blur-md border border-gray-600/50 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden transition-opacity duration-300 ${(isTheater || isFullscreen) ? 'block' : 'block lg:hidden'} ${showOverlayBid ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            {/* Uchwyt do przesuwania */}
            <div 
              onPointerDown={(e) => handlePointerDown(e, 'bid')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
              className="w-full h-6 bg-gray-800/80 flex items-center justify-center cursor-move touch-none border-b border-gray-600/50" title="Chwyć i przesuń"
            >
              <div className="w-8 h-1 bg-gray-500 rounded-full pointer-events-none"></div>
            </div>
            
            <div className="p-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Los Angeles Lakers</p>
                {isWinning && <span className="text-[8px] bg-green-500/20 text-green-400 font-bold px-1.5 py-0.5 rounded animate-pulse border border-green-500/30">👑 PROWADZISZ</span>}
              </div>
              
              <div className="flex justify-between items-end mb-2 mt-1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest pb-1">Aktualna cena:</span>
                <span className={`text-2xl font-black tracking-tight transition-colors ${isWinning ? 'text-green-400' : 'text-white'}`}>${currentPrice}</span>
              </div>
              
              <div className="flex gap-1 mb-2">
                {[5, 10, 25].map(v => (
                  <button key={v} onClick={() => setBidIncrement(v)} className={`flex-1 text-[10px] py-1 rounded-md border font-bold transition ${bidIncrement === v ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-black/50 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>
                    +${v}
                  </button>
                ))}
              </div>
              
              <button onClick={handleBid} disabled={isWinning} className={`w-full py-2 rounded-lg font-black uppercase text-[11px] tracking-wider transition ${isWinning ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(22,163,7,0.4)]'}`}>
                {isWinning ? 'Oczekiwanie...' : `Podbij o $${bidIncrement}`}
              </button>
            </div>
          </div>

          {/*PRZESUWALNY OVERLAY CZATU */}
          <div 
            style={{ transform: `translate(${chatPos.x}px, ${chatPos.y}px)` }}
            className={`absolute bottom-24 left-4 w-72 h-64 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-xl flex flex-col shadow-2xl z-20 overflow-hidden transition-opacity duration-300 ${(isTheater || isFullscreen) ? 'block' : 'block lg:hidden'} ${showOverlayChat ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            {/* Uchwyt do przesuwania */}
            <div 
              onPointerDown={(e) => handlePointerDown(e, 'chat')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
              className="w-full h-7 bg-gray-800/80 flex items-center justify-center cursor-move touch-none border-b border-gray-700/50" title="Chwyć i przesuń"
            >
              <div className="w-10 h-1 bg-gray-500 rounded-full pointer-events-none"></div>
            </div>

            <div className="bg-black/20 px-3 py-1.5 flex justify-between items-center border-b border-gray-700/30">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Czat na żywo</span>
            </div>
            <div ref={overlayChatRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-xs custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="break-words leading-relaxed">
                  <span className="font-bold text-gray-400">{m.user}: </span>
                  <span className={m.isSystem ? 'text-green-400 font-bold' : 'text-gray-200'}>{m.text}</span>
                </div>
              ))}
            </div>
          </div>
          {/* KONTROLKI ODTWARZACZA Z PRZYCISKAMI WŁĄCZANIA PANELI */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:text-blue-400 transition transform hover:scale-110">
                {isPlaying ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
              </button>

              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="text-white hover:text-blue-400 transition">
                  {isMuted || volume === 0 ? <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg> : <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-0 opacity-0 group-hover/vol:w-24 group-hover/vol:opacity-100 transition-all duration-300 accent-blue-500 h-1 cursor-pointer" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {((isTheater || isFullscreen || window.innerWidth < 1024)) && (
                <div className="flex items-center gap-3 border-r border-gray-700 pr-4 mr-1">
                  <button onClick={() => setShowOverlayChat(!showOverlayChat)} className={`transition tooltip-container relative group/btn ${showOverlayChat ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap transition">Czat</span>
                  </button>
                  <button onClick={() => setShowOverlayBid(!showOverlayBid)} className={`transition tooltip-container relative group/btn ${showOverlayBid ? 'text-yellow-500' : 'text-gray-400 hover:text-white'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap transition">Licytacja</span>
                  </button>
                </div>
              )}

              <button onClick={() => setIsTheater(!isTheater)} className={`transition tooltip-container relative group/btn ${isTheater ? 'text-blue-500' : 'text-white hover:text-blue-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16v12H4z" /><path d="M8 6v12M16 6v12" /></svg>
                <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap transition z-50">Tryb Kinowy</span>
              </button>
              <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition tooltip-container relative group/btn">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap transition z-50">Pełny Ekran</span>
              </button>
            </div>
          </div>
        </div>
        {/* === KONIEC KONTENERA WIDEO === */}

        {/* Harmonogram pod wideo */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              📅 Harmonogram Otwierania
            </h3>
            <span className="bg-gray-800 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Kolejka na dziś</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar">
            {timelineSlots.map((slot) => {
              let borderStyle = "border-gray-700"; let bgStyle = "bg-gray-800"; let textStyle = "text-gray-400"; let badge = null;
              
              if (slot.status === 'opened') { bgStyle = "bg-gray-800/50"; borderStyle = "border-gray-800"; textStyle = "text-gray-600 line-through"; badge = <span className="text-[10px] font-bold bg-gray-700 text-gray-400 px-2 py-1 rounded-bl-lg rounded-tr-lg">✅ ZAKOŃCZONE</span>; } 
              else if (slot.status === 'queued') { borderStyle = "border-blue-500/50"; bgStyle = "bg-blue-900/20"; textStyle = "text-gray-200"; badge = <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">📦 W KOLEJCE</span>; } 
              else if (slot.status === 'active') { borderStyle = "border-yellow-500"; bgStyle = "bg-yellow-900/20"; textStyle = "text-yellow-400"; badge = <span className="text-[10px] font-bold bg-yellow-500 text-black px-2 py-1 rounded-bl-lg rounded-tr-lg animate-pulse">🔥 TERAZ</span>; } 
              else { badge = <span className="text-[10px] font-bold bg-gray-700 text-gray-400 px-2 py-1 rounded-bl-lg rounded-tr-lg">⏳ WKRÓTCE</span>; }
              
              return (
                <div key={slot.id} className={`min-w-[220px] p-4 rounded-xl border-2 transition-all ${borderStyle} ${bgStyle} relative flex flex-col justify-between shrink-0 overflow-hidden`}>
                  <div className="absolute top-0 right-0 z-10">{badge}</div>
                  <div className="mt-2"><span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Slot #{slot.id}</span><span className={`font-black italic text-lg block uppercase tracking-tight ${textStyle} pr-16`}>{slot.title}</span></div>
                  <div className="mt-3 pt-3 border-t border-gray-700/50"><span className={`block text-xs font-bold uppercase tracking-wider ${slot.status === 'active' ? 'text-yellow-500' : 'text-gray-500'}`}>{slot.info}</span>{slot.winner && <span className="block text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Wygrał: <span className="text-gray-300 font-bold">{slot.winner}</span></span>}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRAWA STRONA: STANDARDOWE AKCJE (Ukrywana w trybie kinowym) */}
      {!isTheater && (
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 h-[calc(100vh-2rem)]">
          {/* Klasyczna Licytacja */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)] shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-yellow-500 uppercase tracking-widest">🔥 Licytacja Trwa</h2>
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>
            </div>
            
            <span className="block text-2xl font-black italic uppercase tracking-tighter mb-1">Los Angeles Lakers</span>
            <span className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-6">Paczka: Panini Prizm 2023</span>
            
            <div className={`rounded-xl p-4 mb-6 flex justify-between items-center border transition-all duration-300 ${isWinning ? 'bg-green-900/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'bg-gray-800/50 border-gray-700'}`}>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isWinning ? 'text-green-400' : 'text-gray-500'}`}>Aktualna cena:</span>
                {isWinning && <span className="text-xs font-bold text-green-500 animate-pulse mt-1">👑 WYGRYWASZ!</span>}
              </div>
              <span className={`text-4xl font-black italic transition-colors ${isWinning ? 'text-green-400' : 'text-white'}`}>${currentPrice}</span>
            </div>
            
            <div className="mb-6">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 block">Wybierz przebicie:</span>
              <div className="grid grid-cols-3 gap-3">
                {[5, 10, 25].map(val => (
                  <button key={val} onClick={() => setBidIncrement(val)} className={`py-2 rounded-xl font-bold text-sm transition-all border ${bidIncrement === val ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>+${val}</button>
                ))}
              </div>
            </div>
            
            <button onClick={handleBid} disabled={isWinning} className={`w-full py-4 rounded-xl font-black text-lg transition-all uppercase tracking-tighter ${isWinning ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_10px_20px_rgba(22,163,7,0.2)] hover:-translate-y-1'}`}>
              {isWinning ? 'Jesteś na prowadzeniu' : `Podbij o $${bidIncrement}`}
            </button>
          </div>

          {/* Klasyczny Czat */}
          <div className="bg-gray-900 rounded-2xl p-5 flex flex-col border border-gray-800 shadow-xl flex-1 overflow-hidden">
            <h2 className="text-xs font-bold mb-4 text-blue-400 uppercase tracking-widest">💬 Czat</h2>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="text-sm leading-relaxed break-words">
                  <span className="font-bold text-gray-500">{m.user}: </span>
                  <span className={m.isSystem ? 'text-green-400 font-semibold' : 'text-gray-200'}>{m.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto shrink-0 flex gap-2">
              <input type="text" placeholder="Napisz wiadomość..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleSendMessage} className="w-full bg-gray-800 text-white text-sm rounded-xl p-4 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700 transition" />
              <button onClick={() => handleSendMessage()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl transition shadow-[0_5px_15px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </button>
            </div>
          </div>    
        </div>
      )}

    </div>
  );
}