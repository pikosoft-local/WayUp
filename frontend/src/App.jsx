// Główny komponent aplikacji. Definiuje routing i ekrany dostępne dla użytkownika.
import { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import ChooseYourDestination from "./scenes/chooseYourDestination";

// Ekrany ładowane dopiero wtedy, kiedy użytkownik naprawdę ich potrzebuje.
const MeetYou = lazy(() => import("./scenes/meetYou"));
const Account = lazy(() => import("./scenes/account"));
const Share = lazy(() => import("./scenes/share"));

function App() {
  return (
    // BrowserRouter pozwala zmieniać widoki na podstawie adresu URL.
    <BrowserRouter>
      {/* Provider udostępnia informację o zalogowaniu wszystkim ekranom. */}
      <AuthProvider>
        {/* W czasie pobierania leniwego komponentu pokazujemy pusty ekran ładowania. */}
        <Suspense fallback={<main className="loading-page" aria-label="Ładowanie" />}>
          <Routes>
            {/* Każda ścieżka wskazuje komponent, który ma zostać pokazany. */}
            <Route path="/" element={<ChooseYourDestination />} />
            <Route path="/meetYou" element={<MeetYou />} />
            <Route path="/konto" element={<Account />} />
            <Route path="/share/:token" element={<Share />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
