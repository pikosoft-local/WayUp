# wayUp API

Backend aplikacji wayUp zbudowany w NestJS i TypeScript.

## Konfiguracja

Utwórz lokalny plik `.env`:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

Klucze serwisowe i klucz Groq są sekretami backendu. Nie umieszczaj ich
we frontendzie ani w repozytorium.

## Uruchomienie lokalne

```powershell
npm install
npm run start:dev
```

API działa domyślnie pod `http://localhost:3000/api`.

## Build i testy

```powershell
npm run build
npm test
```

Testy używają wbudowanego test runnera Node.js i nie wymagają dodatkowych
zależności testowych.

## API

Kontrakty endpointów i przykładowe odpowiedzi znajdują się w
[`API.md`](./API.md).
