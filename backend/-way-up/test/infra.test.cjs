require("reflect-metadata");
const assert = require("node:assert/strict");
const test = require("node:test");
const Groq = require("groq-sdk").default ?? require("groq-sdk");

const { QuestionsTokenService } = require("../dist/questions/questions-token.service.js");
const { ParseSubmissionPipe } = require("../dist/quiz/pipes/parse-submission.pipe.js");
const { formatSubmission, toStoredAnswers } = require("../dist/quiz/quiz.utils.js");
const { consume, resetRateLimits } = require("../dist/common/rate-limit.guard.js");
const { GroqService, AiOverloadedException } = require("../dist/ai/groq.service.js");
const { MentorService } = require("../dist/mentor/mentor.service.js");
const { QuestionsService } = require("../dist/questions/questions.service.js");

const config = (secret) => ({
  get: (k) => (k === "QUESTIONS_SECRET" ? secret : undefined),
  getOrThrow: () => "fallback-key",
});

const dynamic = [
  {
    id: "5",
    block: 2,
    type: "choice",
    label: "Styl nauki",
    text: "Jak najchętniej się uczysz?",
    options: [
      { id: "o1", label: "Z filmów" },
      { id: "o2", label: "Z książek" },
    ],
  },
  { id: "6", block: 2, type: "slider", label: "Tempo", text: "Jak wolisz pracować?", minLabel: "Spokojnie", maxLabel: "Szybko" },
];

test("token: podpis i odczyt zwracają te same pytania", () => {
  const svc = new QuestionsTokenService(config("s1"));
  const back = svc.verify(svc.sign(dynamic));
  assert.deepEqual(back, dynamic);
});

test("token: podrobiony, zmieniony, wygasły lub z innym sekretem jest odrzucany", () => {
  const svc = new QuestionsTokenService(config("s1"));
  const token = svc.sign(dynamic);
  const [body, sig] = token.split(".");
  const tampered = Buffer.from(JSON.stringify({ v: 1, exp: 9999999999, q: [] })).toString("base64url");

  assert.equal(svc.verify(`${tampered}.${sig}`), null);
  assert.equal(svc.verify(`${body}.AAAA`), null);
  assert.equal(svc.verify("śmieci"), null);
  assert.equal(svc.verify(svc.sign(dynamic, -10)), null);
  assert.equal(new QuestionsTokenService(config("inny")).verify(token), null);
});

test("pipe: z tokenem akceptuje pytania dynamiczne i zapisuje etykiety poprawnie", () => {
  const svc = new QuestionsTokenService(config("s1"));
  const pipe = new ParseSubmissionPipe(svc);
  const submission = pipe.transform({
    answers: { "0": "liceum", "5": "o2", "6": "80" },
    followUps: [],
    questionsToken: svc.sign(dynamic),
  });

  assert.equal(formatSubmission(submission), [
    "- Etap edukacji: Liceum",
    "- Styl nauki: Z książek",
    "- Tempo: 80/100 (0 = Spokojnie, 100 = Szybko)",
  ].join("\n"));
  assert.equal(toStoredAnswers(submission)[1].answerText, "Z książek");
});

test("pipe: dwóch użytkowników z różnymi zestawami się nie miesza", () => {
  const svc = new QuestionsTokenService(config("s1"));
  const pipe = new ParseSubmissionPipe(svc);
  const other = [{ ...dynamic[0], label: "Inna etykieta", options: [{ id: "o1", label: "Podcast" }, { id: "o2", label: "Kurs" }] }];

  const a = pipe.transform({ answers: { "5": "o1" }, questionsToken: svc.sign(dynamic) });
  const b = pipe.transform({ answers: { "5": "o1" }, questionsToken: svc.sign(other) });

  assert.equal(formatSubmission(a), "- Styl nauki: Z filmów");
  assert.equal(formatSubmission(b), "- Inna etykieta: Podcast");
});

test("pipe: zły token = 400, brak tokenu i nieznane id = 400 jak dotąd", () => {
  const svc = new QuestionsTokenService(config("s1"));
  const pipe = new ParseSubmissionPipe(svc);
  const msg = (re) => (e) => e.getStatus() === 400 && re.test(e.getResponse().error);
  assert.throws(() => pipe.transform({ answers: { "0": "liceum" }, questionsToken: "zly" }), msg(/wygasł lub jest nieprawidłowy/));
  assert.throws(() => pipe.transform({ answers: { "5": "o1" }, followUps: [] }), msg(/Nieznane pytanie/));
  assert.equal(formatSubmission(pipe.transform({ answers: { "0": "liceum" } })), "- Etap edukacji: Liceum");
});

test("rate limit: okno przesuwane blokuje po limicie i zwalnia po czasie", () => {
  resetRateLimits();
  const t0 = 1_000_000;
  assert.equal(consume("k", 2, 60_000, t0).allowed, true);
  assert.equal(consume("k", 2, 60_000, t0 + 1000).allowed, true);
  const blocked = consume("k", 2, 60_000, t0 + 2000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSec, 58);
  assert.equal(consume("inny", 2, 60_000, t0 + 2000).allowed, true);
  assert.equal(consume("k", 2, 60_000, t0 + 61_000).allowed, true);
});

test("groq: 429 po ponowieniach SDK zamienia się w AiOverloadedException (503)", async () => {
  const svc = new GroqService({ getOrThrow: () => "x", get: () => undefined });
  svc.client = { chat: { completions: { create: async () => { throw new Groq.RateLimitError(429, undefined, "limit", {}); } } } };
  await assert.rejects(() => svc.complete([{ role: "user", content: "hej" }]), (e) => e instanceof AiOverloadedException && e.getStatus() === 503);
});

test("follow-up: prompt zawiera czytelne odpowiedzi (etykiety), nie surowe id", async () => {
  let seen = "";
  const fake = {
    complete: async (messages) => {
      seen = messages[1].content;
      return JSON.stringify({ type: "text", text: "Co dało Ci ostatnio poczucie sukcesu?" });
    },
  };
  const svc = new QuestionsService(fake);
  const pipe = new ParseSubmissionPipe(new QuestionsTokenService(config("s1")));
  const submission = pipe.transform({ answers: { "0": "technikum" } });
  const orig = Math.random;
  Math.random = () => 0;
  try {
    const q = await svc.generateFollowUp(submission);
    assert.equal(q.type, "text");
  } finally {
    Math.random = orig;
  }
  assert.match(seen, /Etap edukacji: Technikum \/ szkoła branżowa/);
  assert.doesNotMatch(seen, /"0":\s*"technikum"/);
});

test("follow-up: przy przeciążeniu Groqa zwraca null i nie ponawia", async () => {
  let calls = 0;
  const svc = new QuestionsService({ complete: async () => { calls++; throw new AiOverloadedException(); } });
  const q = await svc.generateFollowUp({ answers: { "0": "liceum" }, followUps: [] });
  assert.equal(q, null);
  assert.equal(calls, 1);
});

function mentorWith({ chunks, english = false }) {
  const saved = [];
  const groq = {
    async *stream() { for (const c of chunks) yield c; },
    complete: async () => "Spokojnie, razem to ogarniemy w kilku krokach.",
  };
  const results = {
    findOwned: async () => ({
      answers: [],
      profile: {
        archetype: { name: "A", tagline: "t" },
        skills: { hard: ["x"], soft: ["y"] },
        roadmap: { months3: ["a"] },
        paths: [{ type: "safe", title: "Zawód", description: "d", whyFit: "w" }],
      },
    }),
  };
  const messages = {
    countUserMessages: async () => 0,
    thread: async () => [],
    saveExchange: async (x) => { saved.push(x); return true; },
  };
  return { svc: new MentorService(groq, results, messages), saved };
}

test("mentor stream: wysyła delty, na końcu done z oczyszczonym tekstem i zapisuje", async () => {
  const { svc, saved } = mentorWith({ chunks: ["**Cześć", "!** To ", "`plan`."] });
  const session = await svc.startStream("u", "r", "safe", "Hej");
  const events = [];
  for await (const e of session.events()) events.push(e);

  assert.deepEqual(events.slice(0, 3).map((e) => e.text), ["Cześć", "! To ", "plan."]);
  const done = events.at(-1);
  assert.equal(done.type, "done");
  assert.equal(done.reply, "Cześć! To plan.");
  assert.equal(saved.length, 1);
  assert.equal(saved[0].reply, "Cześć! To plan.");
});

test("mentor stream: odpowiedź po angielsku jest po cichu zastępowana w done", async () => {
  const en = "You can do this and we will have what you need for the future of your career.";
  const { svc, saved } = mentorWith({ chunks: [en] });
  const session = await svc.startStream("u", "r", "safe", "Hej");
  const events = [];
  for await (const e of session.events()) events.push(e);
  assert.equal(events.at(-1).reply, "Spokojnie, razem to ogarniemy w kilku krokach.");
  assert.equal(saved[0].reply, events.at(-1).reply);
});

test("mentor stream: przerwanie przez klienta nie zapisuje urwanej odpowiedzi", async () => {
  const { svc, saved } = mentorWith({ chunks: ["a", "b"] });
  const session = await svc.startStream("u", "r", "safe", "Hej");
  const ac = new AbortController();
  ac.abort();
  const events = [];
  for await (const e of session.events(ac.signal)) events.push(e);
  assert.equal(events.some((e) => e.type === "done"), false);
  assert.equal(saved.length, 0);
});
