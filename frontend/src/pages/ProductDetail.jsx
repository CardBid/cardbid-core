import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Countdown from 'react-countdown';

//testowa baza danych (Mock Data)
const mockProducts = [
  {
    id: "1",
    title: "1999 Pokemon Base Set Charizard Holo",
    type: "AUCTION", // Typ aukcyjny
    endTime: Date.now() + 86400000, // Koniec za 24 godziny od teraz
    currentBid: 1250,
    psa: { grade: "PSA 10 Gem Mint", cert: "84729103", population: 121 }
  },
  {
    id: "2",
    title: "2003 Lebron James Topps Chrome Rookie",
    type: "FIXED", // Typ Kup Teraz
    price: 3500,
    psa: { grade: "PSA 9 Mint", cert: "55829104", population: 840 }
  }
];

export default function ProductDetail() {
  //Łowienie ID z paska adresu
  const { id } = useParams();
  
  const [bidIncrement, setBidIncrement] = useState(5);

  // Szukamy produktu w naszej bazie na podstawie ID z URLa
  const product = mockProducts.find(p => p.id === id);

  const [currentPrice, setCurrentPrice] = useState(0);
  const [isWinning, setIsWinning] = useState(false);
  const [isSold, setIsSold] = useState(false);

  // Przy ładowaniu produktu ustawiamy aktualną cenę i resetujemy statusy
  useEffect(() => {
    if (product) {
      setCurrentPrice(product.currentBid || 0);
      setIsWinning(false);
      setIsSold(false);
    }
  }, [product]);

  // Funkcja symulująca licytację
const handleBid = () => {
    setCurrentPrice(prev => prev + bidIncrement);
    setIsWinning(true);

    setTimeout(() => {
      setIsWinning(false);
      // Symulacja: bot przebija nas o losową kwotę z przedziału 5-15
      setCurrentPrice(prev => prev + Math.floor(Math.random() * 10) + 5); 
    }, 4000);
  };

  // Funkcja symulująca zakup
  const handleBuyNow = () => {
    setIsSold(true);
  };

  // Zabezpieczenie: jeśli ktoś wpisze zły adres
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Nie znaleziono produktu</h1>
        <Link to="/" className="text-blue-500 hover:underline">Wróć na stronę główną</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans">
      <Link to="/" className="text-gray-400 hover:text-white mb-6 inline-block transition">
        &larr; Wróć
      </Link>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEWA KOLUMNA: Zdjęcie (na razie placeholder) */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 flex items-center justify-center aspect-[2.5/3.5] shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-purple-900/20 z-0"></div>
          <span className="text-gray-500 font-medium z-10 relative">Zdjęcie Karty (Wkrótce)</span>
        </div>

        {/* PRAWA KOLUMNA: Szczegóły i Akcje */}
        <div className="flex flex-col justify-center">
          
          {/* Tytuł i Badge */}
          <div className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
              product.type === 'AUCTION' ? 'bg-purple-900/50 text-purple-400 border border-purple-700' : 'bg-blue-900/50 text-blue-400 border border-blue-700'
            }`}>
              {product.type === 'AUCTION' ? '🔥 LICYTACJA' : '🛒 KUP TERAZ'}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-100 leading-tight">
              {product.title}
            </h1>
          </div>

          {/*Sekcja PSA */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 mb-8">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider font-bold mb-4 border-b border-gray-700 pb-2">
              Dane Certyfikacyjne PSA
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Ocena (Grade)</p>
                <p className="font-bold text-gray-200">{product.psa.grade}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Numer Certyfikatu</p>
                <p className="font-mono text-gray-200">{product.psa.cert}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs mb-1">Populacja (Ilość na świecie)</p>
                <p className="font-bold text-gray-200">{product.psa.population} szt.</p>
              </div>
            </div>
          </div>

          {/* Rozwidlenie Logiki UI (Aukcja vs Kup Teraz) */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
            
            {product.type === 'AUCTION' ? (
              // WIDOK AUKCJI
              <div>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Aktualna oferta</p>
                    <p className="text-3xl font-black text-green-400">${currentPrice}</p>
                    {isWinning && <p className="text-xs font-bold text-green-500 animate-pulse mt-1">👑 PROWADZISZ</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-sm mb-1">Koniec za</p>
                    <div className="text-xl font-mono font-bold text-yellow-500">
                      <Countdown date={product.endTime} />
                    </div>
                  </div>
                </div>

                {/* PRZYCISKI SZYBKIEGO PODBIJANIA --- */}
                <div className="mb-6">
                  <span className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-bold">Wybierz kwotę przebicia:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 25].map((value) => (
                      <button
                        key={value}
                        onClick={() => setBidIncrement(value)}
                        className={`py-2 rounded-lg font-bold text-sm transition-all border ${
                          bidIncrement === value 
                            ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        +${value}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleBid}
                  disabled={isWinning}
                  className={`w-full font-bold py-4 rounded-xl transition-all uppercase tracking-widest ${
                    isWinning 
                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                  }`}
                >
                  {isWinning ? 'Jesteś na prowadzeniu' : `Podbij o $${bidIncrement}`}
                </button>
              </div>
            ) : (
              // WIDOK KUP TERAZ
              <div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-1">Cena Kup Teraz</p>
                  <p className="text-3xl font-black text-white">${product.price}</p>
                </div>
                <button 
                  onClick={handleBuyNow}
                  disabled={isSold}
                  className={`w-full font-bold py-4 rounded-xl transition text-center tracking-wide ${
                    isSold 
                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]'
                  }`}>
                  {isSold ? '🔒 SPRZEDANO' : 'Kup natychmiast'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}