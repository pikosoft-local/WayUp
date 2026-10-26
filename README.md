# Logowanie

Logowanie Google robi front przez Supabase Auth (`@supabase/supabase-js`, provider `google`). Backend tylko weryfikuje token.

**dostajesz:**
- Project URL Supabase https://qonvsuvxclyumhqimhyu.supabase.co/
- publishable (anon) key sb_publishable_-Nx6RDcP2bXdP1Dxsa35xA_zzrEF5c8
**przekaż mi:**
- adresy, na które wraca logowanie (dev + prod) – trzeba je dodać w Supabase → Authentication → URL Configuration → Redirect URLs.

## Żądanie

`POST /SendHandler`

Nagłówki:
- `Content-Type: application/json`
- `Authorization: Bearer <access_token>` – świeży token z sesji Supabase, brany przy każdym żądaniu

Body: obiekt `{ "<nr pytania 0-19>": string | string[] }`

- pytania można pomijać, ale min. 1 odpowiedź musi być niepusta
- nie wysyłaj user_id ani e-maila

## Odpowiedzi

200:
```json
{ "ok": true, "result": "tekst 4 zdania", "requestId": "uuid", "saved": true }
```
`saved: false` = porada jest, ale zapis w bazie się nie udał (i tak ją pokaż).

Błędy mają postać `{ "ok": false, "error": "komunikat PL" }`:

| Kod | Znaczenie | Akcja |
|-----|-----------|-------|
| 400 | złe dane / za mało odpowiedzi | pokaż `error` |
| 401 | brak / wygasły / zły token | wyloguj, pokaż logowanie, zachowaj odpowiedzi |
| 500 | błąd generowania | pokaż `error`, pozwól ponowić |

Odpowiedź może trwać kilka sekund – blokuj przycisk wysyłki (każde wysłanie = osobny zapis).