import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Countdown from 'react-countdown';

// --- BAZA DANYCH (Mock Data) ---
const mockProducts = [
  {
    id: "1",
    title: "Pokemon Base Set Booster Pack (Unlimited)",
    type: "AUCTION",
    endTime: Date.now() + 86400000, // Ustawia koniec licytacji na 24h od teraz
    currentBid: 1250,
    details: { 
      category: "Vintage Booster", 
      condition: "Factory Sealed (Sealed)", 
      origin: "Prywatna Kolekcja",
      description: "Oryginalna, zafoliowana paczka kart z wczesnych lat wydawniczych Pokemon TCG. Gwarancja autentyczności i nienaruszonego stanu folii (brak pęknięć i przetarć). Idealna okazja dla kolekcjonerów szukających klasycznych kart holograficznych w nieskazitelnym stanie."
    }
  },
  {
    id: "2",
    title: "Panini Prizm NBA 2023-24 Hobby Pack",
    type: "FIXED",
    price: 350,
    details: { 
      category: "Modern Hobby Pack", 
      condition: "Nowa", 
      origin: "Autoryzowany Dystrybutor",
      description: "Paczka pochodząca bezpośrednio z nowo otwartego Hobby Boxa. W tej serii gwarantowana jest wysoka szansa na trafienie ekskluzywnych kart Prizm, autografów oraz limitowanych wariantów debiutantów z aktualnego rocznika."
    }
  }
];

export default function ProductDetail() {
  // Pobieramy parametr 'id' z paska adresu
  const { id } = useParams();
  
  // Szukamy odpowiedniego produktu w naszej testowej tablicy
  const product = mockProducts.find(p => p.id === id);

  // --- ZARZĄDZANIE STANEM (State) ---
  const [currentPrice, setCurrentPrice] = useState(0);       // Aktualna cena na ekranie
  const [isWinning, setIsWinning] = useState(false);         // Czy użytkownik aktualnie wygrywa aukcję?
  const [bidIncrement, setBidIncrement] = useState(5);       // Wybrana kwota szybkiego przebicia (np. +5$, +10$)
  const [isSold, setIsSold] = useState(false);               // Czy przedmiot w opcji "Kup Teraz" został sprzedany?
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // Czy długi opis jest rozwinięty?

  // --- EFEKTY (Side Effects) ---
  // Ten kod uruchamia się za każdym razem, gdy użytkownik wejdzie na nowy produkt.
  useEffect(() => {
    if (product) {
      setCurrentPrice(product.currentBid || product.price || 0);
      setIsWinning(false);
      setIsSold(false);
      setIsDetailsExpanded(false); // Domyślnie zwijamy opis przy nowym produkcie
    }
  }, [product]);

  // --- FUNKCJE OBSŁUGUJĄCE AKCJE (Handlers) ---
  
  // Logika podbicia stawki w aukcji
  const handleBid = () => {
    // 1. Użytkownik podbija o wybraną przez siebie kwotę
    setCurrentPrice(prev => prev + bidIncrement);
    setIsWinning(true);

    // 2. Symulacja bota: po 4 sekundach ktoś inny nas przebija o 5$
    setTimeout(() => {
      setIsWinning(false);
      setCurrentPrice(prev => prev + 5); 
    }, 4000);
  };

  // Logika zakupu natychmiastowego
  const handleBuyNow = () => {
    setIsSold(true); // Wyłącza przycisk i zmienia jego status na "SPRZEDANO"
  };

  // --- WIDOK BŁĘDU (404) ---
  // Zabezpieczenie przed wpisaniem zmyślonego ID w pasku adresu (np. /product/999)
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Nie znaleziono produktu</h1>
        <Link to="/" className="text-blue-500 hover:underline">Wróć na stronę główną</Link>
      </div>
    );
  }

  // --- GŁÓWNY WIDOK KOMPONENTU (UI) ---
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans">
      
      {/* Przycisk powrotu */}
      <Link to="/" className="text-gray-400 hover:text-white mb-8 inline-block transition">
        &larr; Wróć
      </Link>

      {/* Główny kontener siatki - dzieli ekran na dwie równe kolumny na dużych ekranach (lg:grid-cols-2) */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* --- LEWA KOLUMNA: WIZUALIZACJA --- */}
        {/* h-fit i lg:sticky lg:top-8 sprawiają, że obrazek przewija się razem z ekranem, 
            gdy prawa kolumna ze szczegółami jest bardzo długa. */}
        <div className="bg-gray-900 rounded-3xl border border-gray-800 p-12 flex items-center justify-center aspect-[3/4] shadow-2xl relative overflow-hidden group h-fit lg:sticky lg:top-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-purple-900/10 z-0"></div>
          <span className="text-gray-600 font-bold text-xl uppercase tracking-widest group-hover:scale-110 transition-transform duration-500 text-center">
            Wizualizacja <br/> Paczki
          </span>
        </div>

        {/* --- PRAWA KOLUMNA: AKCJE I SZCZEGÓŁY --- */}
        <div className="flex flex-col">
          
          {/* 1. Tytuł Produktu */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
              {product.title}
            </h1>
          </div>

          {/* 2. PANEL ZAKUPOWY (Logika warunkowa: licytacja albo zakup bezpośredni) */}
          <div className="mb-8">
            {product.type === 'AUCTION' ? (
              
              // --- WARIANT A: LICYTACJA ---
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                
                {/* Nagłówek aukcji: pulsująca dioda i licznik czasu */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    Licytacja Trwa
                  </h2>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Koniec za:</span>
                    <div className="text-lg font-mono font-bold text-yellow-500 tracking-tighter">
                      <Countdown date={product.endTime} />
                    </div>
                  </div>
                </div>

                {/* Pole z aktualną ceną (zmienia kolor na zielony, gdy wygrywamy) */}
                <div className={`rounded-xl p-5 mb-6 flex justify-between items-center border transition-all duration-500 ${
                  isWinning 
                    ? 'bg-green-900/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
                    : 'bg-gray-900/50 border-gray-700'
                }`}>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isWinning ? 'text-green-400' : 'text-gray-500'}`}>
                      Aktualna cena
                    </span>
                    {isWinning && (
                      <span className="text-xs font-bold text-green-500 animate-pulse mt-1">
                        👑 WYGRYWASZ!
                      </span>
                    )}
                  </div>
                  <span className={`text-4xl font-black transition-colors ${isWinning ? 'text-green-400' : 'text-white'}`}>
                    ${currentPrice}
                  </span>
                </div>

                {/* Sekcja szybkiego wyboru kwoty przebicia */}
                <div className="mb-6">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 block">Wybierz przebicie</span>
                  <div className="grid grid-cols-3 gap-3">
                    {[5, 10, 25].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBidIncrement(val)}
                        // Aktywny przycisk jest żółty, nieaktywne są szare
                        className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                          bidIncrement === val 
                            ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        +${val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Główny przycisk licytacji (wyłączany, gdy użytkownik prowadzi w licytacji) */}
                <button 
                  onClick={handleBid}
                  disabled={isWinning}
                  className={`w-full py-5 rounded-2xl font-black text-xl transition-all uppercase tracking-tighter ${
                    isWinning 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' 
                      : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_10px_20px_rgba(22,163,74,0.2)] hover:-translate-y-1'
                  }`}
                >
                  {isWinning ? 'Jesteś na prowadzeniu' : `Podbij o $${bidIncrement}`}
                </button>
              </div>

            ) : (
              
              // --- WARIANT B: KUP TERAZ ---
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <div className="mb-6">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Cena Kup Teraz</span>
                  <span className="text-5xl font-black text-white">${product.price}</span>
                </div>
                {/* Przycisk zakupu natychmiastowego */}
                <button 
                  onClick={handleBuyNow}
                  disabled={isSold}
                  className={`w-full py-5 rounded-2xl font-black text-xl transition-all uppercase tracking-tighter ${
                    isSold 
                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:-translate-y-1'
                  }`}
                >
                  {isSold ? '🔒 SPRZEDANO' : 'Kup natychmiast'}
                </button>
              </div>
            )}
          </div>

          {/* 3. PANEL SZCZEGÓŁÓW (Z dynamiczną wysokością) */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
            <h3 className="text-gray-500 text-xs uppercase tracking-[0.2em] font-black mb-4 pb-4 border-b border-gray-800">
              📋 Szczegóły Paczki
            </h3>
            
            {/* Kontener ograniczający wysokość opisu. Zdejmuje limit (max-h-48), gdy isDetailsExpanded to true */}
            <div className={`relative transition-all duration-500 ${isDetailsExpanded ? '' : 'max-h-48 overflow-hidden'}`}>
              
              {/* Tabela z parametrami paczki */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Kategoria</p>
                  <p className="font-bold text-gray-200">{product.details.category}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Stan</p>
                  <p className="font-bold text-gray-200">{product.details.condition}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Pochodzenie / Źródło</p>
                  <p className="font-bold text-gray-200">{product.details.origin}</p>
                </div>
              </div>

              {/* Pełny opis tekstowy */}
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold mb-2">Opis</p>
                <p className="text-gray-400 text-sm leading-relaxed pb-4">
                  {product.details.description}
                </p>
              </div>

              {/* Dolny gradient zanikający (Fade out). Wyświetla się tylko wtedy, gdy opis jest zwinięty */}
              {!isDetailsExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
              )}
            </div>

            {/* Przycisk aktywujący rozwinięcie/zwinięcie szczegółów */}
            <button 
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="mt-2 w-full pt-4 border-t border-gray-800 text-blue-400 hover:text-blue-300 font-bold text-sm tracking-widest uppercase transition-colors"
            >
              {isDetailsExpanded ? '↑ Zwiń szczegóły' : 'Czytaj dalej ↓'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}