require('reflect-metadata');
const fs = require('fs');
const { PdfService } = require('../dist/results/pdf.service');

const runs = Math.max(1, parseInt(process.argv[2] ?? '1', 10) || 1);
const outFile = process.argv[3] ?? 'pdf-test.pdf';

const path = (type, title, min, max) => ({
  type,
  title,
  description:
    'Opis ścieżki zawodowej, który zajmuje kilka zdań i pokazuje, jak zachowuje się łamanie tekstu w PDF. '.repeat(2),
  whyFit: 'Pasuje do Twoich odpowiedzi o pracy z ludźmi i samodzielnym działaniu.',
  salaryPln: { min, max },
  outlook: 'Branża stabilnie się rozwija, a zapotrzebowanie na specjalistów rośnie.',
  automationRisk: 'low',
});

const profile = {
  archetype: { name: 'Cichy Architekt', tagline: 'Układasz chaos w plan, który działa.' },
  traits: [
    { key: 'creativity', label: 'Kreatywność', value: 72 },
    { key: 'analytical', label: 'Myślenie analityczne', value: 81 },
    { key: 'stress_resilience', label: 'Odporność na stres', value: 55 },
    { key: 'leadership', label: 'Przywództwo', value: 48 },
    { key: 'empathy', label: 'Empatia', value: 66 },
    { key: 'independence', label: 'Samodzielność', value: 77 },
  ],
  explanation:
    'Z Twoich odpowiedzi wynika, że lubisz konkretne zadania i jasny cel. Wybierasz samodzielną pracę, ale chętnie dzielisz się wiedzą. '.repeat(3),
  paths: [
    path('safe', 'Architekt wnętrz', 5500, 9500),
    path('surprising', 'Projektant usług', 6000, 11000),
    path('future', 'Specjalista ds. zrównoważonego budownictwa', 6500, 12000),
  ],
  skills: {
    hard: ['Projektowanie przestrzeni', 'Czytanie rysunków technicznych', 'Kosztorysowanie'],
    soft: ['Komunikacja z klientem', 'Organizacja pracy', 'Cierpliwość'],
  },
  roadmap: {
    forPath: 'safe',
    months3: ['Poznaj podstawy projektowania', 'Zrób mały projekt własnego pokoju', 'Obejrzyj portfolia'],
    months6: ['Naucz się rysunku technicznego', 'Zrób praktykę', 'Zbuduj pierwsze portfolio'],
    months12: ['Zgłoś się na studia lub kurs', 'Weź udział w konkursie', 'Znajdź mentora'],
  },
  learningAreas: [{ area: 'Ergonomia przestrzeni', why: 'Bo to podstawa dobrego projektu' }],
};

const fakeRepo = { findOwned: async () => ({ id: 'test', user_id: 'test', profile }) };
const service = new PdfService(fakeRepo);

(async () => {
  const times = [];
  let last;
  for (let i = 0; i < runs; i++) {
    const t = performance.now();
    last = await service.generateProfilePdf('test', 'test');
    times.push(performance.now() - t);
  }
  fs.writeFileSync(outFile, last);

  const sorted = [...times].sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\nZapisano: ${outFile} (${(last.length / 1024).toFixed(0)} KB)`);
  console.log(`Przebiegi: ${runs}`);
  console.log(`Pierwszy: ${times[0].toFixed(0)} ms (z rozgrzewką)`);
  console.log(`Min: ${sorted[0].toFixed(0)} ms | mediana: ${sorted[Math.floor(sorted.length / 2)].toFixed(0)} ms | średnia: ${avg.toFixed(0)} ms | max: ${sorted[sorted.length - 1].toFixed(0)} ms`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
