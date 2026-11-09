// Provider autoryzacji. Nasłuchuje sesji Supabase i udostępnia ją całej aplikacji.
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  // session przechowuje dane zalogowanego użytkownika albo null, gdy nikt nie jest zalogowany.
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    // Nasłuchujemy zmian logowania i wylogowania w całej aplikacji.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError("");
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) {
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        // Błąd pobierania sesji pokazujemy użytkownikowi zamiast udawać, że wszystko działa.
        if (active) {
          setAuthError("Nie udało się sprawdzić sesji. Sprawdź połączenie i spróbuj ponownie.");
          setLoading(false);
        }
      });

    return () => {
      // Po odmontowaniu komponentu przestajemy reagować na stare zdarzenia.
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}
