# 🃏 CardBid - Live-Commerce MVP

Platforma e-commerce łącząca tradycyjny sklep z kartami kolekcjonerskimi oraz moduł licytacji na żywo (Live Rooms) z niskim opóźnieniem.

## 🚀 Jak odpalić projekt u siebie

1. Sklonuj to repozytorium na swój komputer:
   `git clone https://github.com/CardBid/cardbid-core.git`
2. Upewnij się, że masz zainstalowanego i odpalonego **Docker Desktop**.
3. Wejdź do głównego folderu z projektem i odpal kontenery (Baza + Redis):
   `docker-compose up -d`

## 📂 Struktura katalogów
* `/backend` - Tu będzie żyło nasze Django i API (Python)
* `/frontend` - Tu będzie żył nasz interfejs (React/Next.js)

## 🛠️ Stack Technologiczny
* **Baza Danych:** PostgreSQL + Redis
* **Backend:** Django + Django REST Framework + Channels
* **Frontend:** React + TailwindCSS

## 🤝 Zasady współpracy (GitFlow)

Zanim zaczniesz pisać kod i tworzyć gałęzie, koniecznie zapoznaj się z naszym kodeksem współpracy. Znajdziesz tam info o tym, jak nazywać branche, jak pisać commity i jak robić Pull Requesty:

👉 **[PRZECZYTAJ: Zasady współpracy (CONTRIBUTING.md)](./CONTRIBUTING.md)**
