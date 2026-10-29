import { useState } from "react";
import { Alert, Button, CircularProgress } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { Link as RouterLink, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../auth/supabaseClient";

function Account() {
  const { session, loading: checkingSession, authError } = useAuth();
  const [searchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nextPath = searchParams.get("next");
  const destination = nextPath?.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/meetYou";

  if (checkingSession) {
    return <main className="auth-page"><CircularProgress aria-label="Sprawdzam sesję" /></main>;
  }

  if (session) return <Navigate to={destination} replace />;

  async function handleGoogleSignIn() {
    setError("");
    if (!supabase) {
      setError("Brakuje konfiguracji Supabase. Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.");
      return;
    }

    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/konto?next=${encodeURIComponent(destination)}`,
        },
      });
      if (signInError) throw signInError;
    } catch (signInError) {
      setError(signInError.message || "Nie udało się rozpocząć logowania przez Google.");
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <RouterLink className="brand auth-brand" to="/">wayUp<span>.</span></RouterLink>
        <p className="eyebrow">Twoja przyszłość, bez zgadywania</p>
        <h1>Miło Cię widzieć</h1>
        <p className="auth-copy">
          Zaloguj się, żeby zrobić quiz i wrócić do swoich rekomendacji.
        </p>

        {error && <Alert severity="error">{error}</Alert>}
        {authError && <Alert severity="error">{authError}</Alert>}

        <Button
          variant="contained"
          disabled={busy}
          className="primary-button google-button"
          onClick={handleGoogleSignIn}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
        >
          {busy ? "Łączenie z Google…" : "Kontynuuj z Google"}
        </Button>

        <p className="auth-privacy">
          Twoje odpowiedzi i rekomendacje będą przypisane do Twojego konta.
        </p>
        <RouterLink className="back-link" to="/">← Wróć na stronę główną</RouterLink>
      </section>
    </main>
  );
}

export default Account;
