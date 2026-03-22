# 🃏 CardBid - Frontend (React + Vite)

Ten folder zawiera aplikację kliencką (interfejs użytkownika) dla platformy CardBid. Projekt jest zbudowany w oparciu o React i zoptymalizowany za pomocą Vite.

## 🛠️ Stack Technologiczny
* **Framework:** React 18
* **Bundler:** Vite (zapewnia błyskawiczne budowanie i HMR)
* **Styling:** Tailwind CSS *(do skonfigurowania)*
* **Komunikacja z API:** Axios *(do komunikacji z backendem Django)*

## 🚀 Szybki start

Jeśli infrastruktura (Docker) i backend już u Ciebie działają, wykonaj te kroki, aby odpalić sam frontend:

### 1. Wejdź do folderu frontendu
`cd frontend`

### 2. Zainstaluj biblioteki
`npm install`

### 3. Uruchom serwer
`npm run dev`

👉 *Aplikacja uruchomi się pod adresem: http://localhost:5173*

## 📂 Architektura folderu src/ (Zasady zespołu)

Aby utrzymać porządek w kodzie, trzymajmy się poniższej struktury wewnątrz folderu `src/`:

* `components/` - Reużywalne, małe elementy UI (np. przyciski, karty produktów, inputy).
* `pages/` - Główne widoki aplikacji (np. Home.jsx, LiveRoom.jsx, Profile.jsx).
* `api/` - Konfiguracja zapytań do naszego backendu Django.
* `hooks/` - Nasze customowe hooki Reacta.
* `assets/` - Statyczne pliki (obrazki, ikony, fonty).

## 📜 Dostępne skrypty

* `npm run dev` - Odpala projekt w trybie deweloperskim (odświeża się sam po zapisie pliku).
* `npm run build` - Buduje zoptymalizowaną aplikację gotową do wrzucenia na produkcję.
* `npm run lint` - Uruchamia linter (ESLint), aby sprawdzić czystość kodu.