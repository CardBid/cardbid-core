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
| **Zatrzymanie projektu** | `docker compose stop` |
| **Usunięcie kontenerów** | `docker compose down` |
| **Migracje bazy danych** | `docker compose exec backend python manage.py migrate` |
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

&copy; 2026 CardBid Team