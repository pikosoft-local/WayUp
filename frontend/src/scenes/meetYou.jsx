import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Slider,
  TextField,
} from "@mui/material";
import { Link, Navigate } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import { apiRequest } from "../api";
import { supabase } from "../auth/supabaseClient";
import { useAuth } from "../auth/useAuth";

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

function flattenQuestions(data) {
  if (!Array.isArray(data?.blocks)) {
    throw new Error("Serwer zwrócił nieprawidłowy format pytań.");
  }
  const questions = data.blocks.flatMap((block) =>
    (block.questions ?? []).map((question) => ({
      ...question,
      blockTitle: block.title,
    })),
  );
  if (!questions.length) throw new Error("Serwer nie zwrócił pytań do quizu.");
  return questions;
}

function draftStorageKey(userId) {
  return `wayup.quizDraft.${userId}`;
}

function readDraft(userId) {
  const emptyDraft = { answers: {}, page: 0, followUps: [] };
  if (!userId) return emptyDraft;

  try {
    const savedDraft = sessionStorage.getItem(draftStorageKey(userId));
    if (!savedDraft) return emptyDraft;
    const draft = JSON.parse(savedDraft);
    return {
      answers:
        draft.answers && typeof draft.answers === "object" && !Array.isArray(draft.answers)
          ? draft.answers
          : {},
      page: Number.isInteger(draft.page) && draft.page >= 0 ? draft.page : 0,
      followUps: Array.isArray(draft.followUps) ? draft.followUps.slice(0, 3) : [],
    };
  } catch {
    return {
      ...emptyDraft,
      error: "Nie udało się odczytać szkicu quizu z tej przeglądarki.",
    };
  }
}

function QuestionInput({ question, value, onChange }) {
  const options = question.options ?? [];
  const label = question.text;

  if (question.type === "text") {
    return (
      <TextField
        className="question-text"
        fullWidth
        multiline
        minRows={3}
        maxRows={5}
        placeholder="Wpisz swoją odpowiedź…"
        value={value ?? ""}
        slotProps={{ htmlInput: { maxLength: 500 } }}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === "choice") {
    return (
      <RadioGroup
        className="answer-options"
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.id}
            value={option.id}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </RadioGroup>
    );
  }

  if (question.type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="answer-options answer-grid" role="group" aria-label={label}>
        {options.map((option) => (
          <FormControlLabel
            key={option.id}
            control={
              <input
                className="quiz-checkbox"
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => {
                  if (selected.includes(option.id)) {
                    onChange(selected.filter((id) => id !== option.id));
                  } else if (selected.length < 20) {
                    onChange([...selected, option.id]);
                  }
                }}
              />
            }
            label={option.label}
          />
        ))}
      </div>
    );
  }

  if (question.type === "slider") {
    const min = question.min ?? 0;
    const max = question.max ?? 100;
    return (
      <div className="quiz-slider">
        <div className="slider-value">{value ?? Math.round((min + max) / 2)}</div>
        <Slider
          aria-label={label}
          value={Number(value ?? Math.round((min + max) / 2))}
          min={min}
          max={max}
          onChange={(_event, nextValue) => onChange(String(nextValue))}
        />
        <div className="slider-labels">
          <span>{question.minLabel}</span>
          <span>{question.maxLabel}</span>
        </div>
      </div>
    );
  }

  return <Alert severity="error">Nieobsługiwany typ pytania: {question.type || "brak"}.</Alert>;
}

function TraitsRadar({ traits }) {
  const center = 100;
  const radius = 72;
  const pointsAtScale = (scale) =>
    traits.map((trait, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / traits.length;
      const pointRadius = radius * scale;
      return `${center + Math.cos(angle) * pointRadius},${center + Math.sin(angle) * pointRadius}`;
    }).join(" ");
  const profilePoints = traits.map((trait, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / traits.length;
    const value = Math.min(100, Math.max(0, Number(trait.value) || 0));
    const pointRadius = radius * (value / 100);
    return `${center + Math.cos(angle) * pointRadius},${center + Math.sin(angle) * pointRadius}`;
  }).join(" ");

  return (
    <div className="radar-layout">
      <svg className="traits-radar" viewBox="0 0 200 200" role="img" aria-label="Wykres Twoich mocnych stron">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={pointsAtScale(scale)}
            className="radar-grid"
          />
        ))}
        {traits.map((trait, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / traits.length;
          return (
            <line
              key={trait.key}
              x1={center}
              y1={center}
              x2={center + Math.cos(angle) * radius}
              y2={center + Math.sin(angle) * radius}
              className="radar-axis"
            />
          );
        })}
        <polygon points={profilePoints} className="radar-profile" />
      </svg>
      <div className="traits-list">
        {traits.map((trait) => (
          <div className="trait-row" key={trait.key}>
            <span>{trait.label}</span>
            <div className="trait-track">
              <span style={{ width: `${Math.min(100, Math.max(0, Number(trait.value) || 0))}%` }} />
            </div>
            <strong>{trait.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileView({ profile, resultId, canLoadDetails, onError }) {
  const [selectedPath, setSelectedPath] = useState("safe");
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [loadingGap, setLoadingGap] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const paths = profile?.paths ?? [];
  const path = paths.find((item) => item.type === selectedPath) ?? paths[0];
  const roadmap = profile?.roadmap;

  useEffect(() => {
    if (!canLoadDetails || !resultId || !path?.type) return undefined;
    let active = true;
    apiRequest(`/results/${encodeURIComponent(resultId)}/chat?pathType=${encodeURIComponent(path.type)}`)
      .then((data) => {
        if (active) setChatMessages(Array.isArray(data.messages) ? data.messages : []);
      })
      .catch((error) => {
        if (active) {
          setChatMessages([]);
          onError(error.message);
        }
      });
    return () => {
      active = false;
    };
  }, [canLoadDetails, resultId, path?.type, onError]);

  async function handleGapAnalysis() {
    if (!path) return;
    setLoadingGap(true);
    setGapAnalysis(null);
    try {
      const data = await apiRequest(
        `/results/${encodeURIComponent(resultId)}/gap-analysis?pathType=${encodeURIComponent(path.type)}`,
      );
      setGapAnalysis(data);
    } catch (error) {
      onError(getErrorMessage(error, "Nie udało się pobrać analizy luk."));
    } finally {
      setLoadingGap(false);
    }
  }

  async function handleShare() {
    setShareMessage("");
    try {
      const data = await apiRequest(`/results/${encodeURIComponent(resultId)}/share`, {
        method: "POST",
      });
      if (!data.shareToken) throw new Error("Serwer nie zwrócił linku do udostępnienia.");
      const link = `${window.location.origin}/share/${data.shareToken}`;
      setShareLink(link);
      await navigator.clipboard.writeText(link);
      setShareMessage("Link skopiowany do schowka.");
    } catch (error) {
      setShareMessage(getErrorMessage(error, "Nie udało się utworzyć linku."));
    }
  }

  async function handlePdfDownload() {
    try {
      const blob = await apiRequest(`/results/${encodeURIComponent(resultId)}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `profil-wayup-${resultId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError(getErrorMessage(error, "Nie udało się pobrać raportu PDF."));
    }
  }

  async function handleSendChat(event) {
    event.preventDefault();
    const message = chatText.trim();
    if (!message || message.length > 1000 || !path) return;
    setSendingChat(true);
    try {
      const data = await apiRequest(`/results/${encodeURIComponent(resultId)}/chat`, {
        method: "POST",
        body: { pathType: path.type, message },
      });
      if (!data.reply) throw new Error("Mentor nie zwrócił odpowiedzi.");
      const createdAt = new Date().toISOString();
      setChatMessages((previous) => [
        ...previous,
        { role: "user", content: message, createdAt },
        { role: "assistant", content: data.reply, createdAt },
      ]);
      setChatText("");
    } catch (error) {
      onError(getErrorMessage(error, "Nie udało się wysłać wiadomości."));
    } finally {
      setSendingChat(false);
    }
  }

  if (!profile) {
    return (
      <section className="profile-panel">
        <div className="section-label">Twoja rekomendacja</div>
        <p>Wynik został wygenerowany, ale AI nie zwróciło pełnego profilu dla tej próby.</p>
      </section>
    );
  }

  const roadmapStages = [
    ["3 miesiące", roadmap?.months3],
    ["6 miesięcy", roadmap?.months6],
    ["12 miesięcy", roadmap?.months12],
  ];

  return (
    <section className="profile-panel">
      {profile.archetype && (
        <header className="archetype-card">
          <div className="section-label">Twój archetyp</div>
          <h2>{profile.archetype.name}</h2>
          <p>{profile.archetype.tagline}</p>
          {profile.explanation && <p>{profile.explanation}</p>}
        </header>
      )}

      {Array.isArray(profile.traits) && profile.traits.length > 0 && (
        <section className="profile-section">
          <h3>Twoje mocne strony</h3>
          <TraitsRadar traits={profile.traits} />
        </section>
      )}

      {paths.length > 0 && (
        <section className="profile-section">
          <h3>Możliwe ścieżki</h3>
          <div className="path-tabs" role="tablist" aria-label="Wybierz ścieżkę kariery">
            {paths.map((item) => (
              <button
                key={item.type}
                type="button"
                role="tab"
                aria-selected={path?.type === item.type}
                className={path?.type === item.type ? "path-tab active" : "path-tab"}
                onClick={() => {
                  setSelectedPath(item.type);
                  setGapAnalysis(null);
                }}
              >
                {item.type === "safe" ? "Klasyczna" : item.type === "surprising" ? "Niszowa" : "Przyszłościowa"}
              </button>
            ))}
          </div>

          {path && (
            <article className="path-card">
              <h4>{path.title}</h4>
              <p>{path.description}</p>
              {path.whyFit && <p><strong>Dlaczego może pasować:</strong> {path.whyFit}</p>}
              <dl className="path-facts">
                {path.salaryPln && (
                  <div>
                    <dt>Szacunkowe wynagrodzenie brutto / mies.</dt>
                    <dd>{path.salaryPln.min.toLocaleString("pl-PL")}–{path.salaryPln.max.toLocaleString("pl-PL")} zł</dd>
                  </div>
                )}
                {path.outlook && <div><dt>Perspektywy</dt><dd>{path.outlook}</dd></div>}
                {path.automationRisk && (
                  <div>
                    <dt>Ryzyko automatyzacji</dt>
                    <dd>{path.automationRisk === "low" ? "Niskie" : path.automationRisk === "high" ? "Wysokie" : "Średnie"}</dd>
                  </div>
                )}
              </dl>
              {profile.disclaimer && <p className="profile-disclaimer">{profile.disclaimer}</p>}

              {canLoadDetails && (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleGapAnalysis}
                    disabled={loadingGap}
                  >
                    {loadingGap ? "Analizuję…" : "Sprawdź, czego warto się nauczyć"}
                  </Button>
                  {gapAnalysis && (
                    <div className="gap-analysis">
                      <strong>Dopasowanie orientacyjne: {gapAnalysis.matchPercentage}%</strong>
                      <p>{gapAnalysis.recommendation}</p>
                      {gapAnalysis.missingSkills?.length > 0 && (
                        <p><strong>Do rozwinięcia:</strong> {gapAnalysis.missingSkills.join(", ")}</p>
                      )}
                      {gapAnalysis.acquiredSkills?.length > 0 && (
                        <p><strong>Już masz:</strong> {gapAnalysis.acquiredSkills.join(", ")}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </article>
          )}
        </section>
      )}

      {profile.skills && (
        <section className="profile-section skills-grid">
          {["hard", "soft"].map((kind) => (
            <div key={kind}>
              <h3>{kind === "hard" ? "Kompetencje praktyczne" : "Twoje atuty"}
              </h3>
              <ul>{(profile.skills[kind] ?? []).map((skill) => <li key={skill}>{skill}</li>)}</ul>
            </div>
          ))}
        </section>
      )}

      {roadmap && (
        <section className="profile-section">
          <h3>Plan pierwszych kroków</h3>
          <div className="roadmap-grid">
            {roadmapStages.map(([title, steps]) => (
              <article className="roadmap-card" key={title}>
                <h4>{title}</h4>
                <ul>{(steps ?? []).map((step, index) => <li key={`${title}-${index}`}>{step}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {profile.learningAreas?.length > 0 && (
        <section className="profile-section">
          <h3>Obszary do odkrycia</h3>
          <div className="learning-list">
            {profile.learningAreas.map((item) => (
              <article key={item.area}><strong>{item.area}</strong><p>{item.why}</p></article>
            ))}
          </div>
        </section>
      )}

      {canLoadDetails && (
        <section className="profile-section profile-actions">
          <Button startIcon={<DownloadRoundedIcon />} onClick={handlePdfDownload}>Pobierz PDF</Button>
          <Button startIcon={<ShareRoundedIcon />} onClick={handleShare}>Udostępnij wynik</Button>
          {shareLink && <a href={shareLink}>{shareLink}</a>}
          {shareMessage && <span>{shareMessage}</span>}
        </section>
      )}

      {canLoadDetails && path && (
        <section className="profile-section mentor-section">
          <h3>Zapytaj mentora AI o ścieżkę: {path.title}</h3>
          <div className="mentor-messages" aria-live="polite">
            {chatMessages.map((message, index) => (
              <article className={`mentor-message ${message.role}`} key={`${message.createdAt}-${index}`}>
                <strong>{message.role === "assistant" ? "Mentor AI" : "Ty"}</strong>
                <p>{message.content}</p>
              </article>
            ))}
            {chatMessages.length === 0 && <p>Zadaj pytanie o codzienną pracę, naukę albo pierwsze kroki.</p>}
          </div>
          <form className="mentor-form" onSubmit={handleSendChat}>
            <TextField
              fullWidth
              size="small"
              placeholder="Np. jak wygląda typowy dzień?"
              value={chatText}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
              onChange={(event) => setChatText(event.target.value)}
            />
            <Button type="submit" variant="contained" disabled={sendingChat || !chatText.trim()}>
              {sendingChat ? "Wysyłam…" : "Wyślij"}
            </Button>
          </form>
        </section>
      )}
    </section>
  );
}

function MeetYou() {
  const { session, loading: checkingSession, authError } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [draftState, setDraftState] = useState(() => readDraft(session?.user?.id));
  const [draftUserId, setDraftUserId] = useState(session?.user?.id ?? null);
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const currentDraft =
    draftUserId === session?.user?.id ? draftState : readDraft(session?.user?.id);
  const { answers, page, followUps } = currentDraft;

  useEffect(() => {
    let active = true;
    apiRequest("/questions", { auth: false })
      .then((data) => {
        const questionsFromApi = flattenQuestions(data);
        if (active) setQuestions(questionsFromApi);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError, "Nie udało się pobrać pytań."));
      })
      .finally(() => {
        if (active) setQuestionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    let active = true;
    apiRequest("/results")
      .then((data) => {
        if (!Array.isArray(data.items)) throw new Error("Serwer zwrócił nieprawidłową listę wyników.");
        if (active) setHistory(data.items);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError, "Nie udało się pobrać Twoich wyników."));
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const currentQuestion = questions[page];
  const progress = questions.length ? ((page + 1) / questions.length) * 100 : 0;
  const visibleError = error || currentDraft.error;
  const answerCount = Object.values(answers).filter((answer) =>
    Array.isArray(answer) ? answer.length > 0 : String(answer ?? "").trim() !== "",
  ).length;

  if (checkingSession) {
    return <main className="loading-page"><CircularProgress aria-label="Sprawdzam sesję" /></main>;
  }
  if (!session) return <Navigate to="/konto?next=/meetYou" replace />;

  function updateDraft(changes) {
    const nextDraft = {
      answers: currentDraft.answers,
      page: currentDraft.page,
      followUps: currentDraft.followUps,
      ...changes,
    };
    setDraftState(nextDraft);
    setDraftUserId(session.user.id);
    setError("");
    try {
      sessionStorage.setItem(draftStorageKey(session.user.id), JSON.stringify(nextDraft));
    } catch {
      setError("Nie udało się zapisać szkicu quizu w tej przeglądarce.");
    }
  }

  function updateAnswer(value) {
    updateDraft({
      answers: { ...answers, [currentQuestion.id]: value },
    });
  }

  async function loadPreviousResult(item) {
    setError("");
    setNotice("");
    try {
      const data = await apiRequest(`/results/${encodeURIComponent(item.id)}`);
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Nie udało się wczytać wyniku."));
    }
  }

  async function requestFollowUp() {
    if (followUps.length >= 3 || followUpLoading) return;
    setFollowUpLoading(true);
    setError("");
    try {
      const data = await apiRequest("/questions/follow-up", {
        method: "POST",
        body: { answers, followUps },
      });
      if (!data.question?.id || !data.question?.text) {
        throw new Error("Serwer zwrócił nieprawidłowe pytanie dodatkowe.");
      }
      setFollowUpQuestion(data.question);
      setFollowUpAnswer("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Dodatkowe pytanie jest teraz niedostępne. Możesz wysłać quiz."));
    } finally {
      setFollowUpLoading(false);
    }
  }

  function saveFollowUp() {
    const selected = followUpQuestion.options?.find((option) => option.id === followUpAnswer);
    const answer = selected?.label ?? followUpAnswer.trim();
    if (!answer) {
      setError("Odpowiedz na pytanie dodatkowe albo je pomiń.");
      return;
    }
    updateDraft({
      followUps: [...followUps, { question: followUpQuestion.text, answer }],
    });
    setFollowUpQuestion(null);
    setFollowUpAnswer("");
  }

  async function submitQuiz() {
    if (answerCount === 0) {
      setError("Odpowiedz przynajmniej na jedno pytanie.");
      return;
    }
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const data = await apiRequest("/SendHandler", {
        method: "POST",
        body: { answers, followUps },
      });
      if (!data.ok || typeof data.result !== "string" || !data.requestId) {
        throw new Error("Serwer zwrócił nieprawidłowy wynik quizu.");
      }

      try {
        sessionStorage.removeItem(draftStorageKey(session.user.id));
      } catch {
        setError("Wynik jest gotowy, ale nie udało się usunąć lokalnego szkicu quizu.");
      }

      setResult({
        id: data.requestId,
        createdAt: new Date().toISOString(),
        result: data.result,
        profile: data.profile ?? null,
        saved: data.saved,
        shareToken: null,
      });
      if (data.saved === false) {
        setNotice("Porada jest gotowa, ale nie została zapisana na koncie i nie pojawi się w historii.");
      } else if (data.saved === true) {
        setNotice("Wynik został zapisany na Twoim koncie.");
        setHistory((previous) => [
          {
            id: data.requestId,
            createdAt: new Date().toISOString(),
            archetype: data.profile?.archetype ?? null,
            shared: false,
          },
          ...previous,
        ]);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Nie udało się wysłać quizu. Spróbuj ponownie."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      setError("Nie można wylogować — brakuje konfiguracji Supabase.");
      return;
    }
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(`Nie udało się wylogować: ${signOutError.message}`);
  }

  if (questionsLoading || loadingHistory) {
    return <main className="loading-page"><CircularProgress aria-label="Ładowanie quizu" /></main>;
  }

  return (
    <main className="quiz-page">
      <header className="quiz-header">
        <Link className="brand" to="/">wayUp<span>.</span></Link>
        <div className="account-controls">
          <span className="account-email">{session.user.email}</span>
          <Button className="sign-out-button" startIcon={<LogoutRoundedIcon />} onClick={handleSignOut}>
            Wyloguj
          </Button>
        </div>
      </header>

      <div className="quiz-layout">
        <section className="quiz-panel" aria-live="polite">
          <Link className="back-link quiz-back" to="/">
            <ArrowBackRoundedIcon /> Strona główna
          </Link>

          {authError && <Alert severity="error" className="quiz-alert">{authError}</Alert>}
          {visibleError && <Alert severity="error" className="quiz-alert">{visibleError}</Alert>}
          {notice && <Alert severity={notice.startsWith("Porada") ? "warning" : "success"} className="quiz-alert">{notice}</Alert>}

          {result ? (
            <div className="result-view">
              <div className="quiz-heading">
                <p className="eyebrow">Twój wayUp</p>
                <h1>Oto, co odkryliśmy.</h1>
              </div>
              <article className="result-advice">
                <div className="section-label">Twoja rekomendacja</div>
                <p>{result.result}</p>
              </article>
              <ProfileView
                key={result.id}
                profile={result.profile}
                resultId={result.id}
                canLoadDetails={result.saved !== false}
                onError={setError}
              />
              <Button variant="outlined" onClick={() => {
                setResult(null);
                setNotice("");
                setError("");
                updateDraft({ answers: {}, followUps: [], page: 0 });
              }}>
                Wypełnij quiz ponownie
              </Button>
            </div>
          ) : (
            <>
              <div className="quiz-heading">
                <p className="eyebrow">{currentQuestion?.blockTitle ?? "Twoja droga zaczyna się od Ciebie"}</p>
                <h1>Poznajmy się lepiej.</h1>
                <p>Odpowiedz na tyle pytań, ile chcesz — wystarczy jedna odpowiedź, żeby zacząć.</p>
              </div>

              {currentQuestion && (
                <>
                  <div className="question-progress">
                    <div className="progress-caption">
                      <span>Pytanie {page + 1} z {questions.length}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <LinearProgress variant="determinate" value={progress} />
                  </div>

                  <div className="question-card">
                    <h2 className="question-label">{currentQuestion.text}</h2>
                    <QuestionInput
                      question={currentQuestion}
                      value={answers[currentQuestion.id]}
                      onChange={updateAnswer}
                    />
                  </div>

                  <div className="quiz-controls">
                    <Button
                      variant="outlined"
                      onClick={() => updateDraft({ page: Math.max(0, page - 1) })}
                      disabled={page === 0 || submitting}
                      startIcon={<ArrowBackRoundedIcon />}
                    >
                      Wstecz
                    </Button>
                    {page < questions.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={() => updateDraft({ page: Math.min(questions.length - 1, page + 1) })}
                        endIcon={<ArrowForwardRoundedIcon />}
                      >
                        Dalej
                      </Button>
                    ) : (
                      <Button variant="contained" disabled={submitting} onClick={submitQuiz}>
                        {submitting ? "Tworzę Twój profil…" : "Pokaż mój kierunek"}
                      </Button>
                    )}
                  </div>
                </>
              )}

              {page === questions.length - 1 && (
                <section className="follow-up-panel">
                  <div>
                    <strong>Doprecyzuj profil (opcjonalnie)</strong>
                    <p>Możesz zadać AI do 3 dodatkowych pytań, żeby lepiej dopasować rekomendację.</p>
                  </div>
                  {followUps.map((followUp, index) => (
                    <div className="follow-up-answer" key={`${followUp.question}-${index}`}>
                      <span>{followUp.question}</span>
                      <strong>{followUp.answer}</strong>
                    </div>
                  ))}
                  {followUpQuestion ? (
                    <div className="follow-up-input">
                      <h3>{followUpQuestion.text}</h3>
                      {followUpQuestion.type === "choice" ? (
                        <RadioGroup value={followUpAnswer} onChange={(event) => setFollowUpAnswer(event.target.value)}>
                          {(followUpQuestion.options ?? []).map((option) => (
                            <FormControlLabel key={option.id} value={option.id} control={<Radio />} label={option.label} />
                          ))}
                        </RadioGroup>
                      ) : (
                        <TextField
                          fullWidth
                          multiline
                          maxRows={3}
                          value={followUpAnswer}
                          onChange={(event) => setFollowUpAnswer(event.target.value)}
                        />
                      )}
                      <Button variant="contained" onClick={saveFollowUp}>Zapisz odpowiedź</Button>
                      <Button onClick={() => setFollowUpQuestion(null)}>Pomiń pytanie</Button>
                    </div>
                  ) : followUps.length < 3 ? (
                    <Button onClick={requestFollowUp} disabled={followUpLoading}>
                      {followUpLoading ? "Szukam pytania…" : "Zadaj mi pytanie dodatkowe"}
                    </Button>
                  ) : (
                    <p>To już wszystkie pytania dodatkowe — możesz wysłać quiz.</p>
                  )}
                </section>
              )}
            </>
          )}
        </section>

        <aside className="saved-results" aria-label="Twoje zapisane wyniki">
          <div className="section-label">Twoje konto</div>
          <h2>Twoje odkrycia</h2>
          <p>Wyniki quizów zapisują się tutaj, żeby można było do nich wrócić.</p>
          {history.length === 0 ? (
            <div className="empty-history">Po pierwszym quizie pojawi się tu Twoja rekomendacja.</div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <button className="history-card history-button" key={item.id} onClick={() => loadPreviousResult(item)}>
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("pl-PL") : "Zapisany wynik"}</span>
                  <strong>{item.archetype?.name ?? "Twój profil kariery"}</strong>
                  {item.archetype?.tagline && <p>{item.archetype.tagline}</p>}
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

export default MeetYou;
