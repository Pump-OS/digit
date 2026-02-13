const canvas = document.getElementById("cyberGrid");
const ctx = canvas.getContext("2d");
const digitStage = document.getElementById("digitStage");
const digitCharacter = document.getElementById("digitCharacter");
const digitModel = document.getElementById("digitModel");
const sparkLayer = document.getElementById("sparkLayer");
const speechText = document.getElementById("speechText");
const missionAlert = document.getElementById("missionAlert");
const hackerAlert = document.getElementById("hackerAlert");
const muteToggle = document.getElementById("muteToggle");
const launchMissionBtn = document.getElementById("launchMission");
const zoneInfo = document.getElementById("zoneInfo");
const alarmOverlay = document.getElementById("alarmOverlay");
const successFlash = document.getElementById("successFlash");
const puzzleModal = document.getElementById("puzzleModal");
const puzzlePrompt = document.getElementById("puzzlePrompt");
const puzzleInput = document.getElementById("puzzleInput");
const puzzleSubmit = document.getElementById("puzzleSubmit");
const puzzleStatus = document.getElementById("puzzleStatus");
const defenseToast = document.getElementById("defenseToast");

const speechLines = [
  "Hey team! Ready for a cyberspace adventure?",
  "Math mission activated! Let's do this!",
  "Point and hover - I'll guide you!",
  "Teamwork makes every puzzle easier!",
  "Digit is on duty. Next stop: fun!",
];

const missionLines = [
  "MISSION UPDATE: Puzzle portals are opening!",
  "NEW MISSION: Decode the Grid!",
  "CYBER CHALLENGE: Shape lock unlocked!",
  "OBJECTIVE: Trace the map pathways!",
];

let width = 0;
let height = 0;
let gridOffset = 0;
let soundEnabled = true;
let audioContext;
let threeState;
let attackActive = false;
let activePuzzle = null;

function initDigit3D() {
  if (!digitModel) {
    speechText.textContent = "3D container missing.";
    return null;
  }

  digitModel.cameraOrbit = "0deg 78deg 6.0m";
  digitModel.fieldOfView = "36deg";

  digitModel.addEventListener("load", () => {
    speechText.textContent = "Digit is online! Hover around!";
  });

  digitModel.addEventListener("error", () => {
    speechText.textContent = "Could not load digit.glb. Check model file.";
  });

  return {
    setPointer(px, py) {
      const yaw = px * 28;
      const pitch = 78 + py * 6;
      digitModel.cameraOrbit = `${yaw}deg ${pitch}deg 6.0m`;
    },
    setHovered(value) {
      digitModel.style.filter = value ? "drop-shadow(0 0 18px rgba(255,255,255,0.7))" : "";
    },
    resize() {},
  };
}

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (threeState) {
    threeState.resize();
  }
}

function drawGrid() {
  ctx.clearRect(0, 0, width, height);

  const horizon = height * 0.55;
  const lineGap = 44;
  const glow = ctx.createLinearGradient(0, horizon, 0, height);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  glow.addColorStop(1, "rgba(116, 189, 255, 0.45)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizon, width, height - horizon);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 3;
  for (let y = horizon; y <= height + lineGap; y += lineGap) {
    const perspective = (y - horizon) / (height - horizon + 1);
    const left = width * 0.5 - width * (0.55 + perspective * 0.62);
    const right = width * 0.5 + width * (0.55 + perspective * 0.62);
    ctx.beginPath();
    ctx.moveTo(left, y + gridOffset % lineGap);
    ctx.lineTo(right, y + gridOffset % lineGap);
    ctx.stroke();
  }

  const verticalCount = 16;
  for (let i = -verticalCount; i <= verticalCount; i += 1) {
    const x = width / 2 + i * (width / 20);
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(width / 2 + i * 14, horizon);
    ctx.stroke();
  }

  for (let i = 0; i < 8; i += 1) {
    const orbX = ((Date.now() * 0.015 + i * 90) % (width + 120)) - 60;
    const orbY = horizon - 45 - Math.sin((Date.now() * 0.001) + i) * 18;
    ctx.fillStyle = i % 2 === 0 ? "rgba(255, 113, 232, 0.3)" : "rgba(147, 250, 93, 0.3)";
    ctx.beginPath();
    ctx.arc(orbX, orbY, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  gridOffset += 0.65;
  requestAnimationFrame(drawGrid);
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function chirp(freq = 540, duration = 0.09, type = "triangle", volume = 0.035) {
  if (!soundEnabled) return;
  const ac = getAudioContext();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;

  osc.connect(gain);
  gain.connect(ac.destination);

  const now = ac.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

function sparkleBurst(x, y, count = 9) {
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty("--dx", `${(Math.random() - 0.5) * 70}px`);
    spark.style.setProperty("--dy", `${(Math.random() - 0.5) * 70}px`);
    sparkLayer.appendChild(spark);
    setTimeout(() => spark.remove(), 520);
  }
}

function rotateSpeech() {
  const line = speechLines[Math.floor(Math.random() * speechLines.length)];
  speechText.textContent = line;
}

function cycleMissionAlert() {
  missionAlert.textContent = missionLines[Math.floor(Math.random() * missionLines.length)];
}

function createRandomPuzzle() {
  const puzzleType = Math.floor(Math.random() * 3);
  if (puzzleType === 0) {
    const a = Math.floor(Math.random() * 7) + 3;
    const b = Math.floor(Math.random() * 8) + 2;
    return {
      prompt: `What is ${a} + ${b}?`,
      answer: a + b,
      placeholder: "Enter a number",
    };
  }

  if (puzzleType === 1) {
    const start = Math.floor(Math.random() * 9) + 4;
    const step = Math.floor(Math.random() * 4) + 2;
    return {
      prompt: `Continue the sequence: ${start}, ${start + step}, ${start + step * 2}, ?`,
      answer: start + step * 3,
      placeholder: "Next number",
    };
  }

  const words = [
    { jumbled: "GITID", answer: "DIGIT" },
    { jumbled: "CYRBE", answer: "CYBER" },
    { jumbled: "MTAH", answer: "MATH" },
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  return {
    prompt: `Unscramble the word "${word.jumbled}"`,
    answer: word.answer,
    placeholder: "Enter the word",
  };
}

function triggerHackerAttack() {
  if (attackActive) return;
  attackActive = true;
  activePuzzle = createRandomPuzzle();

  hackerAlert.classList.remove("hidden");
  hackerAlert.classList.add("visible");
  document.body.classList.add("alarm-active");
  alarmOverlay.classList.add("active");
  puzzleModal.classList.add("active");

  puzzlePrompt.textContent = activePuzzle.prompt;
  puzzleInput.placeholder = activePuzzle.placeholder;
  puzzleInput.value = "";
  puzzleStatus.textContent = "Solve the puzzle to stop the attack!";
  puzzleInput.focus();

  speechText.textContent = "Alert! Solve the puzzle quickly!";
  missionAlert.textContent = "HACKER ATTACK: Firewall breached!";

  chirp(170, 0.24, "sawtooth", 0.05);
  setTimeout(() => chirp(130, 0.2, "square", 0.04), 120);
}

function resolveHackerAttack() {
  attackActive = false;
  activePuzzle = null;
  puzzleModal.classList.remove("active");
  alarmOverlay.classList.remove("active");
  document.body.classList.remove("alarm-active");
  hackerAlert.classList.remove("visible");
  hackerAlert.classList.add("hidden");

  successFlash.classList.remove("active");
  void successFlash.offsetWidth;
  successFlash.classList.add("active");
  setTimeout(() => successFlash.classList.remove("active"), 900);

  defenseToast.classList.add("show");
  setTimeout(() => defenseToast.classList.remove("show"), 2200);

  puzzleStatus.textContent = "";
  speechText.textContent = "Great job! Attack repelled!";
  chirp(680, 0.09, "triangle", 0.03);
  setTimeout(() => chirp(980, 0.1, "triangle", 0.03), 90);
}

function validatePuzzleAnswer() {
  if (!attackActive || !activePuzzle) return;
  const rawValue = puzzleInput.value.trim();
  if (!rawValue) {
    puzzleStatus.textContent = "Enter an answer to defend the system.";
    return;
  }

  let isCorrect = false;
  if (typeof activePuzzle.answer === "number") {
    isCorrect = Number(rawValue) === activePuzzle.answer;
  } else {
    isCorrect = rawValue.toUpperCase() === String(activePuzzle.answer).toUpperCase();
  }

  if (isCorrect) {
    resolveHackerAttack();
    return;
  }

  puzzleStatus.textContent = "Incorrect! Try again.";
  chirp(250, 0.1, "sawtooth", 0.04);
}

function setupPuzzleSystem() {
  puzzleSubmit.addEventListener("click", validatePuzzleAnswer);
  puzzleInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      validatePuzzleAnswer();
    }
  });
}

function setupDigitInteractions() {
  function stageSpark(event) {
    const rect = digitStage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    sparkleBurst(x, y, 6);
  }

  digitStage.addEventListener("mouseenter", () => {
    digitCharacter.classList.add("hovered");
    if (threeState) threeState.setHovered(true);
    rotateSpeech();
    chirp(660, 0.1, "square", 0.03);
  });

  digitStage.addEventListener("mousemove", (event) => {
    const rect = digitStage.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    if (threeState) {
      threeState.setPointer(px, py);
    }
    if (Math.random() < 0.1) {
      stageSpark(event);
    }
  });

  digitStage.addEventListener("mouseleave", () => {
    digitCharacter.classList.remove("hovered");
    if (threeState) {
      threeState.setHovered(false);
      threeState.setPointer(0, 0);
    }
  });

  digitStage.addEventListener("click", (event) => {
    rotateSpeech();
    stageSpark(event);
    chirp(760, 0.11, "triangle", 0.036);
  });
}

function setupMissionCards() {
  const cards = document.querySelectorAll(".mission-card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      const mission = card.dataset.mission;
      speechText.textContent = `Digit says: ${mission}`;
      chirp(490, 0.08, "triangle", 0.03);
    });
  });
}

function setupCyberMap() {
  const zones = document.querySelectorAll(".zone");
  zones.forEach((zone) => {
    zone.addEventListener("mouseenter", () => {
      zoneInfo.textContent = zone.dataset.info;
      chirp(570, 0.07, "triangle", 0.028);
    });
  });
}

function setupControls() {
  muteToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    muteToggle.textContent = soundEnabled ? "🔊" : "🔈";
    if (soundEnabled) chirp(520, 0.06, "triangle", 0.028);
  });

  launchMissionBtn.addEventListener("click", () => {
    cycleMissionAlert();
    rotateSpeech();
    triggerHackerAttack();
    chirp(720, 0.1, "square", 0.033);
    setTimeout(() => chirp(960, 0.09, "triangle", 0.03), 110);
  });
}

function startLoops() {
  setInterval(cycleMissionAlert, 5200);
  setInterval(rotateSpeech, 6500);
  setInterval(() => {
    if (!attackActive && Math.random() > 0.42) {
      triggerHackerAttack();
    }
  }, 14000);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener(
  "pointerdown",
  () => {
    if (!audioContext) getAudioContext();
  },
  { once: true }
);

resizeCanvas();
threeState = initDigit3D();
drawGrid();
setupDigitInteractions();
setupMissionCards();
setupCyberMap();
setupPuzzleSystem();
setupControls();
startLoops();
