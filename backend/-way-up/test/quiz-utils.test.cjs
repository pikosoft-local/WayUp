const assert = require("node:assert/strict");
const test = require("node:test");
const {
  answerParts,
  countFilledAnswers,
  countSentences,
  describeAnswer,
  formatSubmission,
  toStoredAnswers,
} = require("../dist/quiz/quiz.utils.js");

test("answerParts trims values and discards empty answers", () => {
  assert.deepEqual(answerParts(["  rysuję ", "", " koduję  "]), ["rysuję", "koduję"]);
});

test("countFilledAnswers ignores whitespace-only answers", () => {
  assert.equal(countFilledAnswers({ first: "gotowe", second: [" ", ""], third: ["sport"] }), 2);
});

test("describeAnswer clamps slider values to its supported range", () => {
  assert.equal(
    describeAnswer({ type: "slider", minLabel: "Ludzie", maxLabel: "Komputery" }, "150"),
    "100/100 (0 = Ludzie, 100 = Komputery)",
  );
});

test("formatSubmission uses question labels and skips blank answers", () => {
  assert.equal(
    formatSubmission({
      answers: { "0": "liceum", "1": " " },
      followUps: [{ question: "Co lubisz tworzyć?", answer: "  gry " }],
    }),
    "- Etap edukacji: Liceum\n- Co lubisz tworzyć?: gry",
  );
});

test("toStoredAnswers preserves answers and adds follow-ups", () => {
  assert.deepEqual(
    toStoredAnswers({
      answers: { "0": "liceum" },
      followUps: [{ question: "Co lubisz?", answer: "sport" }],
    }),
    [
      {
        id: "0",
        question: "Etap edukacji",
        answer: "liceum",
        answerText: "Liceum",
      },
      {
        id: "f1",
        question: "Co lubisz?",
        answer: "sport",
        answerText: "sport",
      },
    ],
  );
});

test("countSentences counts sentence-ending punctuation groups", () => {
  assert.equal(countSentences("Mam plan. Widzę opcje?!"), 2);
});
