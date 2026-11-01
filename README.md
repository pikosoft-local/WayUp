# wayUp

wayUp pomaga młodym osobom odkrywać mocne strony i możliwe kierunki nauki
oraz pracy. Aplikacja łączy quiz, rekomendacje AI, konto użytkownika,
zapisywanie wyników i aktualności dla młodych.

## Technologie

- Frontend: React, Vite, JavaScript
- Backend: NestJS, TypeScript
- Konto i przechowywanie wyników: Supabase
- Generowanie treści AI: Groq
- Hosting: Vercel

## Struktura projektu

- `frontend/` — aplikacja React
- `backend/-way-up/` — API NestJS

## Pierwsze uruchomienie (Windows)

Zainstaluj Node.js 22 LTS, sklonuj repozytorium i otwórz PowerShell
w katalogu `WayUp`.

1. Zainstaluj narzędzie uruchamiające oba serwery:

   ```powershell
   npm install
   ```

2. Zainstaluj zależności frontendu i backendu:

   ```powershell
   npm run setup
   ```

3. Utwórz lokalne pliki konfiguracji:

   ```powershell
   Copy-Item frontend\.env.example frontend\.env.local
   Copy-Item backend\-way-up\.env.example backend\-way-up\.env
   ```

4. Uzupełnij wartości w obu plikach. W Supabase włącz logowanie Google
   i dodaj `http://localhost:5173/konto` do dozwolonych adresów OAuth.
   Jeśli port 5173 jest zajęty, dodaj również
   `http://localhost:5174/konto`.
5. Uruchom aplikację i API jednym poleceniem:

   ```powershell
   npm run dev
   ```

Frontend otworzy się pod `http://localhost:5173`, a API będzie dostępne pod
`http://localhost:3000/api`. Zatrzymaj oba serwery klawiszami `Ctrl+C`.

### Zmienne frontendu — `frontend/.env.local`

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Zmienne backendu — `backend/-way-up/.env`

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

Nigdy nie umieszczaj `SUPABASE_SERVICE_ROLE_KEY` ani `GROQ_API_KEY` w
zmiennych `VITE_*` ani w kodzie frontendu.

Do uruchomienia całej aplikacji potrzebujesz konfiguracji Supabase i klucza
Groq. Sam frontend, bez API, uruchomisz poleceniem
`npm --prefix frontend run dev`; logowanie, quiz i aktualności wymagają wtedy
działającego backendu.

## Weryfikacja

```powershell
npm run lint
npm run build
```

```powershell
npm run test:backend
```

## Wdrożenie na Vercel

Utwórz dwa projekty Vercel połączone z tym repozytorium. Dla frontendu ustaw
Root Directory `frontend`, a dla API `backend/-way-up`:

- Frontend: `VITE_API_URL` ustaw na adres API zakończony `/api`, a także
  skonfiguruj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`.
- Backend: skonfiguruj `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  i `GROQ_API_KEY`.

Po zmianie zmiennych `VITE_*` wykonaj ponowne wdrożenie frontendu. Szczegóły
endpointów API opisuje [`backend/-way-up/API.md`](backend/-way-up/API.md).
