// Konfiguracja klienta Supabase używanego do logowania i odświeżania sesji.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Klient Supabase powstaje tylko wtedy, gdy frontend ma obie wymagane zmienne środowiskowe.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
