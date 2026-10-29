import { useEffect, useState } from "react";
import { Alert, CircularProgress } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../api";

function Share() {
  const { token } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest(`/share/${encodeURIComponent(token)}`, { auth: false })
      .then((data) => {
        if (!data.card) throw new Error("Nie udało się odczytać udostępnionego profilu.");
        if (active) setCard(data.card);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Ten link jest nieprawidłowy lub wygasł.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="share-page">
      <header className="quiz-header">
        <Link className="brand" to="/">wayUp<span>.</span></Link>
        <Link className="header-account" to="/">Poznaj swoją drogę</Link>
      </header>

      <section className="share-card">
        <p className="eyebrow">wayUp · karta inspiracji</p>
        {loading ? (
          <CircularProgress aria-label="Ładowanie profilu" />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <h1>{card.archetype?.name ?? "Czyjś profil wayUp"}</h1>
            {card.archetype?.tagline && <p className="share-tagline">{card.archetype.tagline}</p>}
            {Array.isArray(card.traits) && card.traits.length > 0 && (
              <div className="traits-list">
                {card.traits.map((trait) => (
                  <div className="trait-row" key={trait.key}>
                    <span>{trait.label}</span>
                    <div className="trait-track">
                      <span style={{ width: `${Math.min(100, Math.max(0, trait.value))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {Array.isArray(card.paths) && card.paths.length > 0 && (
              <div className="share-paths">
                <h2>Możliwe kierunki</h2>
                {card.paths.map((path) => (
                  <article key={path.type}>
                    <strong>{path.title}</strong>
                    <span>{path.type === "safe" ? "Klasyczna" : path.type === "surprising" ? "Niszowa" : "Przyszłościowa"}</span>
                  </article>
                ))}
              </div>
            )}
            {card.createdAt && (
              <p className="share-date">
                Utworzono {new Date(card.createdAt).toLocaleDateString("pl-PL")}
              </p>
            )}
            <p className="share-footnote">To profil do inspiracji — nie etykieta ani gotowa odpowiedź na całe życie.</p>
          </>
        )}
      </section>
    </main>
  );
}

export default Share;
