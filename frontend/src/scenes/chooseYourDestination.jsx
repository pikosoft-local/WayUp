import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import { useAuth } from "../auth/useAuth";
import { apiRequest } from "../api";
import goldVeinImage from "../assets/bg_gold.jpg";
import goldVaultImage from "../assets/bg_gold2.jpg";
import mineEntranceImage from "../assets/goldminingstart.jpg";
import trailImage from "../assets/obj321.jpg";

const steps = [
  {
    icon: <ExploreRoundedIcon />,
    number: "01",
    title: "Poznaj swój styl",
    description: "Odpowiedz na pytania o to, co Cię ciekawi i jak lubisz działać.",
    image: mineEntranceImage,
    imageAlt: "Stare wejście do kopalni — początek własnej trasy",
    imageLabel: "wejście / pierwszy trop",
  },
  {
    icon: <AutoAwesomeRoundedIcon />,
    number: "02",
    title: "Odkryj możliwości",
    description: "Zobacz kierunki dopasowane do Twoich mocnych stron i wartości.",
    image: goldVaultImage,
    imageAlt: "Złote sztabki symbolizujące ukryte możliwości",
    imageLabel: "pokład / twoje zasoby",
  },
  {
    icon: <RouteRoundedIcon />,
    number: "03",
    title: "Zrób pierwszy krok",
    description: "Dostaniesz konkretny pomysł, jak sprawdzić wybraną ścieżkę.",
    image: trailImage,
    imageAlt: "Droga przez górską miejscowość o świcie",
    imageLabel: "szlak / ruch naprzód",
  },
];

const team = [
  {
    initials: "PG",
    name: "Paweł Gilewicz",
    role: "Frontendowiec",
    description:
      "Przekłada pomysły wayUp na doświadczenie, z którego młodym po prostu dobrze się korzysta.",
    photoLabel: "Miejsce na zdjęcie Pawła Gilewicza",
  },
  {
    initials: "JZ",
    name: "Jakub Zabłocki",
    role: "Backendowiec",
    description:
      "Dba o zaplecze, które łączy odpowiedzi, sztuczną inteligencję i rekomendacje w jeden spójny wynik.",
    photoLabel: "Miejsce na zdjęcie Jakuba Zabłockiego",
  },
];

function formatDate(value) {
  if (!value) return "Najnowsze";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Najnowsze";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function NewsSection() {
  const [news, setNews] = useState({ status: "loading", articles: [], message: "" });
  const [retry, setRetry] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const articleDialogRef = useRef(null);
  const articleCloseRef = useRef(null);
  const articleOpenerRef = useRef(null);

  useEffect(() => {
    let active = true;

    apiRequest("/news", { auth: false })
      .then((response) => {
        if (!response?.ok || !Array.isArray(response.articles)) {
          throw new Error(response?.error || "Nie udało się pobrać aktualności.");
        }
        if (active) setNews({ status: "ready", articles: response.articles, message: "" });
      })
      .catch((error) => {
        if (active) {
          setNews({
            status: "error",
            articles: [],
            message: error.message || "Nie udało się pobrać aktualności.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [retry]);

  function retryLoadingNews() {
    setNews({ status: "loading", articles: [], message: "" });
    setRetry((value) => value + 1);
  }

  useEffect(() => {
    if (!selectedArticle) return undefined;

    articleCloseRef.current?.focus();

    function handleDialogKeys(event) {
      if (event.key === "Escape") {
        setSelectedArticle(null);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = articleDialogRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.removeEventListener("keydown", handleDialogKeys);
      articleOpenerRef.current?.focus();
    };
  }, [selectedArticle]);

  return (
    <motion.section
      className="news-section"
      id="aktualnosci"
      aria-labelledby="news-title"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <div className="news-heading">
        <div>
          <p className="section-label">Świat młodych, bez politycznego szumu</p>
          <h2 id="news-title">Co nowego na Twojej drodze?</h2>
        </div>
        <p className="news-intro">
          Krótkie, tworzone z pomocą AI omówienia trendów w edukacji, pracy i
          technologiach. Każdy tekst prowadzi do oryginalnego źródła.
        </p>
      </div>

      {news.status === "loading" && (
        <div className="news-message" role="status">
          <span className="news-loader" />
          Szukamy świeżych tematów dla młodych…
        </div>
      )}

      {news.status === "error" && (
        <div className="news-message news-error" role="alert">
          <p>{news.message}</p>
          <button className="text-button" type="button" onClick={retryLoadingNews}>
            Spróbuj ponownie
          </button>
        </div>
      )}

      {news.status === "ready" && news.articles.length === 0 && (
        <div className="news-message">
          Na dziś nie znaleźliśmy bezpiecznych, niepolitycznych tematów. Wróć
          później po kolejną porcję inspiracji.
        </div>
      )}

      {news.status === "ready" && news.articles.length > 0 && (
        <div className="news-grid">
          {news.articles.map((article, index) => (
            <motion.article
              className={`news-card news-card-${index % 3}`}
              key={article.id || article.sourceUrl}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              whileHover={{ y: -5 }}
            >
              <div className="news-card-top">
                <span className="news-category">{article.category}</span>
                <time dateTime={article.publishedAt || undefined}>
                  {formatDate(article.publishedAt)}
                </time>
              </div>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
              <div className="news-card-bottom">
                <span>{article.sourceName}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    articleOpenerRef.current = event.currentTarget;
                    setSelectedArticle(article);
                  }}
                >
                  Czytaj więcej <ArrowForwardRoundedIcon />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            className="article-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedArticle(null);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.article
              ref={articleDialogRef}
              className="article-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="article-title"
              tabIndex={-1}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className="article-close"
                ref={articleCloseRef}
                type="button"
                aria-label="Zamknij artykuł"
                onClick={() => setSelectedArticle(null)}
              >
                <CloseRoundedIcon />
              </button>
              <div className="news-card-top">
                <span className="news-category">{selectedArticle.category}</span>
                <time dateTime={selectedArticle.publishedAt || undefined}>
                  {formatDate(selectedArticle.publishedAt)}
                </time>
              </div>
              <h2 id="article-title">{selectedArticle.title}</h2>
              <p className="article-excerpt">{selectedArticle.excerpt}</p>
              <div className="article-content">
                {(selectedArticle.content || "").split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
                ))}
              </div>
              <a
                className="article-source"
                href={selectedArticle.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Źródło: {selectedArticle.sourceName} <ArrowOutwardRoundedIcon />
              </a>
              <p className="article-disclaimer">
                Tekst opracowany z pomocą AI na podstawie materiału źródłowego.
                Sprawdź źródło, jeśli temat ma wpływ na Twoje decyzje.
              </p>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

const scrollStops = [
  { id: "main-content", short: "Start", label: "Początek wyprawy" },
  { id: "dla-kogo", short: "Sens", label: "Dlaczego wayUp" },
  { id: "jak-to-dziala", short: "Trasa", label: "Jak to działa" },
  { id: "aktualnosci", short: "Wieści", label: "Aktualności" },
  { id: "zespol", short: "Ludzie", label: "Zespół" },
  { id: "stopka", short: "Finał", label: "Informacje i kontakt" },
];

function ScrollGuide() {
  const [activeStop, setActiveStop] = useState(scrollStops[0].id);
  const [progress, setProgress] = useState(0);
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    let frame = 0;
    const updateScrollState = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
        setShowTopButton(window.scrollY > 560);

        const currentStop = [...scrollStops].reverse().find(({ id }) => {
          const section = document.getElementById(id);
          return section && section.getBoundingClientRect().top <= window.innerHeight * 0.42;
        });
        if (currentStop) setActiveStop(currentStop.id);
      });
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div
        className="scroll-progress"
        role="progressbar"
        aria-label="Postęp wyprawy przez stronę"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        style={{ "--scroll-progress": `${progress * 100}%` }}
      />
      <nav className="scroll-guide" aria-label="Trasa po stronie">
        <span className="scroll-guide-caption">TRASA</span>
        <div className="scroll-guide-stops">
          {scrollStops.map((stop, index) => (
            <a
              className={`scroll-guide-stop${activeStop === stop.id ? " is-active" : ""}`}
              href={`#${stop.id}`}
              key={stop.id}
              aria-label={`${String(index + 1).padStart(2, "0")} — ${stop.label}`}
              aria-current={activeStop === stop.id ? "location" : undefined}
            >
              <span className="scroll-guide-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="scroll-guide-label">{stop.short}</span>
            </a>
          ))}
        </div>
        <span className="scroll-guide-end">DÓŁ</span>
      </nav>
      <AnimatePresence>
        {showTopButton && (
          <motion.a
            className="back-to-top"
            href="#main-content"
            aria-label="Wróć na początek strony"
            initial={{ opacity: 0, y: 12, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            whileHover={{ y: -3 }}
          >
            <KeyboardArrowUpRoundedIcon />
            <span>GÓRA</span>
          </motion.a>
        )}
      </AnimatePresence>
    </>
  );
}

function PrivacyCenter({ activeTab, onTabChange, onClose, openerRef }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    const opener = openerRef.current;
    document.body.style.overflow = "hidden";

    function handleDialogKeys(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.removeEventListener("keydown", handleDialogKeys);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose, openerRef]);

  const tabs = [
    { id: "privacy", label: "Prywatność" },
    { id: "cookies", label: "Cookies" },
    { id: "marketing", label: "Marketing" },
  ];

  return (
    <motion.div
      className="privacy-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        ref={dialogRef}
        className="privacy-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <div className="privacy-dialog-heading">
          <div>
            <p className="section-label">Stacja informacyjna / 04</p>
            <h2 id="privacy-title">Prywatność bez drobnego druku.</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="article-close"
            type="button"
            aria-label="Zamknij centrum prywatności"
            onClick={onClose}
          >
            <CloseRoundedIcon />
          </button>
        </div>
        <div className="privacy-draft-note" role="note">
          Wersja robocza — przed publicznym uruchomieniem wymaga weryfikacji
          podstaw prawnych, okresów przechowywania i dostawców usług.
        </div>
        <div className="privacy-tabs" role="tablist" aria-label="Informacje o prywatności">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "is-active" : ""}
              id={`privacy-tab-${tab.id}`}
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          className="privacy-tab-panel"
          id={`privacy-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`privacy-tab-${activeTab}`}
          tabIndex={0}
        >
          {activeTab === "privacy" && (
            <>
              <h3>Kto odpowiada za dane?</h3>
              <p>
                Administratorem wskazanym dla projektu jest <strong>Gilusoft — Paweł
                Gilewicz</strong>. Kontakt w sprawach prywatności:{" "}
                <a href="mailto:pawelgilewicz2009@gmail.com">pawelgilewicz2009@gmail.com</a>.
              </p>
              <h3>Jakie dane przetwarza wayUp?</h3>
              <p>
                Przy logowaniu przetwarzane są dane konta przekazane przez
                Supabase Auth. Odpowiedzi quizu i wygenerowane wyniki są wysyłane
                do backendu wayUp, który korzysta z Supabase do zapisu wyników
                oraz z Groq do generowania odpowiedzi AI. Wpisy w sekcji
                aktualności są tworzone przez AI na podstawie publicznych
                kanałów RSS.
              </p>
              <h3>Co trzeba uzupełnić przed publikacją?</h3>
              <p>
                Podstawę prawną i okres przechowywania danych, zasady dotyczące
                osób niepełnoletnich, lokalizacje i warunki przetwarzania u
                dostawców oraz procedurę realizacji praw użytkownika. Nie
                przesyłaj w quizie danych wrażliwych ani informacji, których nie
                chcesz przekazywać do usługi AI.
              </p>
            </>
          )}
          {activeTab === "cookies" && (
            <>
              <h3>Niezbędne działanie aplikacji</h3>
              <p>
                wayUp nie uruchamia analitycznych ani reklamowych plików
                cookies. Supabase Auth utrzymuje sesję logowania w pamięci
                przeglądarki, a niedokończony quiz może być tymczasowo
                przechowany w sessionStorage tej karty.
              </p>
              <h3>Wybór użytkownika</h3>
              <p>
                Ponieważ obecnie nie są używane opcjonalne cookies
                marketingowe ani analityczne, strona nie wyświetla banera
                wymuszającego zgodę na takie cele. Ta informacja wymaga
                aktualizacji, jeśli dojdą narzędzia pomiarowe lub reklamowe.
              </p>
            </>
          )}
          {activeTab === "marketing" && (
            <>
              <h3>Bez śledzenia reklamowego</h3>
              <p>
                Aktualna wersja wayUp nie wysyła newslettera, nie prowadzi
                kampanii e-mailowych i nie używa pikseli reklamowych ani
                profilowania marketingowego.
              </p>
              <h3>Zmiana zakresu</h3>
              <p>
                Jeśli w przyszłości pojawi się newsletter, analityka lub
                reklamy, zakres danych i mechanizm uzyskania zgody zostaną
                opisane przed ich uruchomieniem. Zgody marketingowe nie są
                obecnie zbierane.
              </p>
            </>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}

function ChooseYourDestination() {
  const { session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [privacyTab, setPrivacyTab] = useState(null);
  const privacyCloseRef = useRef(null);
  const startPath = session ? "/meetYou" : "/konto?next=/meetYou";

  function closeMenu() {
    setMenuOpen(false);
  }

  const closePrivacy = useCallback(() => {
    setPrivacyTab(null);
  }, []);

  function openPrivacy(tab) {
    privacyCloseRef.current = document.activeElement;
    setPrivacyTab(tab);
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="landing-page">
        <ScrollGuide />
        <a className="skip-link" href="#main-content">Przejdź do treści</a>
        <header className="site-header">
          <Link className="brand" to="/" aria-label="wayUp — strona główna" onClick={closeMenu}>
            wayUp<span>.</span>
          </Link>
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
          >
            {menuOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
          </button>
          <nav
            className={`header-nav${menuOpen ? " is-open" : ""}`}
            id="primary-navigation"
            aria-label="Nawigacja główna"
          >
            <a href="#jak-to-dziala" onClick={closeMenu}>Jak to działa</a>
            <a href="#aktualnosci" onClick={closeMenu}>Aktualności</a>
            <a href="#zespol" onClick={closeMenu}>Zespół</a>
            <Link className="header-account" to={session ? "/meetYou" : "/konto"} onClick={closeMenu}>
              {session ? "Mój quiz" : "Zaloguj się"}
            </Link>
          </nav>
        </header>

        <section className="hero-section" id="main-content">
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
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img src={mineEntranceImage} alt="Wejście do starej kopalni i wagonik na torach" />
            <div className="visual-caption">
              <span className="caption-dot" />
              <div>
                <strong>Każdy ma swoją drogę.</strong>
                <span>Znajdź pierwszy krok, który jest Twój.</span>
              </div>
            </div>
            <div className="visual-stamp" aria-hidden="true">
              <span>ATLAS</span>
              <strong>01</strong>
              <span>MOŻLIWOŚCI</span>
            </div>
            <div className="visual-index">WAYUP / 01</div>
            <div className="visual-orbit" aria-hidden="true" />
          </motion.div>
          <div className="hero-scroll"><span /> przewiń, żeby poznać szczegóły</div>
        </section>

        <motion.section
          className="intro-section"
          id="dla-kogo"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
        >
          <div className="intro-content">
            <div className="section-label">Nie test. Początek rozmowy.</div>
            <h2>
              Przyszłość nie jest gotową mapą.
              <br />
              <span>Możesz ją narysować po swojemu.</span>
            </h2>
            <p>
              Wybór szkoły, studiów czy pierwszej pracy potrafi przytłoczyć.
              wayUp pomaga zamienić „nie wiem” w kilka sensownych możliwości i
              mały, możliwy do zrobienia plan. Bez presji, bez etykietek i bez
              jednej „idealnej” odpowiedzi.
            </p>
            <div className="intro-stats" aria-label="Jak działa wayUp">
              <div><strong>01</strong><span>poznaj siebie</span></div>
              <div><strong>02</strong><span>sprawdź opcje</span></div>
              <div><strong>03</strong><span>ruszaj we własnym tempie</span></div>
            </div>
          </div>
        </motion.section>

        <section className="steps-section" id="jak-to-dziala">
          <div className="steps-content">
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
                <motion.article
                  className="step-card"
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: Number(step.number) * 0.08 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="step-image">
                    <img src={step.image} alt={step.imageAlt} />
                    <span>{step.imageLabel}</span>
                  </div>
                  <div className="step-top">
                    <span className="step-icon">{step.icon}</span>
                    <span className="step-number">{step.number}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </motion.article>
              ))}
            </div>
            <div className="steps-footnote">
              <span className="steps-footnote-mark">↗</span>
              <p>Nie musisz znać odpowiedzi na całe życie. Wystarczy jedna na teraz.</p>
            </div>
          </div>
          <div className="steps-coordinate" aria-hidden="true">52°13&apos;N&nbsp; 21°00&apos;E</div>
        </section>

        <motion.section
          className="discovery-section"
          aria-labelledby="discovery-title"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.65 }}
        >
          <div className="discovery-image">
            <img src={goldVeinImage} alt="Złota forma przypominająca odkryty pokład minerału" />
            <span className="discovery-image-note">nieoczywiste też jest wartościowe</span>
            <span className="discovery-image-index">PRÓBKA / 001</span>
          </div>
          <div className="discovery-copy">
            <p className="section-label">Nie szukamy jednej odpowiedzi</p>
            <h2 id="discovery-title">
              Czasem skarbem jest to, <em>czego jeszcze nie znasz.</em>
            </h2>
            <p>
              Nie musisz dziś wybierać zawodu na całe życie. Zacznij od tego,
              co Cię ciekawi — potem sprawdź małym krokiem, dokąd może Cię to
              zaprowadzić.
            </p>
            <Link className="discovery-link" to={startPath}>
              Odkryj swoje możliwości <ArrowOutwardRoundedIcon />
            </Link>
            <div className="discovery-coordinate" aria-hidden="true">
              <span>WAYUP FIELD NOTES</span>
              <span>52°13&apos;N — TWOJA TRASA, TWÓJ RYTM</span>
            </div>
          </div>
        </motion.section>

        <NewsSection />

        <motion.section
          className="team-section"
          id="zespol"
          aria-labelledby="team-title"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6 }}
        >
          <div className="team-heading">
            <div>
              <p className="section-label">Poznaj tych, którzy budują wayUp</p>
              <h2 id="team-title">Młodzi tworzą dla młodych.</h2>
            </div>
            <p>Za każdą ścieżką stoi mały zespół i pomysł, żeby wybór przyszłości był trochę łatwiejszy.</p>
          </div>
          <div className="team-grid">
            {team.map((member, index) => (
              <motion.article
                className={`team-card team-card-${index + 1}`}
                key={member.name}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.22 }}
              >
                <div className="member-photo" role="img" aria-label={member.photoLabel}>
                  <span className="member-photo-note">zdjęcie zespołu</span>
                  <span className="member-initials" aria-hidden="true">{member.initials}</span>
                  <span className="member-photo-index">WAYUP / 0{index + 2}</span>
                </div>
                <div className="member-copy">
                  <div className="member-role">{member.role}</div>
                  <h3>{member.name}</h3>
                  <p>{member.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <section className="closing-section">
          <div>
            <div className="section-label">Mały krok też jest krokiem</div>
            <h2>Sprawdź, co może być Twoje.</h2>
          </div>
          <Link className="primary-link" to={startPath}>
            Ruszajmy <ArrowForwardRoundedIcon />
          </Link>
        </section>

        <footer className="site-footer" id="stopka">
          <div className="footer-main">
            <div className="footer-brand-block">
              <Link className="brand" to="/">wayUp<span>.</span></Link>
              <p>Pomagamy młodym odkrywać własną drogę — bez presji i gotowych etykiet.</p>
            </div>
            <div className="footer-column">
              <h2>Odkrywaj</h2>
              <a href="#jak-to-dziala">Jak to działa</a>
              <a href="#aktualnosci">Aktualności</a>
              <a href="#zespol">Nasz zespół</a>
            </div>
            <div className="footer-column">
              <h2>Twój wayUp</h2>
              <Link to={startPath}>Zrób quiz</Link>
              <Link to="/konto">{session ? "Moje konto" : "Zaloguj się"}</Link>
            </div>
            <div className="footer-column">
              <h2>Transparentnie</h2>
              <button type="button" onClick={() => openPrivacy("privacy")}>Prywatność</button>
              <button type="button" onClick={() => openPrivacy("cookies")}>Cookies i pamięć</button>
              <button type="button" onClick={() => openPrivacy("marketing")}>Marketing i zgody</button>
            </div>
            <div className="footer-note">
              <span className="footer-note-mark">↑</span>
              <p>Nie musisz mieć planu na całe życie. Zacznij od kierunku.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} wayUp · Projekt HackHeroes</span>
            <span>Twoja droga. Twoje tempo.</span>
          </div>
        </footer>
        <AnimatePresence>
          {privacyTab && (
            <PrivacyCenter
              activeTab={privacyTab}
              onTabChange={setPrivacyTab}
              onClose={closePrivacy}
              openerRef={privacyCloseRef}
            />
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}

export default ChooseYourDestination;
