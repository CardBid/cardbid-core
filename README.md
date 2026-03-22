# 🃏 CardBid - Live-Commerce MVP

Platforma e-commerce łącząca tradycyjny sklep z kartami kolekcjonerskimi oraz moduł licytacji na żywo (Live Rooms) z niskim opóźnieniem.

## 🛠️ Wymagania wstępne

Zanim zaczniesz, upewnij się, że masz zainstalowane w systemie:
* **Docker Desktop** (na Windowsie/Macu) lub silnik Dockera (na Linuxie). **Musi być uruchomiony w tle!**
* **Python 3.10+** (na Windowsie upewnij się, że dodałeś Pythona do zmiennej PATH podczas instalacji).
* **Node.js 18+** oraz **npm**.
* **Git**.

---

## 🚀 Jak odpalić projekt u siebie

### Krok 1: Pobranie kodu i infrastruktura (Wspólne dla wszystkich)

Niezależnie od systemu, otwórz terminal (lub wiersz poleceń) i wpisz po kolei:

```bash
git clone [https://github.com/CardBid/cardbid-core.git](https://github.com/CardBid/cardbid-core.git)
cd cardbid-core
git checkout dev
docker compose up -d
```

---

### Krok 2: Uruchomienie aplikacji (Wybierz swój system)

Otwórz w VS Code **dwa osobne terminale**. Wybierz instrukcję poniżej, w zależności od tego, na jakim systemie pracujesz.

#### 🪟 Ścieżka dla systemu Windows

**Terminal 1: Backend (Django)**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install django psycopg2-binary django-cors-headers
python manage.py migrate
python manage.py runserver
```
👉 *API działa pod adresem: http://127.0.0.1:8000*

**Terminal 2: Frontend (React)**
```powershell
cd frontend
npm install
npm run dev
```
👉 *Aplikacja działa pod adresem: http://localhost:5173*

---

#### 🐧/🍏 Ścieżka dla systemu Linux / macOS

**Terminal 1: Backend (Django)**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install django psycopg2-binary django-cors-headers
python manage.py migrate
python manage.py runserver
```
👉 *API działa pod adresem: http://127.0.0.1:8000*

**Terminal 2: Frontend (React)**
```bash
cd frontend
npm install
npm run dev
```
👉 *Aplikacja działa pod adresem: http://localhost:5173*

---

## 📂 Struktura katalogów

* `/backend` - Tu żyje nasze API oparte na Django i Pythonie.
* `/frontend` - Tu żyje nasz interfejs użytkownika (React + Vite).
* `docker-compose.yml` - Konfiguracja kontenerów infrastruktury (Postgres, Redis).

## 🛠️ Stack Technologiczny

* **Baza Danych:** PostgreSQL + Redis
* **Backend:** Django + Django REST Framework + Channels
* **Frontend:** React + TailwindCSS + Vite

## 🤝 Zasady współpracy (GitFlow)

⚠️ **WAŻNE:** Foldery `venv/` (w backendzie) oraz `node_modules/` (we frontendzie) są ignorowane przez Git. **Nigdy ich nie dodawaj do commitów!**

Zanim zaczniesz pisać kod i tworzyć nowe gałęzie, koniecznie zapoznaj się z naszym kodeksem współpracy. Znajdziesz tam info o tym, jak nazywać branche, jak pisać commity i jak robić Pull Requesty:

👉 **[PRZECZYTAJ: Zasady współpracy (CONTRIBUTING.md)](./CONTRIBUTING.md)**