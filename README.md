# wayUp

wayUp pomaga młodym osobom odkrywać swoje mocne strony i możliwe kierunki nauki
oraz pracy. Frontend jest aplikacją React/Vite, a API działa w NestJS.

## Konfiguracja

1. Skopiuj `frontend/.env.example` do `frontend/.env.local` i uzupełnij URL
   projektu Supabase oraz jego klucz publishable/anon. Klucz publiczny może
   znaleźć się we frontendzie; klucza `service_role` nigdy tam nie umieszczaj.
2. Skopiuj `backend/.env.example` do `backend/.env` i uzupełnij URL Supabase,
   klucz `service_role` oraz klucz API Groq.
3. Uruchom migrację
   `backend/supabase/migrations/20261027000000_quiz_results.sql` na bazie
   projektu Supabase (np. w SQL Editor). Tabela łączy wynik z `auth.users`,
   a polityka RLS pozwala użytkownikowi odczytać wyłącznie jego wyniki.
4. Włącz rejestrację użytkowników w ustawieniach Authentication projektu
   Supabase. Jeśli projekt wymaga potwierdzania adresu e-mail, po rejestracji
   należy najpierw kliknąć link z wiadomości. Dodaj też adres frontendu
   (lokalnie `http://localhost:5173`) do dozwolonych adresów przekierowań Supabase.

## Uruchomienie lokalne

W osobnych terminalach:

```powershell
cd frontend
npm install
npm run dev
```

```powershell
cd backend/-way-up
npm install
npm run start:dev
```

Frontend domyślnie komunikuje się z API pod `http://localhost:3000`. Dla innego
adresu ustaw `VITE_API_URL`. Endpointy quizu wymagają sesji Supabase; wynik jest
zwracany dopiero po jego poprawnym zapisaniu na koncie. Zalogowany użytkownik
może też pobrać swoje ostatnie wyniki przez `GET /quiz-results`.
