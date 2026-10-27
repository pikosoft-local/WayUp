import { Link } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import { useAuth } from "../auth/useAuth";
import mineImage from "../assets/goldminingstart.jpg";

const steps = [
  {
    icon: <ExploreRoundedIcon />,
    number: "01",
    title: "Poznaj swój styl",
    description: "Odpowiedz na pytania o to, co Cię ciekawi i jak lubisz działać.",
  },
  {
    icon: <AutoAwesomeRoundedIcon />,
    number: "02",
    title: "Odkryj możliwości",
    description: "Zobacz kierunki dopasowane do Twoich mocnych stron i wartości.",
  },
  {
    icon: <RouteRoundedIcon />,
    number: "03",
    title: "Zrób pierwszy krok",
    description: "Dostaniesz konkretny pomysł, jak sprawdzić wybraną ścieżkę.",
  },
];

function ChooseYourDestination() {
  const { session } = useAuth();
  const startPath = session ? "/meetYou" : "/konto?next=/meetYou";

  return (
    <main className="landing-page">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="wayUp — strona główna">
          wayUp<span>.</span>
        </Link>
        <nav className="header-nav" aria-label="Nawigacja główna">
          <a href="#jak-to-dziala">Jak to działa</a>
          <a href="#dla-kogo">Dla kogo</a>
          <Link className="header-account" to={session ? "/meetYou" : "/konto"}>
            {session ? "Mój quiz" : "Zaloguj się"}
          </Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Twój kierunek zaczyna się tutaj</p>
          <h1>
            Nie musisz mieć
            <br />
            <span>planu na całe życie.</span>
          </h1>
          <p className="hero-description">
            Wystarczy pierwszy krok. Odkryj, co naprawdę Cię napędza, i znajdź
            ścieżki, które pasują do Ciebie — nie do cudzych oczekiwań.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" to={startPath}>
              Znajdź swój kierunek <ArrowForwardRoundedIcon />
            </Link>
            <span className="hero-note">20 pytań · około 5 minut · zero oceniania</span>
          </div>
          <div className="hero-proof">
            <TrackChangesRoundedIcon />
            <span>Twoje zainteresowania. Twoje tempo. Twoja droga.</span>
          </div>
        </div>
        <div className="hero-visual">
          <img src={mineImage} alt="Wejście do kopalni — początek poszukiwania własnej drogi" />
          <div className="visual-caption">
            <span className="caption-dot" />
            <div>
              <strong>Każdy ma swoją żyłę złota.</strong>
              <span>Znajdź to, co jest Twoje.</span>
            </div>
          </div>
          <div className="visual-index">WAYUP / 01</div>
        </div>
        <div className="hero-scroll"><span /> przewiń, żeby poznać szczegóły</div>
      </section>

      <section className="intro-section" id="dla-kogo">
        <div className="section-label">Nie test. Początek rozmowy.</div>
        <h2>
          Przyszłość nie jest gotową mapą.
          <br />
          <span>Możesz ją narysować po swojemu.</span>
        </h2>
        <p>
          Wybór szkoły, studiów czy pierwszej pracy potrafi przytłoczyć. wayUp
          pomaga zamienić „nie wiem” w kilka sensownych możliwości i mały,
          możliwy do zrobienia plan. Bez presji, bez etykietek i bez jednej
          „idealnej” odpowiedzi.
        </p>
      </section>

      <section className="steps-section" id="jak-to-dziala">
        <div className="steps-heading">
          <div>
            <div className="section-label">Twoja droga w trzech krokach</div>
            <h2>Zacznij od ciekawości.</h2>
          </div>
          <Link className="secondary-link" to={startPath}>
            Brzmi dobrze? Zaczynam <ArrowForwardRoundedIcon />
          </Link>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="step-top">
                <span className="step-icon">{step.icon}</span>
                <span className="step-number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-section">
        <div>
          <div className="section-label">Mały krok też jest krokiem</div>
          <h2>Sprawdź, co może być Twoje.</h2>
        </div>
        <Link className="primary-link" to={startPath}>
          Ruszajmy <ArrowForwardRoundedIcon />
        </Link>
      </section>

      <footer className="site-footer">
        <Link className="brand" to="/">wayUp<span>.</span></Link>
        <span>Pomagamy młodym odkrywać własną drogę.</span>
        <span>Projekt HackHeroes</span>
      </footer>
    </main>
  );
}

export default ChooseYourDestination;
