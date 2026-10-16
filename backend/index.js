// import express from "express";

// import bodyParser from "body-parser";

// import cors from "cors";


// import env from "dotenv";
// import 'dotenv/config';
// import Groq from "groq-sdk";
// import { v4 as uuidv4 } from "uuid";

// import pg from "pg";

// const app = express();
// const port = 3000;

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json()); 
// app.use(cors());


// //pgAdmin 
// // const db = new pg.Client({
// //   user: process.env.PG_USER,
// //   host: process.env.PG_HOST,
// //   database: process.env.PG_DATABASE,
// //   password: process.env.PG_PASSWORD,
// //   port: process.env.PG_PORT,
// //   connectionString: process.env.DATABASE_URL,
// //   ssl: {
// //     rejectUnauthorized: false
// //   }
// // });
// // db.connect();

// //------------------------------------------
// const QUESTIONS = {
//   0: "Etap edukacji",
//   1: "Gry z dzieciństwa",
//   2: "Ludzie czy komputery",
//   3: "Morze czy góry",
//   4: "Miasto czy natura",
//   5: "Co robi w wolnym czasie",
//   6: "Co potrafi robić godzinami",
//   7: "Jak szybko się nudzi",
//   8: "Tworzyć czy analizować",
//   9: "Działać czy planować",
//   10: "Rywalizacja czy współpraca",
//   11: "Ulubiony przedmiot",
//   12: "Przedmiot, którego unika",
//   13: "Co chciałby umieć",
//   14: "Gdzie chciałby pracować",
//   15: "Zawód, który go ciekawi",
//   16: "Gra, która go opisuje",
//   17: "Pomysł na własną firmę",
//   18: "Co najczęściej googluje",
//   19: "Kanał na YouTube, który ogląda",
// };

// function formatAnswers(answers) {
//   return Object.entries(answers)
//     .map(([k, v]) => `- ${QUESTIONS[k] ?? k}: ${Array.isArray(v) ? v.join(", ") : v}`)
//     .join("\n");
// }

// function countSentences(text) {
//   return (text.match(/[.!?]+(\s|$)/g) || []).length;
// }

// const SYSTEM_PROMPT = `Jesteś doradcą zawodowym dla nastolatków, który komunikuje się WYŁĄCZNIE w języku młodzieżowym używanym w Polsce w 2026 roku — luźno, z dystansem, bez belferskiego tonu, ale merytorycznie trafnie.

// ZASADY:
// 1. Odpowiedz DOKŁADNIE w 4 zdaniach. Nie więcej, nie mniej.
// 2. Styl: młodzieżowy, swobodny, ale zrozumiały — bez przesady w slangu (max 1-2 mocne slangowe słowa na całość). Slang ma być przyprawą, nie treścią. Nie wymyślaj słów, których nie jesteś pewny — lepiej naturalny, luźny język 20-latka niż wymuszony neologizm.
// 3. Struktura 4 zdań:
//    - Zdanie 1: krótka "diagnoza" na podstawie odpowiedzi (co z nich wynika o osobie)
//    - Zdanie 2-3: konkretna sugestia kierunku/zawodu/ścieżki nauki, powiązana z realnymi odpowiedziami użytkownika (nie ogólnikami)
//    - Zdanie 4: motywujący, lekki call-to-action / pierwszy krok
// 4. Zero moralizowania, zero "powinieneś", zero sztywnych fraz typu "w dzisiejszych czasach".
// 5. Odwołuj się do KONKRETNYCH odpowiedzi usera (np. gry, przedmioty, zainteresowania), żeby brzmiało spersonalizowanie, a nie jak horoskop.
// 6. Nie sugeruj zawodów sprzecznych z odpowiedziami (np. jeśli user unika ludzi, nie proponuj sprzedaży).
// 7. Odpowiadaj tylko czystym tekstem — bez nagłówków, bez punktowania, bez cudzysłowów wokół całości.
// 8. Jeśli odpowiedzi jest mało (np. tylko kilka pytań na 20), oprzyj się na tym, co masz — nie pisz o brakujących danych, nie proś o dokończenie quizu, po prostu wyciągnij jak najwięcej sensu z dostępnych informacji.`;

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// async function callGroq(answers) {
//   const userPrompt = `Oto odpowiedzi użytkownika z quizu zawodowego:\n\n${formatAnswers(answers)}\n\nNa tej podstawie napisz spersonalizowaną sugestię dalszej ścieżki zawodowej/edukacyjnej, zgodnie z zasadami stylu z instrukcji systemowej.`;
//   console.log("Before completion");
  
//   const completion = await groq.chat.completions.create({
//     model: "openai/gpt-oss-20b",
//     temperature: 0.85,
//     max_tokens: 300,
//     messages: [
//       { role: "system", content: SYSTEM_PROMPT },
//       { role: "user", content: userPrompt },
//     ],
//   });
//   console.log("After completion");
//   console.log(completion.choices[0].message.content.trim());
//   console.log("After Log");
//   return completion.choices[0].message.content.trim();
// }

// //Express
// app.get("/", (req, res) => {
  
  
// });




// const MIN_FILLED_ANSWERS = 1;

// function countFilledAnswers(answers) {
//   return Object.values(answers).filter((v) => {
//     if (Array.isArray(v)) return v.length > 0;
//     return typeof v === "string" && v.trim() !== "";
//   }).length;
// }

// app.post("/SendHandler", async (req, res) => {
//   const answers = req.body;
//   const requestId = uuidv4();
//   console.log(requestId, answers);

//   // const filled = countFilledAnswers(answers);
//   // if (filled < MIN_FILLED_ANSWERS) {
//   //   console.warn(requestId, `Za mało wypełnionych odpowiedzi: ${filled}/${MIN_FILLED_ANSWERS}`);
//   //   return res.status(400).json({
//   //     ok: false,
//   //     error: `Uzupełnij quiz (min. ${MIN_FILLED_ANSWERS} odpowiedzi) przed wysłaniem.`,
//   //   });
//   // }

//   try {
//     let result = await callGroq(answers);

//     let attempts = 0;
//     while (countSentences(result) !== 4 && attempts < 2) {
      
//       result = await callGroq(answers);
//       attempts++;
//     }

//     res.status(200).json({ ok: true, result, requestId });
//   } catch (err) {
//     console.error(requestId, err);
//     res.status(500).json({ ok: false, error: "Nie udało się wygenerować odpowiedzi." });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
