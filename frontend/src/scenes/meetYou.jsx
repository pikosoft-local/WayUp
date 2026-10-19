import React, { useState } from "react";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import axios from "axios";

import Alert from '@mui/material/Alert';

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

function MeetYou() {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showAlert, setShowAlert] = useState(false);

  const questions = [
    Q_1, Q_2, Q_3, Q_4, Q_5, Q_6, Q_7, Q_8, Q_9, Q_10,
    Q_11, Q_12, Q_13, Q_14, Q_15, Q_16, Q_17, Q_18, Q_19, Q_20,
  ];
  const CurrentQuestion = questions[page];

  const handleAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [page]: value }));
  };

  function checkButton(op) {
    if (op === "+") {
      setPage((p) => Math.min(p + 1, questions.length - 1));
    } else {
      setPage((p) => Math.max(p - 1, 0));
    }
  }

  const handleSubmit = async () => {
    const missing = questions.some((_, i) => {
      const v = answers[i];
      if (Array.isArray(v)) return v.length === 0;
      return v === undefined || v === null || v === "";
    });

    if (missing) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    console.log("Odpowiedzi:", answers);
    try {
      const groqOutput = await axios.post("http://localhost:3000/SendHandler", answers);
      console.log(groqOutput);
    } catch (err) {
      console.error("Błąd wysyłki:", err);
    }
  };

  return (
    <div className="MeetYou">
      <div className="questionBox">
        {showAlert && (
          <Alert severity="warning" sx={{ mb: 2 }} style={{width:"80%",
            alignSelf:"center"
          }}>
            Odpowiedz na wszystkie pytania przed wysłaniem.
          </Alert>
        )}

        <CurrentQuestion
          key={page}
          value={answers[page]}
          onChange={handleAnswer}
        />
        <br />

        <Stack
          spacing={2}
          direction="row"
          style={{ alignSelf: "center", color: "white" }}
        >
          <Button
            className="Button"
            variant="contained"
            onClick={() => checkButton("-")}
            disabled={page === 0}
          >
            {" "}
            wcześniej
          </Button>

          {page === questions.length - 1 ? (
            <Button
              className="Button"
              variant="contained"
              color="success"
              onClick={handleSubmit}
            >
              wyślij
            </Button>
          ) : (
            <Button
              className="Button"
              variant="contained"
              onClick={() => checkButton("+")}
            >
              {" "}
              następne
            </Button>
          )}
        </Stack>
        <br />

        <Stack spacing={1.1} direction="column">
          {[0, 1, 2, 3].map((row) => (
            <Stack
              key={row}
              spacing={1.1}
              direction="row"
              style={{ alignSelf: "center", color: "white" }}
            >
              {questions.slice(row * 5, row * 5 + 5).map((_, i) => {
                const index = row * 5 + i;
                return (
                  <Button
                    key={index}
                    className="Button"
                    sx={{ minWidth: "32px", p: "4px 8px" }}
                    variant="contained"
                    onClick={() => setPage(index)}
                    disabled={page === index}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </Stack>
          ))}
        </Stack>
      </div>
    </div>
  );
}

export default MeetYou;