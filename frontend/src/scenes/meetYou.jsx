import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { Link, Navigate } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { supabase } from "../auth/supabaseClient";
import { useAuth } from "../auth/useAuth";
import {
  Q_1,
  Q_2,
  Q_3,
  Q_4,
  Q_5,
  Q_6,
  Q_7,
  Q_8,
  Q_9,
  Q_10,
  Q_11,
  Q_12,
  Q_13,
  Q_14,
  Q_15,
  Q_16,
  Q_17,
  Q_18,
  Q_19,
  Q_20,
} from "../components/functionContainer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const questions = [
  Q_1, Q_2, Q_3, Q_4, Q_5, Q_6, Q_7, Q_8, Q_9, Q_10,
  Q_11, Q_12, Q_13, Q_14, Q_15, Q_16, Q_17, Q_18, Q_19, Q_20,
];

function formatDate(value) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function MeetYou() {
  const { session, loading: checkingSession, authError } = useAuth();
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const CurrentQuestion = questions[page];

  useEffect(() => {
    if (!session?.access_token) return undefined;
    const controller = new AbortController();

    axios
      .get(`${API_URL}/quiz-results`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!Array.isArray(data.results)) {
          throw new Error("Serwer zwrócił nieprawidłowy format zapisanych wyników.");
        }
        setHistory(data.results);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setHistoryError(
            requestError.response?.data?.message ||
              requestError.response?.data?.error ||
              requestError.message ||
              "Nie udało się pobrać zapisanych wyników.",
          );
        }
      });

    return () => controller.abort();
  }, [session?.access_token]);

  if (checkingSession) {
    return <main className="loading-page"><CircularProgress aria-label="Sprawdzam sesję" /></main>;
  }

  if (!session) return <Navigate to="/konto?next=/meetYou" replace />;

  function handleAnswer(value) {
    setAnswers((previous) => ({ ...previous, [page]: value }));
    setError("");
    setResult(null);
  }

  function movePage(direction) {
    setPage((current) => Math.min(Math.max(current + direction, 0), questions.length - 1));
    setError("");
  }

  async function handleSubmit() {
    const missingPage = questions.findIndex((_, index) => {
      const answer = answers[index];
      if (Array.isArray(answer)) return answer.length === 0;
      return typeof answer !== "string" || answer.trim() === "";
    });

    if (missingPage !== -1) {
      setPage(missingPage);
      setError("Uzupełnij to pytanie, zanim wyślesz odpowiedzi.");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const { data } = await axios.post(`${API_URL}/SendHandler`, answers, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!data.ok || !data.saved || typeof data.result !== "string") {
        throw new Error("Nie udało się zapisać wyniku na Twoim koncie. Spróbuj ponownie.");
      }

      const savedResult = {
        id: data.requestId,
        result: data.result,
        created_at: new Date().toISOString(),
      };
      setResult(savedResult);
      setHistory((previous) => [savedResult, ...previous]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          requestError.message ||
          "Nie udało się wysłać odpowiedzi. Sprawdź połączenie z serwerem i spróbuj ponownie.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      setError("Nie można wylogować — brakuje konfiguracji Supabase.");
      return;
    }
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) setError(`Nie udało się wylogować: ${signOutError.message}`);
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? `Nie udało się wylogować: ${signOutError.message}`
          : "Nie udało się wylogować.",
      );
    }
  }

  const progress = ((page + 1) / questions.length) * 100;

  return (
    <main className="quiz-page">
      <header className="quiz-header">
        <Link className="brand" to="/">wayUp<span>.</span></Link>
        <div className="account-controls">
          <span className="account-email">{session.user.email}</span>
          <Button
            className="sign-out-button"
            startIcon={<LogoutRoundedIcon />}
            onClick={handleSignOut}
          >
            Wyloguj
          </Button>
        </div>
      </header>

      <div className="quiz-layout">
        <section className="quiz-panel" aria-live="polite">
          <Link className="back-link quiz-back" to="/">
            <ArrowBackRoundedIcon /> Strona główna
          </Link>

          <div className="quiz-heading">
            <p className="eyebrow">Poznajmy się lepiej</p>
            <h1>Twoja droga zaczyna się od Ciebie.</h1>
            <p>Nie ma złych odpowiedzi. Zaznacz to, co jest najbliżej Ciebie.</p>
          </div>

          {authError && <Alert severity="error" className="quiz-alert">{authError}</Alert>}
          {error && <Alert severity="warning" className="quiz-alert">{error}</Alert>}

          <div className="question-progress">
            <div className="progress-caption">
              <span>Pytanie {page + 1} z {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <LinearProgress variant="determinate" value={progress} />
          </div>

          <div className="question-card">
            <CurrentQuestion
              key={page}
              value={answers[page]}
              onChange={handleAnswer}
            />
          </div>

          <div className="quiz-controls">
            <Button
              variant="outlined"
              onClick={() => movePage(-1)}
              disabled={page === 0 || submitting}
              startIcon={<ArrowBackRoundedIcon />}
            >
              Wstecz
            </Button>
            {page === questions.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AutoSendIcon />}
              >
                {submitting ? "Szukam Twojego kierunku…" : "Pokaż mój kierunek"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => movePage(1)}
                disabled={submitting}
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Dalej
              </Button>
            )}
          </div>
        </section>

        <aside className="saved-results" aria-label="Twoje zapisane wyniki">
          <div className="section-label">Twoje konto</div>
          <h2>Twoje odkrycia</h2>
          <p>Wyniki quizów zapisują się tutaj, żeby można było do nich wrócić.</p>
          {historyError && <Alert severity="error">{historyError}</Alert>}
          {history.length === 0 && !historyError ? (
            <div className="empty-history">Po pierwszym quizie pojawi się tu Twoja rekomendacja.</div>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <article className="history-card" key={item.id}>
                  <span>{formatDate(item.created_at)}</span>
                  <p>{item.result}</p>
                  {index === 0 && result?.id === item.id && (
                    <strong className="saved-label">Zapisano na Twoim koncie</strong>
                  )}
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function AutoSendIcon() {
  return <ArrowForwardRoundedIcon />;
}

export default MeetYou;
