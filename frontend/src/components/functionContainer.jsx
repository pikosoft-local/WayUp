import React from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";

function TextQuestion({ label, value, onChange, placeholder = "Nie musisz mieć gotowej odpowiedzi" }) {
  const id = React.useId();

  return (
    <FormControl className="question-form">
      <FormLabel id={`${id}-label`} className="question-label">
        {label}
      </FormLabel>
      <TextField
        id={`${id}-input`}
        aria-labelledby={`${id}-label`}
        className="question-text"
        multiline
        minRows={3}
        maxRows={5}
        fullWidth
        slotProps={{ htmlInput: { maxLength: 500 } }}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="question-hint">Możesz odpowiedzieć krótko — do 500 znaków.</span>
    </FormControl>
  );
}

function RadioQuestion({ label, options, value, onChange }) {
  const id = React.useId();

  return (
    <FormControl className="question-form">
      <FormLabel id={`${id}-label`} className="question-label">
        {label}
      </FormLabel>
      <RadioGroup
        aria-labelledby={`${id}-label`}
        className="answer-options"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option}
            value={option}
            control={<Radio />}
            label={option}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

function MultiSelectQuestion({ label, options, value, onChange }) {
  const id = React.useId();
  const selected = Array.isArray(value) ? value : [];

  function toggle(option) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  }

  return (
    <FormControl className="question-form">
      <FormLabel id={`${id}-label`} className="question-label">
        {label}
      </FormLabel>
      <FormGroup aria-labelledby={`${id}-label`} className="answer-options answer-grid">
        {options.map((option) => (
          <FormControlLabel
            key={option}
            control={
              <Checkbox checked={selected.includes(option)} onChange={() => toggle(option)} />
            }
            label={option}
          />
        ))}
      </FormGroup>
      <span className="question-hint">Możesz zaznaczyć kilka odpowiedzi.</span>
    </FormControl>
  );
}

function Q_1(props) {
  return (
    <RadioQuestion
      {...props}
      label="Na jakim etapie edukacji jesteś?"
      options={[
        "Szkoła podstawowa",
        "Liceum",
        "Technikum",
        "Szkoła branżowa",
        "Studia lub przerwa po szkole",
        "Inny etap",
      ]}
    />
  );
}

function Q_2(props) {
  return (
    <MultiSelectQuestion
      {...props}
      label="Które zadania brzmią dla Ciebie najbardziej naturalnie?"
      options={[
        "Rozgryźć trudną zagadkę",
        "Zbudować albo naprawić coś",
        "Wymyślić coś kreatywnego",
        "Pomóc komuś ogarnąć problem",
        "Zorganizować ludzi i plan",
        "Wyszukać i porównać informacje",
        "Przekonać innych do pomysłu",
        "Zrobić coś w terenie",
      ]}
    />
  );
}

function Q_3(props) {
  return (
    <RadioQuestion
      {...props}
      label="Kiedy czujesz największą satysfakcję?"
      options={[
        "Gdy coś działa dzięki mnie",
        "Gdy ktoś poczuje się lepiej",
        "Gdy mam pomysł, którego nie było",
        "Gdy rozumiem, jak coś działa",
        "Gdy domykam konkretny cel",
        "Gdy jeszcze tego nie wiem",
      ]}
    />
  );
}

function Q_4(props) {
  return (
    <RadioQuestion
      {...props}
      label="Dostajesz nowe zadanie bez instrukcji. Co robisz najpierw?"
      options={[
        "Zaczynam testować i uczę się po drodze",
        "Rozpisuję plan krok po kroku",
        "Szukam przykładu albo pytam kogoś",
        "Najpierw sprawdzam, jaki ma być efekt",
        "Wymyślam kilka możliwych rozwiązań",
      ]}
    />
  );
}

function Q_5(props) {
  return (
    <RadioQuestion
      {...props}
      label="Co najchętniej bierzesz na warsztat?"
      options={[
        "Relacje i potrzeby ludzi",
        "Pomysły, teksty i obrazy",
        "Dane, liczby i zależności",
        "Technologię i urządzenia",
        "Rzeczy, które można zrobić rękami",
        "Różne tematy — zależy od dnia",
      ]}
    />
  );
}

function Q_6(props) {
  return (
    <TextQuestion
      {...props}
      label="Co robisz w wolnym czasie tak, że tracisz poczucie czasu?"
      placeholder="Np. montuję filmiki, trenuję, składam komputery, czytam o kosmosie…"
    />
  );
}

function Q_7(props) {
  return (
    <TextQuestion
      {...props}
      label="Z czym znajomi najczęściej przychodzą właśnie do Ciebie?"
      placeholder="Może proszą Cię o radę, pomoc techniczną, pomysł albo dobrą organizację?"
    />
  );
}

function Q_8(props) {
  return (
    <RadioQuestion
      {...props}
      label="Jak czujesz się, gdy trzeba szybko opanować coś nowego?"
      options={[
        "Lubię wskoczyć na głęboką wodę",
        "Próbuję, jeśli mam dobry przykład",
        "Wolę spokojnie rozłożyć temat na części",
        "Potrzebuję chwili, żeby się przekonać",
      ]}
    />
  );
}

function Q_9(props) {
  return (
    <RadioQuestion
      {...props}
      label="Wolisz pracę, w której…"
      options={[
        "Wymyślasz nowe rozwiązania",
        "Dopracowujesz szczegóły i jakość",
        "Szukasz przyczyn i wyciągasz wnioski",
        "Rozmawiasz i wspierasz innych",
        "Łączysz kilka różnych zadań",
      ]}
    />
  );
}

function Q_10(props) {
  return (
    <RadioQuestion
      {...props}
      label="Który rytm pracy najbardziej Ci pasuje?"
      options={[
        "Dużo zmian i szybkie działanie",
        "Jasny plan i przewidywalne kroki",
        "Samodzielność i własne tempo",
        "Wspólny cel i częsty kontakt z ludźmi",
        "Jeszcze nie wiem",
      ]}
    />
  );
}

function Q_11(props) {
  return (
    <RadioQuestion
      {...props}
      label="W projekcie grupowym zwykle jesteś osobą, która…"
      options={[
        "Wpada na pomysł",
        "Układa plan i pilnuje terminów",
        "Robi konkretną część zadania",
        "Dba o komunikację i dobrą atmosferę",
        "Sprawdza, czy wszystko działa",
        "Zależy od projektu",
      ]}
    />
  );
}

function Q_12(props) {
  return (
    <MultiSelectQuestion
      {...props}
      label="Które tematy naprawdę Cię ciekawią?"
      options={[
        "Technologia i programowanie",
        "Zdrowie i psychologia",
        "Sztuka, film i design",
        "Biznes i nowe pomysły",
        "Przyroda i klimat",
        "Sport i aktywność",
        "Nauka i eksperymenty",
        "Media, języki i komunikacja",
        "Prawo i sprawy społeczne",
        "Rzemiosło i praca praktyczna",
      ]}
    />
  );
}

function Q_13(props) {
  return (
    <RadioQuestion
      {...props}
      label="Co najbardziej odbiera Ci energię?"
      options={[
        "Powtarzanie ciągle tego samego",
        "Brak jasnego celu",
        "Długie siedzenie bez ruchu",
        "Ciągłe rozmowy i hałas",
        "Presja czasu",
        "Każdy dzień jest inny — trudno wybrać",
      ]}
    />
  );
}

function Q_14(props) {
  return (
    <TextQuestion
      {...props}
      label="Jakiej umiejętności chciał(a)byś się nauczyć w najbliższym roku?"
      placeholder="Nie musi to być coś związanego z konkretnym zawodem."
    />
  );
}

function Q_15(props) {
  return (
    <RadioQuestion
      {...props}
      label="W jakim miejscu najłatwiej wyobrazić Ci sobie dobrą pracę?"
      options={[
        "Biuro albo praca zdalna",
        "Pracownia, studio lub laboratorium",
        "Warsztat albo praca techniczna",
        "Szkoła, szpital lub miejsce pomocy innym",
        "W terenie, w ruchu",
        "Jeszcze nie mam wyobrażenia",
      ]}
    />
  );
}

function Q_16(props) {
  return (
    <RadioQuestion
      {...props}
      label="Jaki efekt swojej pracy chciał(a)byś widzieć?"
      options={[
        "Ktoś rozwiązał swój problem",
        "Powstała rzecz, której wcześniej nie było",
        "Coś działa szybciej albo lepiej",
        "Ludzie lepiej się rozumieją",
        "Mam konkretny wynik i poczucie postępu",
        "Nie wiem — chcę różnych doświadczeń",
      ]}
    />
  );
}

function Q_17(props) {
  return (
    <TextQuestion
      {...props}
      label="Jaki mały projekt albo wydarzenie chętnie byś stworzył(a)?"
      placeholder="Np. szkolny podcast, turniej, aplikację, zbiórkę, własną markę…"
    />
  );
}

function Q_18(props) {
  return (
    <RadioQuestion
      {...props}
      label="Co najbardziej liczy się dla Ciebie w przyszłej pracy?"
      options={[
        "Stabilność i poczucie bezpieczeństwa",
        "Swoboda i niezależność",
        "Dobre zarobki",
        "Kreatywność i rozwój",
        "Pomaganie ludziom lub zmienianie świata",
        "Fajny zespół i dobra atmosfera",
      ]}
    />
  );
}

function Q_19(props) {
  return (
    <TextQuestion
      {...props}
      label="O jakim temacie ostatnio najchętniej oglądasz, czytasz albo googlujesz?"
      placeholder="Wpisz temat, który sam z siebie przyciąga Twoją uwagę."
    />
  );
}

function Q_20(props) {
  return (
    <TextQuestion
      {...props}
      label="Jaki pierwszy krok możesz zrobić, żeby sprawdzić, czy ten kierunek Ci pasuje?"
      placeholder="Np. obejrzeć dzień z życia…, pogadać z…, zrobić mini-projekt…"
    />
  );
}

export {
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
};
