# 🃏 CardBid - Platforma Aukcyjna

To jest główne repozytorium platformy aukcyjnej **CardBid**. Projekt wykorzystuje architekturę kontenerową (Docker), co pozwala na błyskawiczne uruchomienie całego środowiska deweloperskiego.

---

## 🚀 Szybki Start (Docker)

Najprostszy sposób na odpalenie projektu. Docker automatycznie skonfiguruje bazę danych, redis, backend i frontend.

1.  **Uruchomienie całego stosu:**
    ```bash
    docker compose up --build -d
    ```
2.  **Aplikacja dostępna pod adresami:**
    * **Frontend (React):** [http://localhost:5173](http://localhost:5173)
    * **Backend Admin:** [http://localhost:8000/admin](http://localhost:8000/admin)

---

## 💻 Frontend (React + Vite)

Folder: `/frontend`

### Stack Technologiczny:
* **Framework:** React 18
* **Bundler:** Vite (zapewnia błyskawiczny Hot Module Replacement)
* **Styling:** Tailwind CSS
* **Komunikacja:** Axios

### 📂 Architektura folderu `src/` (Zasady zespołu):
Proszę o trzymanie się poniższej struktury plików:
* `components/` - Małe, reużywalne elementy UI (przyciski, karty, inputy).
* `pages/` - Główne widoki aplikacji (np. Home.jsx, LiveRoom.jsx).
* `api/` - Konfiguracja zapytań Axios i definicje endpointów.
* `hooks/` - Customowe hooki Reacta.
* `assets/` - Statyczne pliki (grafiki, ikony, fonty).

---

## 🐍 Backend (Django 6.0)

Folder: `/backend`

### Specyfikacja:
* **Runtime:** Python 3.13-slim
* **Baza danych:** PostgreSQL 15
* **Cache/Real-time:** Redis (obsługa licytacji live)

---

## 🛠️ Przydatne Komendy (Zarządzanie kontenerami)

Używamy `docker compose exec`, aby wykonywać komendy bezpośrednio wewnątrz uruchomionych kontenerów.

| Zadanie | Komenda |
| :--- | :--- |
| **Uruchomienie projektu (w tle)** | `docker compose up -d` |
| **Zatrzymanie projektu** | `docker compose stop` |
| **Usunięcie kontenerów** | `docker compose down` |
| **Generowanie struktury tabel** | `docker compose exec backend python manage.py makemigrations auctions` |
| **Migracje bazy danych** | `docker compose exec backend python manage.py migrate` |
| **Generowanie fake danych do bazy** | `docker compose exec backend python manage.py seed_data` |
| **Tworzenie Superusera** | `docker compose exec backend python manage.py createsuperuser` |
| **Logi na żywo (Backend)** | `docker compose logs -f backend` |
| **Restart serwerów** | `docker compose restart` |

---

## ⚠️ Praca bez Dockera (Lokalnie)

Jeśli z jakiegoś powodu musisz odpalić frontend bez kontenera:
1. Wejdź do `/frontend`
2. `npm install`
3. `npm run dev`

*Uwaga: Aby frontend działał poprawnie, backend (API) musi być uruchomiony (najlepiej w Dockerze).*

---

## 🚀 API Endpointy

### 🔐 Rejestracja logowanie itp.
| Metoda | Endpoint | Opis | Uprawnienia |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register/` | Rejestracja nowego użytkownika (**wymaga 18+ lat**) | AllowAny |
| `POST` | `/auth/login/` | Logowanie i pobranie tokenów JWT (Access & Refresh) | AllowAny |
| `POST` | `/auth/refresh/` | Odświeżenie wygasłego tokena Access | AllowAny |
| `POST` | `/auth/logout/` | Wylogowanie (Blacklist tokena Refresh) | IsAuthenticated |

### 👤 Profil użytkownika i portfel
| Metoda | Endpoint | Opis | Uprawnienia |
| :--- | :--- | :--- | :--- |
| `GET/PATCH` | `/api/user/profile/` | Podgląd i edycja profilu | IsAuthenticated |
| `POST` | `/api/top-up/` | Doładowanie portfela | IsAuthenticated |
| `GET` | `/api/tax-calc/` | Oblicz podatki (wymaga `?amount=X`) | IsAuthenticated |
| `GET` | `/api/user/inventory/` | Wygrane karty (zakończone aukcje) | IsAuthenticated |
| `GET` | `/api/user/active-bids/` | Aukcje, w których user obecnie prowadzi | IsAuthenticated |

### 🃏 Aukcje i karty
| Metoda | Endpoint | Opis | Uprawnienia |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/cards/` | Pobierz listę kart / Utwórz nową kartę | IsAuthenticated |
| `GET` | `/api/categories/` | Lista dostępnych kategorii | AllowAny |
| `GET/POST` | `/api/auctions/` | Lista aktywnych aukcji / Wystawienie nowej | IsAuthenticatedOrReadOnly |
| `GET` | `/api/auctions/{id}/` | Szczegóły konkretnej aukcji | AllowAny |
| `POST` | `/api/auctions/{id}/bid/` | Licytowanie (przebicie oferty) | IsAuthenticated |
| `GET` | `/api/auctions/{id}/bids/` | Historia licytacji dla aukcji | AllowAny |
| `POST` | `/api/auctions/{id}/buy-now/` | Kup teraz | IsAuthenticated |

### 🎥 Live Streaming
| Metoda | Endpoint | Opis | Uprawnienia |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/live-rooms/` | Lista wszystkich aktywnych i zaplanowanych streamów | AllowAny |
| `POST` | `/api/live-rooms/toggle/` | Rozpoczęcie lub zakończenie transmisji (`is_live: true/false`) | IsStreamer |
| `GET` | `/api/test-streamer/` | Endpoint testowy weryfikujący rolę streamera | IsStreamer |

### 🌍 Geografia i narzędzia
| Metoda | Endpoint | Opis | Uprawnienia |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/countries/` | Lista krajów i stanów | AllowAny |
| `GET` | `/api/tax-calc/` | Obliczanie VAT i cła przed złożeniem oferty | IsAuthenticated |
| `POST` | `/api/v1/psa-verify/` | Symulacja weryfikacji certyfikatu karty w PSA | IsAuthenticated |

---

## 💡 Informacje Techniczne dla Frontendu

### 🔑 Autoryzacja
Wszystkie endpointy wymagające uprawnień `IsAuthenticated` muszą zawierać nagłówek:
```http
Authorization: Bearer <access_token>

&copy; 2026 CardBid Team