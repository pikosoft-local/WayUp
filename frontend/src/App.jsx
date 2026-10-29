import { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import ChooseYourDestination from "./scenes/chooseYourDestination";

const MeetYou = lazy(() => import("./scenes/meetYou"));
const Account = lazy(() => import("./scenes/account"));
const Share = lazy(() => import("./scenes/share"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<main className="loading-page" aria-label="Ładowanie" />}>
          <Routes>
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
