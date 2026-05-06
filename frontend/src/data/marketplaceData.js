import heroImage from '../assets/hero.png';

export const categories = [
  { id: 'all', label: 'Wszystko' },
  { id: 'pokemon', label: 'Pokemon TCG' },
  { id: 'nba', label: 'NBA' },
  { id: 'soccer', label: 'Soccer' },
];

export const marketplaceProducts = [
  {
    id: '1',
    title: 'Pokemon Base Set Booster Pack',
    categoryId: 'pokemon',
    category: 'Pokemon TCG',
    type: 'AUCTION',
    currentBid: 1250,
    endTime: Date.now() + 86400000,
    image: heroImage,
    seller: 'CardVault',
    stock: 1,
    condition: 'Factory sealed',
    origin: 'Prywatna kolekcja',
    description:
      'Oryginalna, zafoliowana paczka kart Pokemon TCG z przeznaczeniem do licytacji live.',
  },
  {
    id: '2',
    title: 'Panini Prizm NBA 2023-24 Hobby Pack',
    categoryId: 'nba',
    category: 'NBA',
    type: 'FIXED',
    price: 350,
    image: heroImage,
    seller: 'HoopBreaks',
    stock: 4,
    condition: 'Nowa',
    origin: 'Autoryzowany dystrybutor',
    description:
      'Paczka pochodzaca z nowo otwartego hobby boxa. Gotowa do natychmiastowego zakupu.',
  },
  {
    id: '3',
    title: 'Soccer Icons Mystery Pack',
    categoryId: 'soccer',
    category: 'Soccer',
    type: 'FIXED',
    price: 219,
    image: heroImage,
    seller: 'FinalWhistle',
    stock: 7,
    condition: 'Sealed',
    origin: 'Zweryfikowany sprzedawca',
    description:
      'Zamknieta paczka pilkarska z karta premium w kazdym slocie. Flow przygotowany pod Kup teraz.',
  },
  {
    id: '4',
    title: 'Graded Rookie Card Box',
    categoryId: 'nba',
    category: 'NBA',
    type: 'FIXED',
    price: 680,
    image: heroImage,
    seller: 'RookieLab',
    stock: 2,
    condition: 'Mint box',
    origin: 'Magazyn CardBid',
    description:
      'Box z karta graded rookie dla katalogu 24/7. Przycisk zakupu dziala jako mock UI.',
  },
];

export const liveRooms = [
  {
    id: 'live-main',
    title: 'Wielkie otwieranie paczek NBA',
    host: 'streamer_1',
    viewers: 128,
    startsAt: 'LIVE',
    href: '/live',
  },
  {
    id: 'live-pokemon',
    title: 'Pokemon vintage night',
    host: 'streamer_2',
    viewers: 74,
    startsAt: '20:30',
    href: '/live',
  },
];

export const getProductById = (id) =>
  marketplaceProducts.find((product) => product.id === id);
