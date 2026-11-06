import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import { supabase } from "../auth/supabaseClient";
import "./deleteDialogs.css";

const CONFIRMATION_WORD = "USUŃ";
const DRAFT_KEY_PREFIX = "wayup.quizDraft.";

const dialogSlotProps = { paper: { className: "delete-dialog" } };

function clearLocalDrafts() {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(DRAFT_KEY_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
  }
}

export function ConfirmDeleteResultDialog({ open, busy, error, onCancel, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onCancel}
      slotProps={dialogSlotProps}
      aria-labelledby="delete-result-title"
      aria-describedby="delete-result-description"
    >
      <DialogTitle id="delete-result-title">Usunąć ten wynik?</DialogTitle>
      <DialogContent id="delete-result-description">
        <p>
          Wynik, Twoje odpowiedzi z tego quizu i rozmowa z mentorem zostaną trwale usunięte.
          Jeśli ten wynik był udostępniony, link przestanie działać.
        </p>
        <p>Tego nie da się cofnąć.</p>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button className="delete-cancel" onClick={onCancel} disabled={busy}>
          Anuluj
        </Button>
        <Button
          className="delete-confirm"
          variant="contained"
          onClick={onConfirm}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {busy ? "Usuwam…" : "Usuń wynik"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function DeleteAccountDialog({ onClose }) {
  const navigate = useNavigate();
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState("confirm");
  const [error, setError] = useState("");

  const confirmed = typed.trim().toLocaleUpperCase("pl-PL") === CONFIRMATION_WORD;
  const busy = phase === "busy";
  const done = phase === "done";

  async function handleDelete() {
    if (!confirmed || busy) return;
    setPhase("busy");
    setError("");
    try {
      await apiRequest("/account", { method: "DELETE", body: { confirm: CONFIRMATION_WORD } });
      clearLocalDrafts();
      setPhase("done");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nie udało się usunąć konta.");
      setPhase("confirm");
    }
  }

  async function handleFinish() {
    navigate("/", { replace: true });
    try {
      if (supabase) await supabase.auth.signOut({ scope: "local" });
    } catch {
    }
  }

  return (
    <Dialog
      open
      onClose={busy || done ? undefined : onClose}
      slotProps={dialogSlotProps}
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-description"
    >
      {done ? (
        <>
          <DialogTitle id="delete-account-title">Konto zostało usunięte</DialogTitle>
          <DialogContent id="delete-account-description">
            <p>Usunęliśmy Twoje wyniki, odpowiedzi, rozmowy z mentorem i konto logowania.</p>
          </DialogContent>
          <DialogActions>
            <Button className="delete-cancel" onClick={handleFinish} autoFocus>
              Wróć na stronę główną
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle id="delete-account-title">Usunąć konto i wszystkie dane?</DialogTitle>
          <DialogContent id="delete-account-description">
            <p>Razem z kontem trwale usuniemy:</p>
            <ul className="delete-dialog-list">
              <li>wszystkie Twoje wyniki, odpowiedzi i profile,</li>
              <li>rozmowy z mentorem AI,</li>
              <li>linki do udostępniania, które przestaną działać,</li>
              <li>samo konto logowania.</li>
            </ul>
            <p>Tego nie da się cofnąć. Żeby potwierdzić, wpisz {CONFIRMATION_WORD}.</p>
            <TextField
              fullWidth
              size="small"
              autoFocus
              autoComplete="off"
              label={`Wpisz ${CONFIRMATION_WORD}`}
              value={typed}
              disabled={busy}
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleDelete();
              }}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button className="delete-cancel" onClick={onClose} disabled={busy}>
              Anuluj
            </Button>
            <Button
              className="delete-confirm"
              variant="contained"
              onClick={handleDelete}
              disabled={!confirmed || busy}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {busy ? "Usuwam…" : "Usuń konto"}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}