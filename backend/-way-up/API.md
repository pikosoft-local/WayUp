# API quizu – instrukcja dla frontu

## Autoryzacja

Logowanie Google robi front przez Supabase Auth (`@supabase/supabase-js`, provider `google`). Backend tylko weryfikuje token.

- Od backendu dostajesz: Project URL Supabase (bez `/rest/v1`), publishable (anon) key, adres API.
- Backendowi przekaż adresy powrotu po logowaniu (dev + prod) – trzeba je dodać w Supabase → Authentication → URL Configuration → Redirect URLs.
- Nigdy nie używaj klucza `service_role`.
- Każde żądanie oznaczone 🔒 wymaga nagłówka `Authorization: Bearer <access_token>` (świeży token z sesji Supabase, brany przy każdym żądaniu).
- Nie wysyłaj user_id ani e-maila – backend bierze użytkownika z tokenu.

## Błędy (wszystkie endpointy)

Zawsze `{ "ok": false, "error": "komunikat PL" }`.

| Kod | Znaczenie | Akcja |
|-----|-----------|-------|
| 400 | złe dane / limit | pokaż `error` |
| 401 | brak / wygasły token | wyloguj, pokaż logowanie, zachowaj odpowiedzi |
| 404 | nie ma zasobu lub nie należy do użytkownika | pokaż `error` |
| 429 | limit wiadomości do mentora (50 na wynik) | pokaż `error` |
| 500 | błąd generowania AI / bazy | pokaż `error`, pozwól ponowić |
| 503 | niedostępna wyszukiwarka lub brak konfiguracji aktualności | pokaż `error`, pozwól ponowić |

## Endpointy

| | Endpoint | Opis |
|---|---|---|
| | `GET /questions` | pytania quizu |
| | `GET /news` | niepolityczne aktualności dla młodych, streszczone przez AI |
| 🔒 | `POST /questions/follow-up` | pytanie dodatkowe od AI (opcjonalne) |
| 🔒 | `POST /SendHandler` | wysłanie quizu → porada + profil |
| 🔒 | `GET /results` | lista moich wyników |
| 🔒 | `GET /results/:id` | jeden wynik |
| 🔒 | `POST /results/:id/share` | włącz udostępnianie → token |
| 🔒 | `DELETE /results/:id/share` | wyłącz udostępnianie |
| | `GET /share/:token` | publiczna karta wyniku |
| 🔒 | `GET /compare/:token` | porównanie z udostępnionym wynikiem |
| 🔒 | `GET /results/:id/gap-analysis?pathType=` | dopasowanie umiejętności do ścieżki |
| 🔒 | `GET /results/:id/pdf` | raport PDF do pobrania |
| 🔒 | `GET /results/:id/chat?pathType=` | historia rozmowy z mentorem |
| 🔒 | `POST /results/:id/chat` | wiadomość do mentora |

`:id` to UUID (`requestId` z `SendHandler`).

## Aktualności – `GET /news`

Publiczny endpoint pobiera świeże wpisy z kanałów RSS serwisów edukacyjnych i technologicznych, a Groq tworzy na ich podstawie krótkie omówienia. Backend zachowuje link do oryginalnego źródła; tematy polityczne są odrzucane przed i po generowaniu. Wynik jest buforowany przez godzinę. Odwiedzający stronę nie potrzebują klucza wyszukiwarki ani własnej konfiguracji.

Wymagany jest wyłącznie skonfigurowany po stronie serwera `GROQ_API_KEY`. Groq nie przegląda sieci samodzielnie — wbudowany system web search Compound został wycofany 21 września 2026 r.; backend dostarcza mu dane z kanałów RSS.

Odpowiedź:

```json
{
  "ok": true,
  "articles": [
    {
      "id": "https://example.com/artykul",
      "title": "Tytuł artykułu",
      "excerpt": "Krótki wstęp",
      "content": "Treść pierwszego akapitu.\n\nTreść kolejnego akapitu.",
      "category": "Edukacja",
      "sourceTitle": "Tytuł materiału źródłowego",
      "sourceName": "Perspektywy",
      "sourceUrl": "https://example.com/artykul",
      "publishedAt": "2026-10-29T10:00:00.000Z"
    }
  ]
}
```

## Pytania – `GET /questions`

```json
{
  "ok": true,
  "version": 1,
  "slider": { "min": 0, "max": 100 },
  "maxFollowUps": 3,
  "blocks": [
    {
      "id": 1,
      "title": "Na start",
      "questions": [
        { "id": "0", "type": "choice", "text": "...", "options": [{ "id": "liceum", "label": "Liceum" }] },
        { "id": "2", "type": "slider", "text": "...", "minLabel": "Ludzie", "maxLabel": "Komputery" },
        { "id": "5", "type": "multi", "text": "...", "options": [{ "id": "gry", "label": "Gram w gry" }] },
        { "id": "1", "type": "text", "text": "..." }
      ]
    }
  ]
}
```

20 pytań (id `"0"`–`"19"`), 4 bloki po 5. Typy: `text` (pole tekstowe), `choice` (jedna opcja), `multi` (kilka opcji), `slider` (suwak 0–100 z opisami końców). Pytania są publiczne, więc można je pobrać przed logowaniem. `version` zmienia się po zmianie pytań.

## Wysyłka quizu – 🔒 `POST /SendHandler`

Body (`Content-Type: application/json`):

```json
{
  "answers": { "0": "liceum", "2": "70", "5": ["gry", "sport"], "1": "Minecraft" },
  "followUps": [{ "question": "Co Cię kręci w grach?", "answer": "Mechaniki" }]
}
```

Format odpowiedzi w `answers` (klucz = `id` pytania):

| typ pytania | wartość |
|---|---|
| `text` | tekst |
| `choice` | `id` wybranej opcji |
| `multi` | tablica `id` opcji |
| `slider` | liczba 0–100 **jako tekst** (`"70"`) |

- Pytania można pomijać, ale min. 1 odpowiedź musi być niepusta.
- Limity: tekst max 500 znaków, tablica max 20 elementów, nieznane `id` → 400.
- `followUps` jest opcjonalne (max 3). Dla pytania z `choice` wyślij **etykietę** wybranej opcji jako `answer`.
- Dopuszczalny jest też stary, płaski format (sam obiekt `answers` bez opakowania).

Odpowiedź 200:

```json
{
  "ok": true,
  "result": "porada w 4 zdaniach (język młodzieżowy)",
  "requestId": "uuid",
  "saved": true,
  "profile": { }
}
```

- `saved: false` – porada jest, ale zapis w bazie się nie udał (i tak ją pokaż; wtedy `/results` jej nie będzie).
- `profile` może być `null`, jeśli AI nie zwróciło poprawnego profilu (backend próbuje 2 razy) – ukryj wtedy sekcje profilu, `result` nadal jest.
- Wysyłka trwa kilka–kilkanaście sekund: pokaż loader i zablokuj przycisk (każde wysłanie = osobny zapis).

### Obiekt `profile`

```json
{
  "archetype": { "name": "Cichy Architekt", "tagline": "Twoja supermoc to..." },
  "traits": [
    { "key": "creativity", "label": "Kreatywność", "value": 80 }
  ],
  "explanation": "dlaczego ten profil pasuje",
  "paths": [
    {
      "type": "safe",
      "title": "Programista",
      "description": "...",
      "whyFit": "...",
      "salaryPln": { "min": 6000, "max": 12000 },
      "outlook": "...",
      "automationRisk": "low"
    }
  ],
  "skills": { "hard": ["..."], "soft": ["..."] },
  "roadmap": {
    "forPath": "safe",
    "months3": ["..."],
    "months6": ["..."],
    "months12": ["..."]
  },
  "learningAreas": [{ "area": "Bazy danych", "why": "..." }],
  "disclaimer": "Widełki zarobkowe ... to szacunki AI ..."
}
```

- `traits`: zawsze 6 cech w stałej kolejności (`creativity`, `analytical`, `stress_resilience`, `leadership`, `empathy`, `independence`), wartości 0–100 → wykres radarowy.
- `paths`: zawsze 3, w kolejności `safe` (klasyczna), `surprising` (niszowa), `future` (przyszłościowa).
- `salaryPln`: miesięcznie brutto w PLN. `automationRisk`: `low` / `medium` / `high`.
- `roadmap.forPath`: dla której ścieżki jest plan 3/6/12 miesięcy.
- `roadmap.months3` / `months6` / `months12`: każda lista ma **od 1 do 4 kroków** (AI bywa skąpe – nie zakładaj, że zawsze będą co najmniej 2). Renderuj dowolną liczbę elementów, a pustej listy się nie spodziewaj.
- `skills.hard` / `skills.soft`: 3–6 elementów. `learningAreas`: 3–5 elementów.
- **Pokaż `disclaimer` przy widełkach i perspektywach** – to szacunki AI, nie dane rynkowe.
- `learningAreas` to obszary nauki, nie linki.

## Pytanie dodatkowe – 🔒 `POST /questions/follow-up`

Body jak w `SendHandler` (dotychczasowe `answers` + ewentualne `followUps`). Odpowiedź 200:

```json
{ "ok": true, "question": { "id": "f1", "type": "choice", "text": "...", "options": [{ "id": "o1", "label": "Fabuła" }] } }
```

`type` to `text` albo `choice` (`options` tylko dla `choice`). `id` to `f1`…`f3` (kolejne według liczby `followUps` w body). Max 3; przy limicie 400. Po odpowiedzi użytkownika dodaj parę `{question: text, answer}` do `followUps` i wyślij całość w `SendHandler`. Funkcja opcjonalna – przy błędzie 500 po prostu pomiń.

## Wyniki

🔒 `GET /results` →

```json
{ "ok": true, "items": [{ "id": "uuid", "createdAt": "ISO", "archetype": { "name": "...", "tagline": "..." }, "shared": false }] }
```

Od najnowszego, max 50. `archetype` jest `null` dla wyniku bez profilu.

🔒 `GET /results/:id` →

```json
{
  "ok": true, "id": "uuid", "createdAt": "ISO", "result": "porada",
  "answers": [{ "id": "2", "question": "Ludzie czy komputery", "answer": "70", "answerText": "70/100 (0 = Ludzie, 100 = Komputery)" }],
  "profile": { }, "shareToken": null
}
```

## Analiza luk – 🔒 `GET /results/:id/gap-analysis?pathType=safe`

`pathType`: `safe` / `surprising` / `future` (domyślnie `safe`). Odpowiedź 200:

```json
{
  "ok": true,
  "pathType": "safe",
  "pathTitle": "Programista",
  "matchPercentage": 50,
  "acquiredSkills": ["..."],
  "missingSkills": ["..."],
  "recommendation": "Aby w pełni dopasować się do ścieżki ..., warto w pierwszej kolejności skupić się na: ..."
}
```

- `matchPercentage` 0–100: odsetek umiejętności twardych z profilu, które pojawiają się w odpowiedziach użytkownika (proste dopasowanie tekstu, więc traktuj jako orientacyjne, nie jako ocenę). Gdy profil nie ma umiejętności twardych, zwraca 50.
- Wynik bez `profile` albo nieznana ścieżka → 404.

## Raport PDF – 🔒 `GET /results/:id/pdf`

Zwraca plik `application/pdf` (nagłówek `Content-Disposition: attachment; filename=profil-kariery-<id>.pdf`), a **nie** JSON. Ponieważ wymaga nagłówka `Authorization`, nie wystarczy zwykły link `<a href>`: pobierz przez `fetch` z tokenem, zamień odpowiedź na `blob` i wywołaj pobieranie (`URL.createObjectURL`).

Raport ma okładkę (strona 1) i stronę z treścią: archetyp, podsumowanie, ścieżki kariery z widełkami i kompetencje. Przy dużej ilości treści może mieć więcej stron. Wynik bez `profile` → 404 (w formacie błędu JSON, więc sprawdź `Content-Type` przed zapisem pliku).

## Udostępnianie i porównanie

- 🔒 `POST /results/:id/share` → `{ "ok": true, "shareToken": "..." }`. Wywołanie powtórne zwraca ten sam token. Wymaga, by wynik miał `profile`.
- 🔒 `DELETE /results/:id/share` → `{ "ok": true }`. Stary link przestaje działać (404).
- Link do wysłania znajomemu buduje front, np. `https://twoja-apka/share/<shareToken>`.
- `GET /share/:token` (publiczne, bez logowania) →

```json
{ "ok": true, "card": { "archetype": { }, "traits": [ ], "paths": [{ "type": "safe", "title": "..." }], "createdAt": "ISO" } }
```

Karta nie zawiera odpowiedzi z quizu ani danych konta – tylko to, co widać powyżej. Z tych danych front rysuje kartę/wizytówkę do social mediów (obraz generuje front, backend go nie robi).

- 🔒 `GET /compare/:token[?resultId=uuid]` – porównuje **mój** wynik (domyślnie najnowszy z profilem, albo wskazany `resultId`) z udostępnionym przez znajomego:

```json
{
  "ok": true,
  "score": 77,
  "level": "medium",
  "traits": [{ "key": "creativity", "label": "Kreatywność", "me": 80, "friend": 60, "diff": 20 }],
  "mostSimilar": { "key": "leadership", "label": "Przywództwo" },
  "mostDifferent": { "key": "independence", "label": "Samodzielność" },
  "me": { "archetype": { } },
  "friend": { "archetype": { } }
}
```

`score` 0–100 (100 = identyczne cechy), `level`: `high` (≥80), `medium` (60–79), `low`. Gdy użytkownik nie ma jeszcze wyniku → 404 z komunikatem "Najpierw wypełnij quiz…" (przekieruj do quizu).

## Mentor AI

Rozmowa z AI wcielającym się w mentora wybranej ścieżki. Każda para (wynik, `pathType`) ma osobny wątek z historią.

- 🔒 `POST /results/:id/chat`, body: `{ "pathType": "safe", "message": "Jak wygląda typowy dzień?" }` (`pathType`: `safe` / `surprising` / `future`, wiadomość 1–1000 znaków) →

```json
{ "ok": true, "reply": "odpowiedź mentora", "pathType": "safe", "saved": true }
```

- 🔒 `GET /results/:id/chat?pathType=safe` →

```json
{ "ok": true, "messages": [{ "role": "user", "content": "...", "createdAt": "ISO" }, { "role": "assistant", "content": "...", "createdAt": "ISO" }] }
```

Od najstarszej, do 200 ostatnich. Mentor przedstawia się jako AI. Odpowiedź trwa kilka sekund – pokaż wskaźnik pisania. Limit 50 wiadomości użytkownika na wynik (potem 429). Wynik bez `profile` → 400.

## Checklista frontu

- [ ] Logowanie Google (Supabase), token w nagłówku każdego żądania 🔒
- [ ] Pytania renderowane z `GET /questions` (4 typy, w tym suwak i multi)
- [ ] Format odpowiedzi: `choice` = id opcji, `multi` = tablica id, `slider` = tekst z liczbą
- [ ] Obsługa `profile: null` i `saved: false`
- [ ] Widok profilu: archetyp, radar z `traits`, 3 ścieżki, roadmapa (1–4 kroki na etap), umiejętności, `disclaimer`
- [ ] Analiza luk per ścieżka (`gap-analysis`)
- [ ] Pobieranie PDF przez `fetch` z tokenem (blob), nie zwykłym linkiem
- [ ] Udostępnianie: token → link, publiczna strona `/share/:token`, porównanie
- [ ] Czat z mentorem per ścieżka
- [ ] Obsługa kodów 400 / 401 / 404 / 429 / 500, loader przy `SendHandler` i czacie