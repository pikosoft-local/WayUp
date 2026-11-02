import axios from "axios";
import { supabase } from "./auth/supabaseClient";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

export async function apiRequest(path, { method = "GET", body, auth = true, responseType } = {}) {
  const headers = {};

  if (auth) {
    if (!supabase) {
      throw new Error("Brakuje konfiguracji Supabase. Sprawdź ustawienia VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.");
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(`Nie udało się odświeżyć sesji: ${error.message}`);
    if (!data.session?.access_token) {
      throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    }
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  try {
    const response = await axios.request({
      url: `${API_URL}${path}`,
      method,
      data: body,
      headers,
      responseType,
    });

    return response.data;
  } catch (requestError) {
    let responseError = requestError.response?.data?.error;
    if (!responseError && requestError.response?.data instanceof Blob) {
      try {
        const errorBody = JSON.parse(await requestError.response.data.text());
        responseError = errorBody.error;
      } catch {
        responseError = "";
      }
    }

    if (requestError.response?.status === 401 && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(`Sesja wygasła, a wylogowanie nie powiodło się: ${error.message}`);
      }
    }

    if (responseError) throw new Error(responseError);
    if (requestError.response?.status === 401) {
      throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    }
    throw new Error(
      requestError.message || "Nie udało się połączyć z serwerem. Spróbuj ponownie.",
    );
  }
}
