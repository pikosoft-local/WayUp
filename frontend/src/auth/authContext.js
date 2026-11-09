// Kontekst Reacta przechowujący dane i akcje dotyczące logowania.
import { createContext } from "react";

export const AuthContext = createContext({
  // Wartości domyślne chronią komponenty używające kontekstu przed undefined.
  session: null,
  loading: true,
  authError: "",
});
