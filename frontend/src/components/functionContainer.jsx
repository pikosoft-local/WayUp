import React from "react";

import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";

import FormGroup from "@mui/material/FormGroup";
import Checkbox from "@mui/material/Checkbox";

import Stack from "@mui/material/Stack";

import TextField from "@mui/material/TextField";

const textFieldSx = {
  "& .MuiInputBase-root": {
    fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
    paddingTop: "8px",
    paddingBottom: "8px",
  },
  "& .MuiInputLabel-root": {
    fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(0, -1.5px) scale(0.75)",
  },
};

function TextQuestion({ label, value, onChange }) {
  const id = React.useId();
  return (
    <FormControl className="FormControl">
      <FormLabel id={`${id}-label`} className="FormLabel">
        {label}
      </FormLabel>
      <div
        className="TextFields"
        style={{ width: "100%", padding: "0 16px", boxSizing: "border-box" }}
      >
        <TextField
          id={`${id}-input`}
          label=""
          multiline
          maxRows={4}
          variant="standard"
          fullWidth
          placeholder="Wpisz tutaj"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          sx={textFieldSx}
        />
      </div>
    </FormControl>
  );
}

function Q_1({ value, onChange }) {
  const id = React.useId();
  return (
    <FormControl className="FormControl">
      <FormLabel id={`${id}-label`} className="FormLabel">
        Gdzie jesteś teraz?
      </FormLabel>

      <RadioGroup
        className="RadioGroup"
        aria-labelledby={`${id}-label`}
        name="radio-buttons-group"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <FormControlLabel
          value="Szkoła_podstawowa"
          control={<Radio id="radio" />}
          label="Szkoła podstawowa"
        />
        <FormControlLabel
          value="Liceum_technikum"
          control={<Radio id="radio" />}
          label="Liceum / technikum"
        />
        <FormControlLabel value="Studia" control={<Radio id="radio" />} label="Studia" />
        <FormControlLabel
          value="Chcę_się_przebranżowić"
          control={<Radio id="radio" />}
          label="Chcę się przebranżowić"
        />
        <FormControlLabel
          value="Jeszcze_nie_wiem"
          control={<Radio id="radio" />}
          label="Jeszcze nie wiem"
        />
      </RadioGroup>
    </FormControl>
  );
}

function Q_2({ value, onChange }) {
  const id = React.useId();
  const selected = Array.isArray(value) ? value : [];

  const toggle = (label) => {
    if (selected.includes(label)) {
      onChange(selected.filter((v) => v !== label));
    } else {
      onChange([...selected, label]);
    }
  };

  const options = [
    ["Symulatory", "Gry logiczne", "Akcji", "RPG"],
    ["Strategie", "Sportowe", "Survival", "Horrory"],
  ];

  return (
    <FormGroup>
      <FormControl className="FormControl">
        <FormLabel id={`${id}-label`} className="FormLabel">
          W co grałeś jako dziecko?
        </FormLabel>
        <FormGroup className="CheckBoxGroup">
          <Stack spacing={2} direction="row">
            {options.map((col, colIndex) => (
              <Stack key={colIndex}>
                {col.map((label) => (
                  <FormControlLabel
                    key={label}
                    control={
                      <Checkbox
                        checked={selected.includes(label)}
                        onChange={() => toggle(label)}
                      />
                    }
                    label={label}
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        </FormGroup>
      </FormControl>
    </FormGroup>
  );
}

function RadioQuestion({ label, options, value, onChange }) {
  const id = React.useId();
  return (
    <FormControl className="FormControl">
      <FormLabel id={`${id}-label`} className="FormLabel">
        {label}
      </FormLabel>

      <RadioGroup
        className="RadioGroup"
        aria-labelledby={`${id}-label`}
        name="radio-buttons-group"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <FormControlLabel
            key={opt}
            value={opt}
            control={<Radio id="radio" />}
            label={opt}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

function Q_3({ value, onChange }) {
  return (
    <RadioQuestion
      label="Wolisz ludzi czy komputery?"
      options={["ludzi", "komputery", "Nic", "Obydwa"]}
      value={value}
      onChange={onChange}
    />
  );
}

function Q_4({ value, onChange }) {
  return (
    <RadioQuestion
      label="Morze czy góry?"
      options={["Morze", "Góry", "Nic", "Obydwa"]}
      value={value}
      onChange={onChange}
    />
  );
}

function Q_5({ value, onChange }) {
  return (
    <RadioQuestion
      label="Miasto czy natura?"
      options={["Miasto", "Natura", "Nic", "Obydwa"]}
      value={value}
      onChange={onChange}
    />
  );
}

function Q_6({ value, onChange }) {
  return (
    <TextQuestion
      label="Co robisz w wolnym czasie?"
      value={value}
      onChange={onChange}
    />
  );
}

function Q_7({ value, onChange }) {
  return (
    <TextQuestion
      label="Co potrafisz robić godzinami?"
      value={value}
      onChange={onChange}
    />
  );
}

function Q_8({ value, onChange }) {
  return (
    <RadioQuestion
      label="Co szybko Cię nudzi?"
      options={["Strasznie_szybko", "Szybko", "średnio", "Wolno", "Bardzo_Wolno"]}
      value={value}
      onChange={onChange}
    />
  );
}

function Q_9({ value, onChange }) {
  return (
    <RadioQuestion
      label="Wolisz tworzyć czy analizować?"
      options={["Tworzyć", "Analizować", "Obydwa", "Nic"]}
      value={value}
      onChange={onChange}
    />
  );
}

function Q_10({ value, onChange }) {
  return (
    <RadioQuestion
      label="Wolisz działać czy planować?"
      options={["Działać", "Planować", "Obydwa", "Nic"]}
      value={value}
      onChange={onChange}
    />
  );
}

function Q_11({ value, onChange }) {
  return (
    <RadioQuestion
      label="Wolisz rywalizację czy współpracę?"
      options={["Rywalizacja", "Współpraca", "Obydwa", "Nic"]}
      value={value}
      onChange={onChange}
    />
  );
}
function TwoColumnRadioQuestion({ label, value, onChange }) {
  const id = React.useId();
  const left = ["Matematyka", "Język Polski", "Język angielski", "Geografia", "żaden"];
  const right = ["WF", "Biologia", "Fizyka", "Chemia", "Inny"];

  return (
    <FormControl className="FormControl">
      <FormLabel id={`${id}-label`} className="FormLabel">
        {label}
      </FormLabel>

      <RadioGroup
        className="RadioGroup"
        aria-labelledby={`${id}-label`}
        name="radio-buttons-group"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <Stack direction={"row"}>
          <Stack direction={"column"}>
            {left.map((opt) => (
              <FormControlLabel key={opt} value={opt} control={<Radio id="radio" />} label={opt} />
            ))}
          </Stack>
          <Stack direction={"column"}>
            {right.map((opt) => (
              <FormControlLabel key={opt} value={opt} control={<Radio id="radio" />} label={opt} />
            ))}
          </Stack>
        </Stack>
      </RadioGroup>
    </FormControl>
  );
}

function Q_12({ value, onChange }) {
  return (
    <TwoColumnRadioQuestion
      label="Jaki przedmiot lubiłeś w szkole?"
      value={value}
      onChange={onChange}
    />
  );
}

function Q_13({ value, onChange }) {
  return (
    <TwoColumnRadioQuestion
      label="Jaki przedmiot omijałbyś z daleka?"
      value={value}
      onChange={onChange}
    />
  );
}

function Q_14({ value, onChange }) {
  return <TextQuestion label="Co chciałbyś umieć?" value={value} onChange={onChange} />;
}

function Q_15({ value, onChange }) {
  return <TextQuestion label="Gdzie chciałbyś pracować?" value={value} onChange={onChange} />;
}

function Q_16({ value, onChange }) {
  return <TextQuestion label="Jaki zawód Cię ciekawi?" value={value} onChange={onChange} />;
}

function Q_17({ value, onChange }) {
  return <TextQuestion label="Jaka gra Cię opisuje?" value={value} onChange={onChange} />;
}

function Q_18({ value, onChange }) {
  return (
    <TextQuestion label="czym by się zajmowała twoja firma?" value={value} onChange={onChange} />
  );
}

function Q_19({ value, onChange }) {
  return <TextQuestion label="Co najczęściej googlujesz?" value={value} onChange={onChange} />;
}

function Q_20({ value, onChange }) {
  return <TextQuestion label="Jaki kanał na YouTube oglądasz?" value={value} onChange={onChange} />;
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