import { useState } from "react";
import { Alert, Button, CircularProgress, TextField } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../auth/supabaseClient";

function Account() {
  const { session, loading: checkingSession, authError } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const nextPath = searchParams.get("next");
  const destination = nextPath?.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/meetYou";

  if (checkingSession) {
    return <main className="auth-page"><CircularProgress aria-label="Sprawdzam sesję" /></main>;
  }

  if (session) return <Navigate to={destination} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!supabase) {
      setError("Brakuje konfiguracji Supabase. Uzupełnij zmienne VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: authError } = isRegistering
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (authError) throw authError;
      if (isRegistering && !data.session) {
        setNotice("Konto jest prawie gotowe — sprawdź skrzynkę i potwierdź adres e-mail.");
      } else {
        navigate(destination, { replace: true });
      }
    } catch (authError) {
      setError(authError.message || "Nie udało się połączyć z kontem. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <RouterLink className="brand auth-brand" to="/">wayUp<span>.</span></RouterLink>
        <p className="eyebrow">Twoja przyszłość, bez zgadywania</p>
        <h1>{isRegistering ? "Załóż swoje konto" : "Miło Cię widzieć"}</h1>
        <p className="auth-copy">
          Zaloguj się, żeby zrobić quiz i wrócić do swoich rekomendacji.
        </p>

        {error && <Alert severity="error">{error}</Alert>}
        {authError && <Alert severity="error">{authError}</Alert>}
        {notice && <Alert severity="success">{notice}</Alert>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <TextField
            label="Adres e-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Hasło"
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            required
            slotProps={{ htmlInput: { minLength: 8 } }}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText={isRegistering ? "Co najmniej 8 znaków." : ""}
          />
          <Button type="submit" variant="contained" disabled={busy} className="primary-button">
            {busy ? "Chwilka…" : isRegistering ? "Utwórz konto" : "Zaloguj się"}
          </Button>
        </form>

        <button
          className="text-button"
          type="button"
          onClick={() => {
            setIsRegistering((current) => !current);
            setError("");
            setNotice("");
          }}
        >
          {isRegistering ? "Masz już konto? Zaloguj się" : "Nie masz konta? Zarejestruj się"}
        </button>
        <RouterLink className="back-link" to="/">← Wróć na stronę główną</RouterLink>
      </section>
    </main>
  );
}

export default Account;
