// Hook pozwalający komponentom korzystać z kontekstu autoryzacji.
import { useContext } from "react";
import { AuthContext } from "./authContext";

export function useAuth() {
  // Ten hook skraca dostęp do danych udostępnionych przez AuthProvider.
  return useContext(AuthContext);
}
