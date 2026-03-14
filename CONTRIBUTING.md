# 📜 Zasady współpracy w projekcie CardBid

Siema! Aby nasz 7-osobowy zespół nie utonął w konfliktach kodu, trzymamy się poniższych zasad. Przeczytaj je, zanim zaczniesz kodować!

## 🌿 Architektura gałęzi (Branching Model)

W repozytorium mamy dwie główne gałęzie:
* **`main`** – Wersja produkcyjna. Tutaj trafia tylko kod gotowy do oddania.
* **`dev`** – Nasz główny plac budowy. **Wszystkie zadania zaczynamy od odbicia się od tej gałęzi.**

### Tworzenie nowej gałęzi
Każde zadanie (Issue) realizujemy na osobnym branchu.
* **Nazewnictwo:** `issue-[numer_zadania]` (np. `issue-12`)
* **Źródło:** Zawsze twórz brancha z aktualnego `dev`.

## 💾 Commity (Zapisywanie zmian)

Stosujemy jasny format wiadomości, żeby łatwo było wyczytać historię zmian na Discordzie i GitHubie.

**Format:** `typ: #numer_zadania opis_zmiany`

**Typy do wyboru:**
* `feat`: nowa funkcjonalność (np. `feat: #5 dodanie czatu`)
* `fix`: naprawa błędu (np. `fix: #8 naprawa logowania`)
* `refactor`: czyszczenie/poprawa jakości kodu bez zmiany działania

> 💡 **Tip:** Jeśli używasz VS Code, możesz generować opisy przez wbudowane AI, ale pamiętaj, aby dopisać ręcznie numer Issue (`#ID`)!

## 🔄 Pull Requests (Łączenie kodu)

Gdy skończysz zadanie, nie wrzucaj go samemu do `dev`. Stwórz **Pull Request**.

1.  Upewnij się, że Twój kod się kompiluje i nie psuje Dockera.
2.  Skieruj Pull Request z Twojej gałęzi do gałęzi `dev`.
3.  **Code Review:** Co najmniej jedna inna osoba z zespołu musi przejrzeć kod i kliknąć "Approve".
4.  Po zatwierdzeniu robimy "Merge" (i najlepiej usuwamy zbędny już branch zadania).

## 🐳 Środowisko (Docker)

Zanim zaczniesz pracę, upewnij się, że masz odpalonego Dockera. 
W głównym folderze projektu wpisz:
```bash
docker-compose up -d
