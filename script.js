/*
    PASSWORD STRENGTH CHECKER
    ==========================

    Scoring model based on the project report:

    Length              = 30%
    Character Variety   = 25%
    Entropy             = 25%
    Pattern Penalty     = -20%

    Password below 8 characters:
    Automatically capped as Weak.

    Strength categories:

    0 - 25    Very Weak
    26 - 50   Weak
    51 - 75   Moderate
    76 - 100  Strong
*/

const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");

const scoreEl = document.getElementById("score");

const labelEl = document.getElementById("strengthLabel");

const meterFill = document.getElementById("meterFill");

const entropyEl = document.getElementById("entropy");

const crackSpaceEl = document.getElementById("crackSpace");

const tipList = document.getElementById("tipList");

const breachBtn = document.getElementById("breachBtn");

const breachResult = document.getElementById("breachResult");

const generateBtn = document.getElementById("generateBtn");

/*
    Common passwords / words
*/

const commonWords = [
  "password",
  "passw0rd",
  "admin",
  "welcome",
  "qwerty",
  "letmein",
  "login",
  "monkey",
  "dragon",
  "football",
  "iloveyou",
  "secret",
  "hello",
  "india",
  "computer",
  "internet",
  "master",
  "summer",
  "winter",
  "spring",
  "autumn",
];

/*
    Analyze Password
*/

function analyzePassword(password) {
  const length = password.length;

  /*
        Character pool

        lowercase = 26
        uppercase = 26
        numbers   = 10
        symbols   = 32
    */

  let R = 0;

  if (/[a-z]/.test(password)) {
    R += 26;
  }

  if (/[A-Z]/.test(password)) {
    R += 26;
  }

  if (/[0-9]/.test(password)) {
    R += 10;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    R += 32;
  }

  /*
        Entropy

        E = L × log2(R)
    */

  const entropy = R && length ? length * Math.log2(R) : 0;

  /*
        Character types
    */

  const hasLower = /[a-z]/.test(password);

  const hasUpper = /[A-Z]/.test(password);

  const hasDigit = /[0-9]/.test(password);

  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  /*
        Character variety

        Maximum = 4 categories
    */

  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(
    Boolean,
  ).length;

  /*
        Pattern detection
    */

  const repeated = /(.)\1{2,}/.test(password);

  const keyboard = /(qwerty|asdf|zxcv|1234|2345|3456|abcd|dcba)/i.test(
    password,
  );

  const sequence = hasSequence(password);

  const common = commonWords.some((word) =>
    password.toLowerCase().includes(word),
  );

  const patternBad = repeated || keyboard || sequence;

  /*
        LENGTH SCORE
        Maximum = 30
    */

  const lengthScore = Math.min(30, Math.max(0, (length / 16) * 30));

  /*
        CHARACTER VARIETY SCORE
        Maximum = 25
    */

  const varietyScore = (variety / 4) * 25;

  /*
        ENTROPY SCORE
        Maximum = 25

        80-bit entropy is used
        as the normalization target.
    */

  const entropyScore = Math.min(25, (entropy / 80) * 25);

  /*
        Combine scores
    */

  let score = lengthScore + varietyScore + entropyScore;

  /*
        Pattern / dictionary penalty
    */

  if (patternBad || common) {
    score -= 20;
  }

  /*
        Keep score between 0 and 100
    */

  score = Math.max(0, Math.min(100, Math.round(score)));

  /*
        Password shorter than 8 characters
        cannot receive a strong classification.
    */

  if (length < 8) {
    score = Math.min(score, 50);
  }

  /*
        Strength category
    */

  let label = "Very Weak";

  if (score >= 76) {
    label = "Strong";
  } else if (score >= 51) {
    label = "Moderate";
  } else if (score >= 26) {
    label = "Weak";
  }

  return {
    length,

    R,

    entropy,

    hasLower,

    hasUpper,

    hasDigit,

    hasSymbol,

    variety,

    repeated,

    keyboard,

    sequence,

    common,

    patternBad,

    score,

    label,
  };
}

/*
    Detect sequential characters
*/

function hasSequence(string) {
  const text = string.toLowerCase();

  for (let i = 0; i < text.length - 2; i++) {
    const first = text.charCodeAt(i);

    const second = text.charCodeAt(i + 1);

    const third = text.charCodeAt(i + 2);

    /*
            Increasing sequence

            abc
            123
            456
        */

    if (second === first + 1 && third === second + 1) {
      return true;
    }

    /*
            Decreasing sequence

            cba
            321
        */

    if (second === first - 1 && third === second - 1) {
      return true;
    }
  }

  return false;
}

/*
    Format search space
*/

function formatSpace(number) {
  if (!number) {
    return "0";
  }

  if (number < 1000000) {
    return Math.round(number).toLocaleString();
  }

  if (number < 1000000000) {
    return (number / 1000000).toFixed(1) + "M";
  }

  if (number < 1000000000000) {
    return (number / 1000000000).toFixed(1) + "B";
  }

  return number.toExponential(2);
}

/*
    Update checklist
*/

function updateCheck(name, good) {
  const item = document.querySelector(`[data-check="${name}"]`);

  item.classList.toggle("good", good);

  item.querySelector(".check-icon").textContent = good ? "✓" : "×";
}

/*
    Render results
*/

function render() {
  const password = passwordInput.value;

  const result = analyzePassword(password);

  /*
        Score
    */

  scoreEl.textContent = result.score;

  /*
        Label
    */

  labelEl.textContent = result.label;

  /*
        Meter
    */

  meterFill.style.width = result.score + "%";

  /*
        Color based on strength
    */

  let color;

  if (result.score >= 76) {
    color = "var(--good)";
  } else if (result.score >= 51) {
    color = "var(--warning)";
  } else {
    color = "var(--danger)";
  }

  meterFill.style.background = color;

  labelEl.style.color = color;

  scoreEl.style.color = color;

  /*
        Entropy
    */

  entropyEl.textContent = `Entropy: ${result.entropy.toFixed(1)} bits`;

  /*
        Search space

        R^L
    */

  let searchSpace = 0;

  if (result.R > 0 && result.length > 0) {
    /*
            Avoid unnecessarily huge
            Infinity calculations.
        */

    const log10Space = result.length * Math.log10(result.R);

    if (log10Space < 300) {
      searchSpace = Math.pow(result.R, result.length);
    }
  }

  crackSpaceEl.textContent = `Search space: ${
    searchSpace ? formatSpace(searchSpace) : "0"
  }`;

  /*
        Checklist
    */

  updateCheck("length", result.length >= 12);

  updateCheck("variety", result.variety === 4);

  updateCheck("pattern", !result.patternBad);

  updateCheck("dictionary", !result.common);

  /*
        Improvement suggestions
    */

  const tips = [];

  if (!password) {
    tips.push("Start typing to receive personalized suggestions.");
  } else {
    if (result.length < 12) {
      const missing = 12 - result.length;

      tips.push(`Add ${missing} more character${missing === 1 ? "" : "s"}.`);
    }

    if (!result.hasUpper) {
      tips.push("Add uppercase letters.");
    }

    if (!result.hasLower) {
      tips.push("Add lowercase letters.");
    }

    if (!result.hasDigit) {
      tips.push("Add numbers.");
    }

    if (!result.hasSymbol) {
      tips.push("Add a special character such as !, # or %.");
    }

    if (result.common) {
      tips.push("Avoid common words or predictable password terms.");
    }

    if (result.patternBad) {
      tips.push(
        "Avoid keyboard sequences, sequential characters or repeated characters.",
      );
    }

    if (!tips.length) {
      tips.push(
        "Good result. Keep this password unique and avoid reusing it on other services.",
      );
    }
  }

  /*
        Display tips
    */

  tipList.innerHTML = tips.map((tip) => `<li>${tip}</li>`).join("");
}

/*
    Show / Hide password
*/

togglePassword.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";

  passwordInput.type = hidden ? "text" : "password";

  togglePassword.textContent = hidden ? "◉" : "◌";

  togglePassword.setAttribute(
    "aria-label",
    hidden ? "Hide password" : "Show password",
  );
});

/*
    Analyze while typing
*/

passwordInput.addEventListener("input", () => {
  /*
            Hide old breach result
            because the password changed.
        */

  breachResult.hidden = true;

  /*
            Small UI animation
        */

  passwordInput.classList.remove("pulse");

  void passwordInput.offsetWidth;

  passwordInput.classList.add("pulse");

  render();
});

/*
    Secure Password Generator
*/

generateBtn.addEventListener("click", () => {
  /*
            Character set intentionally avoids
            ambiguous characters such as:

            0 O
            1 I l
        */

  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ" +
    "abcdefghijkmnopqrstuvwxyz" +
    "23456789" +
    "!@#$%^&*_-+=";

  /*
            Web Crypto API

            Generates cryptographically
            strong random values.
        */

  const randomValues = new Uint32Array(18);

  crypto.getRandomValues(randomValues);

  let generated = "";

  for (const value of randomValues) {
    generated += characters[value % characters.length];
  }

  passwordInput.value = generated;

  passwordInput.type = "text";

  togglePassword.textContent = "◉";

  render();
});

/*
    SHA-1

    Used only for the optional
    Have I Been Pwned k-anonymity
    breach check.
*/

async function sha1(text) {
  const data = new TextEncoder().encode(text);

  const hash = await crypto.subtle.digest("SHA-1", data);

  return [...new Uint8Array(hash)]

    .map((byte) => byte.toString(16).padStart(2, "0"))

    .join("")
    .toUpperCase();
}

/*
    Breach Check

    IMPORTANT:

    The complete password is NEVER
    sent to the API.

    Only the first 5 characters of
    its SHA-1 hash are sent.

    This follows the k-anonymity
    method described in the project.
*/

breachBtn.addEventListener("click", async () => {
  const password = passwordInput.value;

  if (!password) {
    breachResult.hidden = false;

    breachResult.className = "breach-result bad";

    breachResult.textContent = "Enter a password first.";

    return;
  }

  /*
            Loading state
        */

  breachBtn.disabled = true;

  breachBtn.querySelector("span").textContent = "Checking…";

  breachResult.hidden = false;

  breachResult.className = "breach-result";

  breachResult.textContent = "Checking the breach database using k-anonymity…";

  try {
    /*
                Generate SHA-1 hash
            */

    const hash = await sha1(password);

    /*
                Split hash

                Prefix = first 5 characters

                Suffix = remaining characters
            */

    const prefix = hash.slice(0, 5);

    const suffix = hash.slice(5);

    /*
                Send ONLY prefix

                The raw password never
                goes to the API.
            */

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "Add-Padding": "true",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Breach API unavailable");
    }

    const text = await response.text();

    /*
                Find matching suffix
            */

    const row = text
      .split("\n")
      .find((line) => line.trim().split(":")[0] === suffix);

    /*
                Password found
            */

    if (row) {
      const count = parseInt(row.split(":")[1], 10).toLocaleString();

      breachResult.className = "breach-result bad";

      breachResult.textContent = `⚠ This password appears in known breach data approximately ${count} time(s). Do not use it.`;
    } else {

    /*
                Password not found
            */
      breachResult.className = "breach-result ok";

      breachResult.textContent =
        "✓ No match was returned from the breach database. This does not guarantee that the password has never been exposed.";
    }
  } catch (error) {
    breachResult.className = "breach-result bad";

    breachResult.textContent =
      "The optional breach check could not be completed. Core password analysis still works locally.";
  } finally {
    breachBtn.disabled = false;

    breachBtn.querySelector("span").textContent = "Check known breaches";
  }
});

/*
    Initial state
*/
render();