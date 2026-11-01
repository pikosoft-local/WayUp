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

## Konfiguracja lokalna

Skopiuj `frontend/.env.example` do `frontend/.env.local` i uzupełnij
konfigurację publiczną:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Skopiuj `backend/-way-up/.env.example` do `backend/-way-up/.env` i uzupełnij
sekrety po stronie serwera:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

Nigdy nie umieszczaj `SUPABASE_SERVICE_ROLE_KEY` ani `GROQ_API_KEY` w
zmiennych `VITE_*` ani w kodzie frontendu.

## Uruchomienie

Uruchom API i frontend w osobnych terminalach:

```powershell
cd backend/-way-up
npm install
npm run start:dev
```

```powershell
cd frontend
npm install
npm run dev
```

Frontend domyślnie działa pod `http://localhost:5173`, a API pod
`http://localhost:3000/api`.

## Weryfikacja

```powershell
cd frontend
npm run lint
npm run build
```

```powershell
cd backend/-way-up
npm run build
npm test
```

## Wdrożenie na Vercel

Utwórz dwa projekty Vercel połączone z tym repozytorium:

1. Frontend — Root Directory: `frontend`
2. Backend — Root Directory: `backend/-way-up`

W projekcie frontendu ustaw `VITE_API_URL` na adres API zakończony `/api`
oraz publiczne `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`. W projekcie
backendu ustaw `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` i `GROQ_API_KEY`.
Po zmianie zmiennych `VITE_*` wykonaj ponowne wdrożenie frontendu.

Szczegóły endpointów API opisuje [`backend/-way-up/API.md`](backend/-way-up/API.md).
