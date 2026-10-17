const canvas = document.querySelector("#game");
const gameStage = document.querySelector(".game-stage");
const gameShell = document.querySelector(".game-shell");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#start-button");
const continueRunButton = document.querySelector("#continue-run-button");
const createLevelButton = document.querySelector("#create-level-button");
const customReplayButton = document.querySelector("#custom-replay-button");
const customHomeButton = document.querySelector("#custom-home-button");
const levelEditor = document.querySelector("#level-editor");
const editorCanvas = document.querySelector("#editor-canvas");
const editorCtx = editorCanvas.getContext("2d");
const editorMessage = document.querySelector("#editor-message");
const editorPlayButton = document.querySelector("#editor-play-button");
const editorClearButton = document.querySelector("#editor-clear-button");
const editorBackButton = document.querySelector("#editor-back-button");
const titleCard = document.querySelector(".title-card");
const audioToggle = document.querySelector("#audio-toggle");
const audioIcon = document.querySelector("#audio-icon");
const audioLabel = document.querySelector("#audio-label");
const shop = document.querySelector("#shop");
const shopItems = document.querySelector("#shop-items");
const skinItems = document.querySelector("#skin-items");
const mobileControls = document.querySelector("#mobile-controls");
const mobileFlameButton = document.querySelector("#mobile-flame-button");
const coinCount = document.querySelector("#coin-count");
const shopBalance = document.querySelector("#shop-balance");
const shopMessage = document.querySelector("#shop-message");
const continueButton = document.querySelector("#continue-button");
const toast = document.querySelector("#toast");
const worldLabel = document.querySelector("#world-name");
const crystalTrack = document.querySelector("#crystal-track");
const healthDisplay = document.querySelector("#health");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 472;
const EDITOR_GRID_SIZE = 40;
const customLevelObjects = [];
const keys = new Set();
const crystalsCollected = new Set();
const LEVELS_PER_WORLD = 3;
const CONTINUE_RUN_COST = 500;
const upgrades = [
  { id: "power", name: "Tăiș puternic", icon: "⚔", description: "Fiecare nivel adaugă 3 puncte de daună.", costs: [10, 20, 34, 52, 75, 105, 145, 195, 255, 330], max: 10 },
  { id: "speed", name: "Lovitură rapidă", icon: "⚡", description: "Fiecare nivel reduce timpul dintre atacuri.", costs: [12, 24, 40, 60, 85, 120, 165, 220, 290, 375], max: 10 },
  { id: "reach", name: "Tăiș lung", icon: "➶", description: "Fiecare nivel mărește raza loviturii.", costs: [14, 28, 46, 68, 95, 130, 175, 230, 300, 390], max: 10 },
  { id: "jump", name: "Salt puternic", icon: "↑", description: "Sari mai sus pentru a trece peste obstacole.", costs: [40, 80, 140], max: 3, category: "movement" },
  { id: "runSpeed", name: "Alergare rapidă", icon: "➜", description: "Alergi mai repede prin nivel.", costs: [45, 90, 150], max: 3, category: "movement" },
];
const skins = [
  { id: "crimson", name: "Ninja stacojiu", cost: 120, hood: "#63253b", body: "#351c32", scarf: "#ff657c", accent: "#ff9b9b" },
  { id: "jade", name: "Ninja de jad", cost: 180, hood: "#24594b", body: "#19372f", scarf: "#61d69a", accent: "#b4ffd1" },
  { id: "frost", name: "Ninja de gheață", cost: 240, hood: "#315a78", body: "#20374e", scarf: "#75d9ff", accent: "#d2f7ff" },
  { id: "shadow", name: "Ninja umbrelor", cost: 320, hood: "#33264f", body: "#211b35", scarf: "#b78bff", accent: "#e2d0ff" },
  { id: "gold", name: "Ninja de aur", cost: 500, hood: "#79551f", body: "#493417", scarf: "#ffd15e", accent: "#fff0a1" },
  { id: "fire", name: "Ninja de foc", cost: 1000, hood: "#7d241f", body: "#3d2025", scarf: "#ff542e", accent: "#ffd15e", reward: "boss", description: "Abilitate: aruncător de flăcări cu F." },
];
const defaultSkin = { id: "default", name: "Ninja clasic", hood: "#333247", body: "#242536", scarf: "#c64d66", accent: "#e66c7e" };
const ownedSkins = new Set(["default"]);
const unlockedSkinRewards = new Set();
const SKIN_PROGRESS_KEY = "umbra-skin-progress";
const TAB_SESSION_KEY = "umbra-tab-session";

if (!sessionStorage.getItem(TAB_SESSION_KEY)) {
  localStorage.removeItem(SKIN_PROGRESS_KEY);
  sessionStorage.setItem(TAB_SESSION_KEY, "started");
}

function saveSkinProgress() {
  localStorage.setItem(SKIN_PROGRESS_KEY, JSON.stringify({
    owned: [...ownedSkins],
    unlockedRewards: [...unlockedSkinRewards],
    equipped: equippedSkinId,
  }));
}

function loadSkinProgress() {
  const savedProgress = localStorage.getItem(SKIN_PROGRESS_KEY);
  if (!savedProgress) return;

  let progress;
  try {
    progress = JSON.parse(savedProgress);
  } catch (error) {
    console.warn("Skinurile salvate nu au putut fi citite; se folosesc valorile implicite.", error);
    return;
  }
  if (!progress || typeof progress !== "object" || !Array.isArray(progress.owned) ||
      !Array.isArray(progress.unlockedRewards)) {
    console.warn("Datele salvate pentru skinuri sunt invalide; se folosesc valorile implicite.");
    return;
  }

  const availableSkins = new Set([defaultSkin, ...skins].map(skin => skin.id));
  for (const skinId of progress.owned) {
    if (availableSkins.has(skinId)) ownedSkins.add(skinId);
  }
  for (const skinId of progress.unlockedRewards) {
    const skin = skins.find(item => item.id === skinId && item.reward);
    if (skin) unlockedSkinRewards.add(skinId);
  }
  for (const skin of skins) {
    if (skin.reward && ownedSkins.has(skin.id)) unlockedSkinRewards.add(skin.id);
  }
  if (ownedSkins.has(progress.equipped)) equippedSkinId = progress.equipped;
}

const worlds = [
  { name: "Pădurea de jad", colors: ["#182e31", "#29473f", "#3d6450", "#25332f", "#7ef0a4"], ground: "#293a32", platform: "#59755a", accent: "#a5f2c0", moon: "#b7e6b6", enemy: "#cf6d6d", boss: "#922f52", kind: "forest" },
  { name: "Deșertul aprins", colors: ["#38263a", "#684047", "#a25448", "#623e3c", "#ffcc72"], ground: "#513a35", platform: "#a15c49", accent: "#ffd081", moon: "#ffd7a1", enemy: "#e87952", boss: "#9d3549", kind: "desert" },
  { name: "Munții înghețați", colors: ["#182b43", "#294361", "#466684", "#25364c", "#91e4f4"], ground: "#2e4353", platform: "#7195a4", accent: "#b0f5ff", moon: "#d2f3ff", enemy: "#79b9dd", boss: "#545aac", kind: "ice" },
  { name: "Peșterile de lavă", colors: ["#2d1929", "#512336", "#823528", "#442329", "#ff755b"], ground: "#44272b", platform: "#804039", accent: "#ff9870", moon: "#ffb271", enemy: "#e35b45", boss: "#ab2940", kind: "lava" },
  { name: "Tărâmul umbrelor", colors: ["#171b35", "#28264b", "#44335e", "#28263d", "#d3a8ff"], ground: "#29283a", platform: "#605073", accent: "#d3a8ff", moon: "#d6c5ff", enemy: "#a071cf", boss: "#7542a0", kind: "shadow" },
];

const defeatedEnemies = worlds.map(() => new Map());
const collectedEnemyLoot = worlds.map(() => new Set());

const platformLayouts = [
  [[300, 384, 120], [540, 336, 130], [790, 390, 110], [1040, 340, 140], [1320, 388, 120], [1570, 338, 140], [1840, 385, 110]],
  [[260, 382, 130], [520, 335, 125], [770, 380, 140], [1040, 328, 130], [1310, 382, 135], [1580, 334, 130], [1835, 380, 120]],
  [[280, 385, 135], [540, 330, 125], [810, 380, 120], [1060, 328, 140], [1340, 380, 130], [1600, 327, 135], [1850, 380, 120]],
  [[300, 380, 120], [550, 330, 135], [810, 378, 125], [1070, 328, 130], [1330, 380, 145], [1600, 328, 130], [1850, 380, 120]],
  [[280, 382, 135], [540, 330, 135], [800, 380, 130], [1060, 326, 140], [1330, 380, 135], [1600, 328, 130], [1850, 380, 120]],
];

let currentWorld = 0;
let currentSublevel = 0;
let currentDifficulty = 0;
let currentWorldWidth = 2360;
let cheatPressCount = 0;
let lastCheatPress = 0;
let moneyCheatPressCount = 0;
let lastMoneyCheatPress = 0;
let maxUpgradeCheatPressCount = 0;
let lastMaxUpgradeCheatPress = 0;
let fireSkinCheatPressCount = 0;
let lastFireSkinCheatPress = 0;
let skipLevelCheatPressCount = 0;
let lastSkipLevelCheatPress = 0;
let invulnerabilityCheatPressCount = 0;
let lastInvulnerabilityCheatPress = 0;
let spaceCheatPressCount = 0;
let lastSpaceCheatPress = 0;
let invulnerabilityCheatEnabled = false;
let flightCheatEnabled = false;
let player;
let enemies = [];
let platforms = [];
let hazards = [];
let groundSegments = [];
let cameraX = 0;
let gameState = "title";
let editorTool = "platform";
let customLevelMode = false;
let lastFrame = 0;
let toastTimeout;
let worldTransition = 0;
let damageFlash = 0;
let failedRuns = 0;
let gameOverCheckpoint = null;
let stageCheckpoint = null;
let coins = 0;
let attackUpgrades = { power: 0, speed: 0, reach: 0 };
let movementUpgrades = { jump: 0, runSpeed: 0 };
let equippedSkinId = "default";
let flameDuration = 0;
let flameCooldown = 0;
let flameHitEnemies = new Set();
let loot = [];
let fireballs = [];
let bossPosition = 2040;
let crystalPosition = 2220;
let endingPhase = null;
let endingTimer = 0;
let endingBoss = null;
let audioContext = null;
let masterGain = null;
let musicGain = null;
let effectsGain = null;
let musicTimer = null;
let musicStep = 0;
let audioEnabled = true;

function initializeAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      audioEnabled = false;
      audioToggle.disabled = true;
      audioLabel.textContent = "AUDIO INDISPONIBIL";
      audioToggle.setAttribute("aria-label", "Sunetul nu este disponibil în acest browser");
      return;
    }
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    musicGain = audioContext.createGain();
    effectsGain = audioContext.createGain();
    musicGain.gain.value = 0.28;
    effectsGain.gain.value = 0.84;
    musicGain.connect(masterGain);
    effectsGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
    musicTimer = window.setInterval(playMusicStep, 240);
  }
  if (audioContext.state === "suspended") void audioContext.resume();
  masterGain.gain.setTargetAtTime(audioEnabled ? 0.55 : 0, audioContext.currentTime, 0.035);
}

function playTone(frequency, duration, type, gainNode, endFrequency = frequency, volume = 0.2, startTime = audioContext.currentTime) {
  if (!audioContext || !audioEnabled) return;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(35, frequency), startTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, endFrequency), startTime + duration);
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(volume, startTime + Math.min(0.03, duration * 0.35));
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(envelope);
  envelope.connect(gainNode);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playMusicStep() {
  if (!audioContext || !audioEnabled || audioContext.state !== "running" || gameState === "title") return;

  const worldRoots = [52, 50, 48, 45, 43];
  const worldChords = [
    [0, 4, 7],
    [0, 3, 7],
    [0, 5, 9],
    [0, 3, 8],
    [0, 5, 10],
  ];
  const melodicPatterns = [
    [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 5, 7, 9, 7, 5, 2],
    [0, 3, 5, 7, 10, 7, 5, 3, 0, 2, 5, 7, 9, 7, 5, 2],
    [0, 2, 5, 7, 10, 9, 7, 5, 0, 2, 3, 5, 7, 10, 7, 3],
    [0, 1, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 1, 0, 2],
    [0, 2, 5, 7, 8, 7, 5, 2, 0, 3, 7, 10, 12, 10, 7, 5],
  ];

  const root = worldRoots[currentWorld] || worldRoots[0];
  const chords = worldChords[currentWorld] || worldChords[0];
  const pattern = melodicPatterns[currentWorld] || melodicPatterns[0];
  const step = musicStep % pattern.length;
  const time = audioContext.currentTime + 0.02;

  const padNotes = chords.map(offset => root + offset);
  const leadNote = root + pattern[step];
  const bassNote = root - 12 + (step % 4 === 0 ? 0 : -5);

  padNotes.forEach((note, index) => {
    playTone(440 * 2 ** ((note - 69) / 12), 1.1, "sine", musicGain, undefined, 0.085 + index * 0.02, time + index * 0.05);
  });

  playTone(440 * 2 ** ((bassNote - 69) / 12), 0.68, "triangle", musicGain, undefined, 0.14, time);
  playTone(440 * 2 ** ((leadNote - 69) / 12), 0.5, "sine", musicGain, undefined, 0.11, time + 0.05);

  if (step % 4 === 1 || step % 4 === 3) {
    const echo = root + 12 + (step % 2 === 0 ? 0 : 2);
    playTone(440 * 2 ** ((echo - 69) / 12), 0.4, "triangle", musicGain, undefined, 0.07, time + 0.08);
  }

  if ((step + currentWorld) % 8 === 0) {
    const shimmer = root + 19;
    playTone(440 * 2 ** ((shimmer - 69) / 12), 0.32, "sine", musicGain, undefined, 0.05, time + 0.12);
  }

  musicStep++;
}

function playAttackSound() {
  if (!audioContext || !audioEnabled) return;
  const time = audioContext.currentTime;
  playTone(980, 0.08, "sawtooth", effectsGain, 220, 0.34, time);
  playTone(1380, 0.06, "square", effectsGain, 420, 0.18, time + 0.01);
  playTone(540, 0.09, "triangle", effectsGain, 120, 0.12, time + 0.02);
  playTone(250, 0.14, "sawtooth", effectsGain, 70, 0.08, time + 0.04);
}

function playHurtSound() {
  if (!audioContext || !audioEnabled) return;
  const time = audioContext.currentTime;
  playTone(155, 0.24, "triangle", effectsGain, 48, 0.32, time);
  playTone(82, 0.2, "sine", effectsGain, 38, 0.3, time);
  const noise = audioContext.createBufferSource();
  const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.16), audioContext.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  noise.buffer = noiseBuffer;
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1100, time);
  filter.frequency.exponentialRampToValueAtTime(180, time + 0.16);
  const envelope = audioContext.createGain();
  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.exponentialRampToValueAtTime(0.24, time + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  noise.connect(filter);
  filter.connect(envelope);
  envelope.connect(effectsGain);
  noise.start(time);
  noise.stop(time + 0.17);
}

function playFireballSound() {
  if (!audioContext || !audioEnabled) return;
  const time = audioContext.currentTime;
  playTone(390, 0.24, "sawtooth", effectsGain, 90, 0.2, time);
  playTone(170, 0.18, "triangle", effectsGain, 65, 0.16, time);
}

function toggleAudio() {
  audioEnabled = !audioEnabled;
  if (!audioContext && audioEnabled) initializeAudio();
  else if (audioContext) {
    if (audioContext.state === "suspended") void audioContext.resume();
    masterGain.gain.setTargetAtTime(audioEnabled ? 0.55 : 0, audioContext.currentTime, 0.035);
  }
  audioToggle.setAttribute("aria-pressed", String(audioEnabled));
  audioToggle.setAttribute("aria-label", audioEnabled ? "Oprește sunetul" : "Pornește sunetul");
  audioIcon.textContent = audioEnabled ? "♫" : "♪";
  audioLabel.textContent = audioEnabled ? "SUNET PORNIT" : "SUNET OPRIT";
}

function newPlayer() {
  return { x: 80, y: GROUND_Y - 40, w: 25, h: 38, vx: 0, vy: 0, facing: 1, onGround: false, attack: 0, attackCooldown: 0, invulnerable: 0, hp: 3, walk: 0 };
}

function loadWorld(index, sublevel = 0, spawnX = 80) {
  const isNewStage = currentWorld !== index || currentSublevel !== sublevel;
  currentWorld = index;
  currentSublevel = sublevel;
  currentDifficulty = index * LEVELS_PER_WORLD + sublevel;
  currentWorldWidth = 2360 + currentDifficulty * 180;
  bossPosition = currentWorldWidth - 320;
  crystalPosition = bossPosition + 180;
  player = newPlayer();
  player.x = Math.max(0, Math.min(currentWorldWidth - player.w, spawnX));
  cameraX = Math.max(0, Math.min(currentWorldWidth - WIDTH, player.x - WIDTH * 0.42));
  platforms = platformLayouts[index].map(([x, y, w]) => ({ x, y, w, h: 15 }));
  for (let x = 2100; x < bossPosition - 100; x += 260) {
    const step = Math.floor(x / 260);
    platforms.push({ x, y: step % 2 ? 340 : 385, w: 115 + step % 3 * 10, h: 15 });
  }
  hazards = [];
  const hazardCount = 3 + Math.floor(currentDifficulty * 0.8);
  const hazardStart = 640;
  const hazardEnd = bossPosition - 300;
  for (let i = 0; i < hazardCount; i++) {
    const x = hazardStart + (hazardEnd - hazardStart) * (i / Math.max(1, hazardCount - 1));
    const pit = i % 3 === 1;
    hazards.push({
      x,
      w: pit ? 88 + currentDifficulty * 3 : 48 + currentDifficulty * 2,
      type: pit ? "pit" : "spikes",
    });
  }
  groundSegments = [];
  let groundStart = 0;
  for (const pit of hazards.filter(hazard => hazard.type === "pit")) {
    groundSegments.push({ x: groundStart, w: pit.x - groundStart });
    groundStart = pit.x + pit.w;
  }
  groundSegments.push({ x: groundStart, w: currentWorldWidth - groundStart });

  enemies = [];
  loot = [];
  const enemyCount = 7 + currentDifficulty;
  const enemyStart = 370;
  const enemyEnd = bossPosition - 190;
  const enemySpacing = (enemyEnd - enemyStart) / (enemyCount - 1);
  for (let i = 0; i < enemyCount; i++) {
    const x = enemyStart + i * enemySpacing;
    enemies.push({
      id: `${sublevel}-grunt-${i}`,
      x, homeX: x, y: GROUND_Y - 27, w: 26, h: 27,
      hp: 1 + currentDifficulty * 2,
      speed: 0.52 + currentDifficulty * 0.09 + (i % 2) * 0.12,
      direction: i % 2 ? -1 : 1,
      alive: true, boss: false, phase: i * 1.7,
    });
  }
  if (sublevel === LEVELS_PER_WORLD - 1) {
    enemies.push({
      id: `${sublevel}-boss`,
      x: bossPosition, homeX: bossPosition,
      y: GROUND_Y - (index === worlds.length - 1 ? 76 : 58),
      w: index === worlds.length - 1 ? 82 : 51,
      h: index === worlds.length - 1 ? 76 : 58,
      hp: 4 + currentDifficulty * 5, speed: 0.7 + currentDifficulty * 0.07,
      direction: -1, alive: true, boss: true, phase: 0, shootCooldown: 80,
      attackCooldown: 150, attackWindup: 0, attackActive: 0, attackHit: false, attackDirection: -1,
      superBoss: index === worlds.length - 1,
    });
  } else {
    const bagId = `${sublevel}-stage-bag`;
    if (!collectedEnemyLoot[index].has(bagId)) {
      loot.push({
        sourceId: bagId,
        x: crystalPosition + 4,
        y: GROUND_Y - 28,
        value: 35,
        phase: 0,
        type: "pouch",
      });
    }
  }
  const placedEnemies = [];
  for (const enemy of enemies) {
    enemy.alive = !defeatedEnemies[index].has(enemy.id);
    const defeatRecord = defeatedEnemies[index].get(enemy.id);
    if (defeatRecord) {
      enemy.x = defeatRecord.x;
      enemy.homeX = defeatRecord.x;
      if (!collectedEnemyLoot[index].has(enemy.id)) loot.push({ ...defeatRecord.drop });
      continue;
    }
    enemy.x = findSafeX(enemy.x, enemy, [
      ...hazards.map(hazardBounds),
      ...placedEnemies.map(other => ({ x: other.x, y: other.y, w: other.w, h: other.h })),
    ], 300, bossPosition - 60);
    enemy.homeX = enemy.x;
    placedEnemies.push(enemy);
  }
  player.x = findSafeX(player.x, player, [
    ...hazards.map(hazardBounds),
    ...enemies.filter(enemy => enemy.alive).map(enemy => ({ x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h })),
  ]);
  fireballs = [];
  flameDuration = 0;
  flameHitEnemies.clear();
  worldLabel.textContent = `${worlds[index].name} · Nivel ${sublevel + 1}/${LEVELS_PER_WORLD}`;
  updateHUD();
  if (isNewStage || !stageCheckpoint) {
    stageCheckpoint = { world: index, sublevel, x: player.x };
  }
  worldTransition = 35;
}

function updateHUD() {
  crystalTrack.replaceChildren(...worlds.map((_, index) => {
    const slot = document.createElement("span");
    slot.className = `crystal-slot${crystalsCollected.has(index) ? " collected" : ""}`;
    slot.setAttribute("aria-label", crystalsCollected.has(index) ? `Cristalul ${index + 1} adunat` : `Cristalul ${index + 1} lipsă`);
    return slot;
  }));
  healthDisplay.replaceChildren(...[0, 1, 2].map(index => {
    const heart = document.createElement("span");
    heart.className = index >= player.hp ? "empty" : "";
    heart.textContent = "♥";
    return heart;
  }));
  healthDisplay.setAttribute("aria-label", `${player.hp} din 3 vieți`);
  coinCount.textContent = coins;
  document.querySelector("#wallet").setAttribute("aria-label", `${coins} monede`);
}

function showToast(message, duration = 1800) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), duration);
}

function openLevelEditor() {
  gameState = "editor";
  titleCard.hidden = true;
  shop.hidden = true;
  levelEditor.hidden = false;
  customReplayButton.hidden = true;
  customHomeButton.hidden = true;
  overlay.classList.remove("hidden", "shop-open");
  overlay.classList.add("editor-open");
  editorTool = "platform";
  for (const button of levelEditor.querySelectorAll(".editor-tool")) {
    button.classList.toggle("selected", button.dataset.editorTool === editorTool);
  }
  drawLevelEditor();
}

function closeLevelEditor() {
  gameState = "title";
  levelEditor.hidden = true;
  titleCard.hidden = false;
  overlay.classList.remove("editor-open");
  overlay.classList.add("hidden");
}

function drawLevelEditor() {
  const editorWidth = editorCanvas.width;
  const editorHeight = editorCanvas.height;
  editorCtx.fillStyle = "#18202b";
  editorCtx.fillRect(0, 0, editorWidth, editorHeight);

  for (let x = 0; x <= editorWidth; x += EDITOR_GRID_SIZE) {
    editorCtx.strokeStyle = x === 0 || x === editorWidth ? "#718096" : "#303b4a";
    editorCtx.beginPath();
    editorCtx.moveTo(x, 0);
    editorCtx.lineTo(x, editorHeight);
    editorCtx.stroke();
  }
  for (let y = 0; y <= editorHeight; y += EDITOR_GRID_SIZE) {
    editorCtx.strokeStyle = y === GROUND_Y ? "#a5f2c0" : "#303b4a";
    editorCtx.beginPath();
    editorCtx.moveTo(0, y);
    editorCtx.lineTo(editorWidth, y);
    editorCtx.stroke();
  }

  editorCtx.fillStyle = "#344d42";
  editorCtx.fillRect(0, GROUND_Y, editorWidth, editorHeight - GROUND_Y);
  editorCtx.fillStyle = "#a5f2c0";
  editorCtx.fillRect(0, GROUND_Y, editorWidth, 5);

  for (const object of customLevelObjects) {
    const x = object.col * EDITOR_GRID_SIZE;
    const y = object.row * EDITOR_GRID_SIZE;
    if (object.type === "platform") {
      editorCtx.fillStyle = "#59755a";
      editorCtx.fillRect(x, y + EDITOR_GRID_SIZE - 15, EDITOR_GRID_SIZE * 2, 15);
      editorCtx.fillStyle = "#a5f2c0";
      editorCtx.fillRect(x, y + EDITOR_GRID_SIZE - 15, EDITOR_GRID_SIZE * 2, 4);
    } else if (object.type === "spikes") {
      editorCtx.fillStyle = "#ff7184";
      editorCtx.beginPath();
      editorCtx.moveTo(x + 5, GROUND_Y);
      editorCtx.lineTo(x + EDITOR_GRID_SIZE / 2, GROUND_Y - 26);
      editorCtx.lineTo(x + EDITOR_GRID_SIZE - 5, GROUND_Y);
      editorCtx.fill();
    } else if (object.type === "enemy") {
      editorCtx.fillStyle = "#cf6d6d";
      editorCtx.fillRect(x + 7, GROUND_Y - 27, 26, 27);
      editorCtx.fillStyle = "#fff0b6";
      editorCtx.fillRect(x + 22, GROUND_Y - 19, 5, 4);
    }
  }

  editorCtx.fillStyle = "#d6c5ff";
  editorCtx.fillRect(editorWidth - 56, GROUND_Y - 54, 8, 54);
  editorCtx.fillStyle = "#a5f2c0";
  editorCtx.fillRect(editorWidth - 72, GROUND_Y - 58, 38, 5);
  editorCtx.fillStyle = "#f4f0e7";
  editorCtx.font = '13px "Press Start 2P", monospace';
  editorCtx.textAlign = "center";
  editorCtx.fillText("START", 60, GROUND_Y - 17);
  editorCtx.fillText("FINISH", editorWidth - 56, GROUND_Y - 70);
}

function placeEditorObject(event) {
  if (gameState !== "editor") return;
  const bounds = editorCanvas.getBoundingClientRect();
  const col = Math.max(0, Math.min(Math.floor(editorCanvas.width / EDITOR_GRID_SIZE) - 2,
    Math.floor((event.clientX - bounds.left) / bounds.width * editorCanvas.width / EDITOR_GRID_SIZE)));
  const row = Math.max(0, Math.min(Math.floor(GROUND_Y / EDITOR_GRID_SIZE) - 1,
    Math.floor((event.clientY - bounds.top) / bounds.height * editorCanvas.height / EDITOR_GRID_SIZE)));

  if (editorTool === "erase") {
    const index = customLevelObjects.findIndex(object => object.col === col && object.row === row);
    if (index >= 0) customLevelObjects.splice(index, 1);
  } else {
    const existingIndex = customLevelObjects.findIndex(object => object.col === col && object.row === row);
    if (existingIndex >= 0) customLevelObjects.splice(existingIndex, 1);
    customLevelObjects.push({ type: editorTool, col, row });
  }
  drawLevelEditor();
}

function startCustomLevel(spawnX = 52) {
  customLevelMode = true;
  endingPhase = null;
  endingTimer = 0;
  endingBoss = null;
  loadWorld(0, 0, spawnX);
  currentWorldWidth = WIDTH;
  bossPosition = WIDTH;
  crystalPosition = WIDTH - 40;
  groundSegments = [{ x: 0, w: currentWorldWidth }];
  hazards = customLevelObjects
    .filter(object => object.type === "spikes")
    .map(object => ({
      x: object.col * EDITOR_GRID_SIZE + 4,
      w: EDITOR_GRID_SIZE - 8,
      type: "spikes",
    }));
  platforms = customLevelObjects
    .filter(object => object.type === "platform")
    .map(object => ({
      x: object.col * EDITOR_GRID_SIZE,
      y: object.row * EDITOR_GRID_SIZE + EDITOR_GRID_SIZE - 15,
      w: EDITOR_GRID_SIZE * 2,
      h: 15,
    }));
  enemies = customLevelObjects
    .filter(object => object.type === "enemy")
    .map((object, index) => {
      const x = object.col * EDITOR_GRID_SIZE + 7;
      return {
        id: `custom-enemy-${index}`,
        x,
        homeX: x,
        y: GROUND_Y - 27,
        w: 26,
        h: 27,
        hp: 2,
        speed: 0.7,
        direction: -1,
        alive: true,
        boss: false,
        phase: index,
      };
    });
  loot = [];
  fireballs = [];
  cameraX = 0;
  player.x = Math.max(40, spawnX);
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.hp = 3;
  player.onGround = true;
  worldTransition = 0;
  stageCheckpoint = { world: 0, sublevel: 0, x: player.x, custom: true };
  levelEditor.hidden = true;
  titleCard.hidden = false;
  overlay.classList.remove("editor-open");
  overlay.classList.add("hidden");
  worldLabel.textContent = "Nivelul meu";
  gameState = "playing";
  customLevelMode = true;
  updateHUD();
  showToast("NIVELUL TĂU · AJUNGI LA POARTA DIN DREAPTA!");
}

function finishCustomLevel() {
  if (!customLevelMode) return false;
  gameState = "customwon";
  keys.clear();
  player.vx = 0;
  titleCard.hidden = false;
  overlay.classList.remove("hidden");
  overlay.querySelector(".eyebrow").textContent = "NIVEL PERSONALIZAT";
  overlay.querySelector("h1").innerHTML = "NIVEL<br><span>COMPLET!</span>";
  overlay.querySelector(".title-card p").innerHTML = "Ai trecut propriul nivel!<br>Poți să-l modifici sau să-l joci din nou.";
  startButton.innerHTML = "EDITEAZĂ NIVELUL <span>✎</span>";
  customReplayButton.hidden = false;
  customHomeButton.hidden = false;
  continueRunButton.hidden = true;
  return true;
}

function returnToMainMenu() {
  customLevelMode = false;
  gameState = "title";
  levelEditor.hidden = true;
  titleCard.hidden = false;
  shop.hidden = true;
  customReplayButton.hidden = true;
  customHomeButton.hidden = true;
  continueRunButton.hidden = true;
  overlay.classList.remove("editor-open", "shop-open", "hidden");
  overlay.querySelector(".eyebrow").textContent = "O AVENTURĂ ÎN CINCI LUMI";
  overlay.querySelector("h1").innerHTML = "Shadow<br><span>of the Prism</span>";
  overlay.querySelector(".title-card p").innerHTML = "Treci prin 3 niveluri în fiecare lume.<br>Înfruntă monstrul suprem și ia cele 5 cristale.";
  startButton.innerHTML = "JOACĂ ACUM <span>→</span>";
}

function beginGame() {
  initializeAudio();
  customLevelMode = false;
  levelEditor.hidden = true;
  titleCard.hidden = false;
  customReplayButton.hidden = true;
  customHomeButton.hidden = true;
  overlay.classList.remove("editor-open");
  crystalsCollected.clear();
  for (const defeated of defeatedEnemies) defeated.clear();
  for (const collected of collectedEnemyLoot) collected.clear();
  failedRuns = 0;
  coins = 0;
  attackUpgrades = { power: 0, speed: 0, reach: 0 };
  movementUpgrades = { jump: 0, runSpeed: 0 };
  invulnerabilityCheatPressCount = 0;
  spaceCheatPressCount = 0;
  invulnerabilityCheatEnabled = false;
  flightCheatEnabled = false;
  endingPhase = null;
  endingTimer = 0;
  endingBoss = null;
  gameShell.classList.remove("part-two");
  document.body.classList.remove("part-two-screen");
  loadWorld(0, 0);
  gameState = "playing";
  gameOverCheckpoint = null;
  stageCheckpoint = { world: currentWorld, sublevel: currentSublevel, x: player.x };
  continueRunButton.hidden = true;
  shop.hidden = true;
  overlay.classList.remove("shop-open");
  overlay.querySelector(".eyebrow").textContent = "O AVENTURĂ ÎN CINCI LUMI";
  overlay.querySelector("h1").innerHTML = "Shadow<br><span>of the Prism</span>";
  overlay.querySelector(".title-card p").innerHTML = "Treci prin 3 niveluri în fiecare lume.<br>Înfruntă monstrul suprem și ia cele 5 cristale.";
  startButton.innerHTML = "JOACĂ ACUM <span>→</span>";
  overlay.classList.add("hidden");
  showToast("CHECKPOINT SALVAT · LUMEA 1 · NIVELUL 1/3: PĂDUREA DE JAD");
}

function nextWorld() {
  if (currentSublevel === LEVELS_PER_WORLD - 1) {
    crystalsCollected.add(currentWorld);
    updateHUD();
    if (currentWorld === worlds.length - 1) {
      startEndingSequence();
      return;
    }
  }
  openShop();
}

function startEndingSequence() {
  for (let index = 0; index < worlds.length; index++) crystalsCollected.add(index);
  updateHUD();
  endingPhase = "gather";
  endingTimer = 0;
  gameState = "playing";
  enemies = [];
  loot = [];
  fireballs = [];
  keys.clear();
  player.vx = 0;
  player.vy = 0;
  player.attack = 0;
  player.facing = -1;
  player.hp = 3;
  endingBoss = {
    id: "ending-boss",
    x: Math.max(300, player.x - 390),
    homeX: Math.max(300, player.x - 390),
    y: GROUND_Y - 76,
    w: 82,
    h: 76,
    hp: 30,
    maxHp: 30,
    speed: 1.1,
    direction: 1,
    alive: true,
    boss: true,
    superBoss: true,
    endingBoss: true,
    phase: 0,
    shootCooldown: 82,
    attackCooldown: 120,
    attackWindup: 0,
    attackActive: 0,
    attackHit: false,
    attackDirection: 1,
  };
  updateHUD();
}

function updateEndingSequence() {
  endingTimer++;
  if (endingPhase === "gather" && endingTimer >= 140) {
    endingPhase = "steal";
    endingTimer = 0;
    return;
  }
  if (endingPhase === "steal") {
    endingBoss.x = Math.min(player.x - 115, endingBoss.x + 2.4);
    if (endingTimer >= 100) {
      endingPhase = "dialogue";
      endingTimer = 0;
    }
    return;
  }
  if (endingPhase === "dialogue" && endingTimer >= 300) {
    endingPhase = "fight";
    endingTimer = 0;
    endingBoss.x = Math.max(300, player.x - 115);
    endingBoss.homeX = endingBoss.x;
    enemies = [endingBoss];
    player.hp = 3;
    keys.clear();
    updateHUD();
    showToast("BOSSUL TE PROVOACĂ! ÎNVINGE-L CU ATACURILE TALE!", 3000);
    return;
  }
  if (endingPhase === "absorb" && endingTimer >= 210) {
    endingPhase = "parttwo";
    gameState = "parttwo";
    toast.classList.remove("visible");
    gameShell.classList.add("part-two");
    document.body.classList.add("part-two-screen");
  }
}

function openShop() {
  gameState = "shop";
  gameStage.classList.add("shop-open");
  overlay.classList.remove("hidden");
  overlay.classList.add("shop-open");
  titleCard.hidden = true;
  shop.hidden = false;
  shop.querySelector(".eyebrow").textContent = `LUMEA ${currentWorld + 1} · NIVELUL ${currentSublevel + 1}/${LEVELS_PER_WORLD}`;
  shopMessage.textContent = currentSublevel === LEVELS_PER_WORLD - 1 && currentWorld === worlds.length - 1
    ? "Pregătește-te pentru confruntarea finală cu monstrul suprem!"
    : "Îmbunătățește-ți atacul înainte de următoarea etapă.";
  if (currentSublevel < LEVELS_PER_WORLD - 1) {
    continueButton.innerHTML = `CONTINUĂ SPRE NIVELUL ${currentSublevel + 2}/${LEVELS_PER_WORLD} <span>→</span>`;
  } else if (currentWorld === worlds.length - 1) {
    continueButton.innerHTML = "ÎNCHEIE AVENTURA <span>✦</span>";
  } else {
    continueButton.innerHTML = `CONTINUĂ SPRE LUMEA ${currentWorld + 2} <span>→</span>`;
  }
  updateShop();
}

function updateShop() {
  shopBalance.textContent = `BĂNUȚI ADUNAȚI: ◈ ${coins}`;
  for (const upgrade of upgrades) {
    const level = getUpgradeLevel(upgrade);
    const cost = upgrade.costs[level];
    const item = shopItems.querySelector(`[data-upgrade="${upgrade.id}"]`);
    const button = item.querySelector("button");
    const levelDescription = upgrade.id === "power"
      ? `Daune pe lovitură: ${1 + level * 3}.`
      : upgrade.id === "speed"
        ? `Timp între atacuri: ${attackCooldownForLevel(level)} pași.`
        : upgrade.id === "reach"
          ? `Rază suplimentară: ${level * 26} pixeli.`
          : upgrade.id === "jump"
            ? `Înălțime de salt: ${jumpPowerForLevel(level).toFixed(1)}.`
            : `Viteză de alergare: ${movementSpeedForLevel(level).toFixed(2)}.`;
    item.querySelector(".shop-item-copy small:nth-of-type(1)").textContent = levelDescription;
    item.querySelector(".shop-item-level").textContent = level === upgrade.max ? "NIVEL MAXIM" : `NIVEL ${level}/${upgrade.max}`;
    item.querySelector(".upgrade-cost").textContent = level === upgrade.max ? "ÎMBUNĂTĂȚIRE MAXIMĂ" : `PREȚ: ◈ ${cost}`;
    button.disabled = level === upgrade.max || coins < cost;
    button.textContent = level === upgrade.max ? "MAXIM" : coins < cost ? "NU AJUNG" : "CUMPĂRĂ";
  }
  updateSkinShop();
}

function getUpgradeLevel(upgrade) {
  return upgrade.category === "movement" ? movementUpgrades[upgrade.id] : attackUpgrades[upgrade.id];
}

function attackCooldownForLevel(level) {
  return level <= 5 ? Math.max(4, 22 - level * 4) : Math.max(1, 4 - (level - 5) * 0.6);
}

function jumpPowerForLevel(level) {
  return 10.6 + level * 1.8;
}

function movementSpeedForLevel(level) {
  return 3.25 + level * 0.65;
}

function renderShopItems() {
  shopItems.replaceChildren(...upgrades.map(upgrade => {
    const item = document.createElement("div");
    item.className = "shop-item";
    item.dataset.upgrade = upgrade.id;

    const icon = document.createElement("div");
    icon.className = "shop-item-icon";
    icon.textContent = upgrade.icon;

    const copy = document.createElement("div");
    copy.className = "shop-item-copy";
    const name = document.createElement("b");
    name.textContent = upgrade.name;
    const description = document.createElement("small");
    description.textContent = upgrade.description;
    const level = document.createElement("small");
    level.className = "shop-item-level";
    const cost = document.createElement("small");
    cost.className = "upgrade-cost";
    copy.append(name, description, level, cost);

    const button = document.createElement("button");
    button.className = "shop-button";
    button.type = "button";
    button.addEventListener("click", () => buyUpgrade(upgrade.id));
    item.append(icon, copy, button);
    return item;
  }));
  skinItems.replaceChildren(...[defaultSkin, ...skins].map(skin => {
    const item = document.createElement("div");
    item.className = "shop-item";
    item.dataset.skin = skin.id;
    const swatch = document.createElement("div");
    swatch.className = "skin-swatch";
    swatch.setAttribute("aria-hidden", "true");
    const figure = document.createElement("span");
    figure.style.setProperty("--skin-hood", skin.hood);
    figure.style.setProperty("--skin-body", skin.body);
    figure.style.setProperty("--skin-scarf", skin.scarf);
    swatch.append(figure);
    const copy = document.createElement("div");
    copy.className = "shop-item-copy";
    const name = document.createElement("b");
    name.textContent = skin.name;
    const price = document.createElement("small");
    price.className = "skin-cost";
    const description = document.createElement("small");
    description.textContent = skin.description || "Skin cosmetic.";
    copy.append(name, description, price);
    const button = document.createElement("button");
    button.className = "shop-button";
    button.type = "button";
    button.addEventListener("click", () => buyOrEquipSkin(skin.id));
    item.append(swatch, copy, button);
    return item;
  }));
  updateSkinShop();
}

function updateSkinShop() {
  for (const skin of [defaultSkin, ...skins]) {
    const item = skinItems.querySelector(`[data-skin="${skin.id}"]`);
    if (!item) continue;
    const owned = ownedSkins.has(skin.id);
    const equipped = equippedSkinId === skin.id;
    const button = item.querySelector("button");
    item.querySelector(".skin-cost").textContent = equipped
      ? "ECHIPAT"
      : owned
        ? "DEȚINUT"
        : skin.reward && !unlockedSkinRewards.has(skin.id)
          ? `PREȚ: ◈ ${skin.cost} · SAU CÂȘTIGĂ-L LA BOSS`
          : `PREȚ: ◈ ${skin.cost}`;
    button.disabled = equipped || (!owned && coins < skin.cost);
    button.textContent = equipped ? "ECHIPAT" : owned ? "ECHIPEAZĂ" : coins < skin.cost ? "NU AJUNG" : "CUMPĂRĂ";
  }
}

function buyOrEquipSkin(skinId) {
  const skin = [defaultSkin, ...skins].find(item => item.id === skinId);
  if (gameState !== "shop" || !skin) return;
  if (!ownedSkins.has(skin.id)) {
    if (coins < skin.cost) return;
    coins -= skin.cost;
    ownedSkins.add(skin.id);
  }
  equippedSkinId = skin.id;
  saveSkinProgress();
  shopMessage.textContent = `${skin.name} este echipat!`;
  updateHUD();
  updateShop();
}

function buyUpgrade(upgradeId) {
  const upgrade = upgrades.find(item => item.id === upgradeId);
  if (gameState !== "shop" || !upgrade) return;
  const level = getUpgradeLevel(upgrade);
  if (level >= upgrade.max) return;
  const cost = upgrade.costs[level];
  if (coins < cost) {
    shopMessage.textContent = "Nu ai destule monede încă.";
    updateShop();
    return;
  }
  coins -= cost;
  if (upgrade.category === "movement") movementUpgrades[upgrade.id]++;
  else attackUpgrades[upgrade.id]++;
  shopMessage.textContent = `${upgrade.name} îmbunătățit la nivelul ${level + 1}!`;
  updateHUD();
  updateShop();
}

function continueFromShop() {
  if (gameState !== "shop") return;
  gameStage.classList.remove("shop-open");
  shop.hidden = true;
  titleCard.hidden = false;
  overlay.classList.remove("shop-open");
  overlay.classList.add("hidden");
  if (currentWorld === worlds.length - 1 && currentSublevel === LEVELS_PER_WORLD - 1) {
    gameState = "won";
    overlay.classList.remove("hidden");
    overlay.querySelector(".eyebrow").textContent = "AI SALVAT CELE CINCI LUMI!";
    overlay.querySelector("h1").innerHTML = "MISIUNE<br><span>ÎMPLINITĂ</span>";
    overlay.querySelector(".title-card p").innerHTML = "Cele cinci cristale s-au întors acasă.<br>Legenda ninjaului va dăinui!";
    startButton.innerHTML = "JOACĂ DIN NOU <span>↻</span>";
    showToast("TOATE CELE CINCI CRISTALE SUNT ALE TALE!", 2600);
    return;
  }
  if (currentSublevel < LEVELS_PER_WORLD - 1) {
    loadWorld(currentWorld, currentSublevel + 1);
  } else {
    loadWorld(currentWorld + 1, 0);
  }
  gameState = "playing";
  showToast(`CHECKPOINT SALVAT · LUMEA ${currentWorld + 1} · NIVELUL ${currentSublevel + 1}/${LEVELS_PER_WORLD}: ${worlds[currentWorld].name.toLocaleUpperCase("ro")}`, 2600);
}

function endGame() {
  failedRuns++;
  endingPhase = null;
  endingTimer = 0;
  endingBoss = null;
  const respawnX = player.x;

  if (failedRuns >= 3) {
    gameOverCheckpoint = stageCheckpoint
      ? { ...stageCheckpoint }
      : { world: currentWorld, sublevel: currentSublevel, x: respawnX };
    if (customLevelMode && stageCheckpoint) gameOverCheckpoint.custom = true;
    failedRuns = 0;
    gameState = "gameover";
    keys.clear();
    for (const button of mobileControls.querySelectorAll(".touch-button")) button.classList.remove("pressed");
    shop.hidden = true;
    titleCard.hidden = false;
    gameStage.classList.remove("shop-open");
    overlay.classList.remove("hidden", "shop-open");
    overlay.querySelector(".eyebrow").textContent = "S-A TERMINAT JOCUL";
    overlay.querySelector("h1").innerHTML = "AI PIERDUT<br><span>TOATE ÎNCERCĂRILE</span>";
    overlay.querySelector(".title-card p").innerHTML = `Cele trei încercări s-au terminat.<br>Checkpoint: lumea ${gameOverCheckpoint.world + 1}, nivelul ${gameOverCheckpoint.sublevel + 1}. Ai ${coins} bănuți. Plătește ${CONTINUE_RUN_COST} pentru a continua sau începe din nou.`;
    startButton.innerHTML = "JOACĂ DIN NOU <span>↻</span>";
    continueRunButton.hidden = false;
    continueRunButton.disabled = coins < CONTINUE_RUN_COST;
    continueRunButton.textContent = coins < CONTINUE_RUN_COST
      ? `AI NEVOIE DE ${CONTINUE_RUN_COST} ◈`
      : `CONTINUĂ PENTRU ${CONTINUE_RUN_COST} ◈`;
    updateHUD();
    return;
  }

  if (customLevelMode) {
    startCustomLevel(respawnX);
    return;
  }
  loadWorld(currentWorld, currentSublevel, respawnX);
  gameState = "playing";
  showToast(`AI PIERDUT TOATE VIEȚILE. REVII AICI. ÎNCERCAREA ${failedRuns}/3.`, 2600);
}

function continueRunAfterGameOver() {
  if (gameState !== "gameover" || !gameOverCheckpoint) return;
  if (coins < CONTINUE_RUN_COST) {
    continueRunButton.disabled = true;
    return;
  }
  coins -= CONTINUE_RUN_COST;
  const checkpoint = gameOverCheckpoint;
  gameOverCheckpoint = null;
  failedRuns = 0;
  continueRunButton.hidden = true;
  continueRunButton.disabled = false;
  if (checkpoint.custom) startCustomLevel(checkpoint.x);
  else loadWorld(checkpoint.world, checkpoint.sublevel, checkpoint.x);
  gameState = "playing";
  overlay.classList.add("hidden");
  gameStage.classList.remove("shop-open");
  overlay.classList.remove("shop-open");
  updateHUD();
  showToast("AI PLĂTIT 500 DE BĂNUȚI. CONTINUI DE UNDE AI RĂMAS!", 2600);
}

function startAttack() {
  if (gameState === "playing" && (!endingPhase || endingPhase === "fight") && player.attackCooldown <= 0) {
    player.attack = 11;
    player.attackCooldown = attackCooldownForLevel(attackUpgrades.speed);
    playAttackSound();
  }
}

function startFlamethrower() {
  if (gameState !== "playing" || (endingPhase && endingPhase !== "fight") || equippedSkinId !== "fire") return;
  if (flameCooldown > 0) {
    showToast(`ARUNCĂTORUL DE FLĂCĂRI SE REÎNCARCĂ: ${(flameCooldown / 60).toFixed(1)}s`, 900);
    return;
  }
  flameDuration = 30;
  flameCooldown = 90;
  flameHitEnemies = new Set();
  playFireballSound();
}

function damageEnemy(enemy, damage) {
  if (!enemy.alive) return;
  enemy.hp -= damage;
  if (enemy.hp > 0) return;
  enemy.alive = false;
  if (enemy.endingBoss) {
    endingPhase = "absorb";
    endingTimer = 0;
    fireballs = [];
    keys.clear();
    player.vx = 0;
    player.attack = 0;
    return;
  }
  const drop = {
    sourceId: enemy.id,
    x: enemy.x + enemy.w / 2 - 7,
    y: enemy.y + enemy.h - 17,
    value: enemy.boss ? 35 + currentWorld * 20 : 4 + currentWorld * 4,
    phase: 0,
  };
  defeatedEnemies[currentWorld].set(enemy.id, { x: enemy.x, drop });
  loot.push(drop);
  if (enemy.superBoss) {
    unlockedSkinRewards.add("fire");
    ownedSkins.add("fire");
    equippedSkinId = "fire";
    saveSkinProgress();
    updateSkinShop();
    showToast("BOSSUL FINAL ÎNVINS! AI CÂȘTIGAT ȘI ECHIPAT NINJA DE FOC!", 3400);
  } else if (enemy.boss) {
    showToast("GARDIANUL A FOST ÎNVINS! CRISTALUL TE AȘTEAPTĂ.");
  }
}

function activateFinalBossCheat() {
  if (gameState === "title" || gameState === "won") beginGame();
  endingPhase = null;
  endingTimer = 0;
  endingBoss = null;
  if (gameState === "shop") {
    gameStage.classList.remove("shop-open");
    shop.hidden = true;
    titleCard.hidden = false;
    overlay.classList.remove("shop-open");
    overlay.classList.add("hidden");
  }
  loadWorld(worlds.length - 1, LEVELS_PER_WORLD - 1);
  player.x = findSafeX(bossPosition - 460, player, [
    ...hazards.map(hazardBounds),
    ...enemies.filter(enemy => enemy.alive).map(enemy => ({ x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h })),
  ], 300, bossPosition - 100);
  stageCheckpoint = { world: currentWorld, sublevel: currentSublevel, x: player.x };
  cameraX = Math.max(0, Math.min(currentWorldWidth - WIDTH, player.x - WIDTH * 0.42));
  gameState = "playing";
  showToast("COD SECRET ACTIVAT: BOSSUL SUPREM!", 2600);
}

function activateMoneyShopCheat() {
  if (gameState === "title" || gameState === "won") beginGame();
  coins += 100000;
  if (gameState !== "shop") openShop();
  else updateShop();
  updateHUD();
  shopMessage.textContent = "COD SECRET ACTIVAT: AI PRIMIT 100.000 DE BĂNUȚI!";
}

function activateMaxUpgradesCheat() {
  if (gameState === "title" || gameState === "won") beginGame();
  for (const upgrade of upgrades) {
    if (upgrade.category === "movement") movementUpgrades[upgrade.id] = upgrade.max;
    else attackUpgrades[upgrade.id] = upgrade.max;
  }
  if (gameState === "shop") updateShop();
  showToast("COD SECRET ACTIVAT: TOATE UPGRADE-URILE SUNT LA MAXIM!", 2600);
}

function activateFireSkinCheat() {
  unlockedSkinRewards.add("fire");
  ownedSkins.add("fire");
  equippedSkinId = "fire";
  flameCooldown = 0;
  saveSkinProgress();
  updateSkinShop();
  showToast("COD SECRET ACTIVAT: NINJA DE FOC ESTE ECHIPAT! APASĂ F!", 3000);
}

function activateSkipLevelCheat() {
  if (gameState === "title") beginGame();
  if (gameState !== "playing") return;
  nextWorld();
  shopMessage.textContent = "COD SECRET ACTIVAT: AI SĂRIT PESTE NIVEL!";
  showToast("COD SECRET ACTIVAT: NIVEL SĂRIT!", 2200);
}

function activateInvulnerabilityCheat() {
  if (gameState !== "playing") return;
  invulnerabilityCheatEnabled = true;
  showToast("COD SECRET ACTIVAT: EȘTI INVULNERABIL! APASĂ SPACE DE 3 ORI CA SĂ ZBORI!", 3200);
}

function activateFlightCheat() {
  if (gameState !== "playing" || !invulnerabilityCheatEnabled) return;
  flightCheatEnabled = true;
  player.onGround = false;
  player.vy = -5;
  showToast("ZBOR ACTIVAT: ȚINE SPACE CA SĂ ZBORI!", 2200);
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  if (gameState === "editor") {
    if (["arrowleft", "arrowright", "arrowup", " ", "j", "f"].includes(key)) event.preventDefault();
    return;
  }
  if (gameState === "gameover") {
    if (["arrowleft", "arrowright", "arrowup", " ", "j", "f"].includes(key)) event.preventDefault();
    keys.clear();
    return;
  }
  if (key === "i" && !event.repeat && gameState === "playing") {
    const now = performance.now();
    invulnerabilityCheatPressCount = now - lastInvulnerabilityCheatPress <= 1500
      ? invulnerabilityCheatPressCount + 1
      : 1;
    lastInvulnerabilityCheatPress = now;
    if (invulnerabilityCheatPressCount === 3) {
      invulnerabilityCheatPressCount = 0;
      activateInvulnerabilityCheat();
    }
  }
  if (key === " " && !event.repeat && gameState === "playing" && invulnerabilityCheatEnabled && !flightCheatEnabled) {
    const now = performance.now();
    spaceCheatPressCount = now - lastSpaceCheatPress <= 1500 ? spaceCheatPressCount + 1 : 1;
    lastSpaceCheatPress = now;
    if (spaceCheatPressCount === 3) {
      spaceCheatPressCount = 0;
      activateFlightCheat();
    }
  }
  if (key === "v" && !event.repeat) {
    const now = performance.now();
    cheatPressCount = now - lastCheatPress <= 1500 ? cheatPressCount + 1 : 1;
    lastCheatPress = now;
    if (cheatPressCount === 3) {
      cheatPressCount = 0;
      activateFinalBossCheat();
    }
  }
  if (key === "m" && !event.repeat) {
    const now = performance.now();
    moneyCheatPressCount = now - lastMoneyCheatPress <= 1500 ? moneyCheatPressCount + 1 : 1;
    lastMoneyCheatPress = now;
    if (moneyCheatPressCount === 3) {
      moneyCheatPressCount = 0;
      activateMoneyShopCheat();
    }
  }
  if (key === "u" && !event.repeat) {
    const now = performance.now();
    maxUpgradeCheatPressCount = now - lastMaxUpgradeCheatPress <= 1500 ? maxUpgradeCheatPressCount + 1 : 1;
    lastMaxUpgradeCheatPress = now;
    if (maxUpgradeCheatPressCount === 3) {
      maxUpgradeCheatPressCount = 0;
      activateMaxUpgradesCheat();
    }
  }
  if (key === "o" && !event.repeat) {
    const now = performance.now();
    fireSkinCheatPressCount = now - lastFireSkinCheatPress <= 1500 ? fireSkinCheatPressCount + 1 : 1;
    lastFireSkinCheatPress = now;
    if (fireSkinCheatPressCount === 3) {
      fireSkinCheatPressCount = 0;
      activateFireSkinCheat();
    }
  }
  if (key === "k" && !event.repeat) {
    const now = performance.now();
    skipLevelCheatPressCount = now - lastSkipLevelCheatPress <= 1500 ? skipLevelCheatPressCount + 1 : 1;
    lastSkipLevelCheatPress = now;
    if (skipLevelCheatPressCount === 3) {
      skipLevelCheatPressCount = 0;
      activateSkipLevelCheat();
    }
  }
  if (["arrowleft", "arrowright", "arrowup", " ", "j", "f"].includes(key)) event.preventDefault();
  keys.add(key);
  if (key === " " || key === "arrowup" || key === "w") jumpPlayer();
  if (key === "j") startAttack();
  if (key === "f") startFlamethrower();
}

function jumpPlayer() {
  if (gameState === "playing" && (!endingPhase || endingPhase === "fight") && player.onGround) {
    player.vy = -jumpPowerForLevel(movementUpgrades.jump);
    player.onGround = false;
  }
}

function handleKeyUp(event) { keys.delete(event.key.toLowerCase()); }

for (const button of mobileControls.querySelectorAll(".touch-button")) {
  let heldKey = "";
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    event.stopPropagation();
    if (gameState !== "playing") return;
    button.setPointerCapture(event.pointerId);
    button.classList.add("pressed");
    heldKey = button.dataset.touchKey || "";
    if (heldKey) keys.add(heldKey);
    if (button.dataset.touchAction === "jump") jumpPlayer();
    if (button.dataset.touchAction === "attack") startAttack();
    if (button.dataset.touchAction === "flame") startFlamethrower();
  });
  const release = event => {
    event.preventDefault();
    event.stopPropagation();
    if (heldKey) keys.delete(heldKey);
    heldKey = "";
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

gameStage.addEventListener("pointerdown", event => {
  if (gameState === "playing" && event.button === 0) startAttack();
});

function hazardBounds(hazard) {
  return {
    x: hazard.x,
    y: hazard.type === "pit" ? GROUND_Y - 40 : GROUND_Y - 18,
    w: hazard.w,
    h: hazard.type === "pit" ? 80 : 24,
  };
}

function overlapsAtX(actor, x, blocker) {
  return actor.y < blocker.y + blocker.h &&
    actor.y + actor.h > blocker.y &&
    x < blocker.x + blocker.w &&
    x + actor.w > blocker.x;
}

function findSafeX(startX, actor, blockers, minX = 0, maxX = currentWorldWidth - actor.w) {
  const origin = Math.max(minX, Math.min(maxX, startX));
  for (let distance = 0; distance <= maxX - minX; distance += 8) {
    for (const candidate of distance === 0 ? [origin] : [origin - distance, origin + distance]) {
      if (candidate >= minX && candidate <= maxX && !blockers.some(blocker => overlapsAtX(actor, candidate, blocker))) {
        return candidate;
      }
    }
  }
  return origin;
}

function moveActorHorizontally(actor, delta, blockers, minX = 0, maxX = currentWorldWidth - actor.w) {
  let x = Math.max(minX, Math.min(maxX, actor.x + delta));
  let blockedBy = null;
  for (const blocker of blockers) {
    if (!blocker || blocker === actor || !overlapsAtX(actor, x, blocker)) continue;
    blockedBy = blocker;
    if (delta > 0) x = Math.min(x, blocker.x - actor.w);
    else if (delta < 0) x = Math.max(x, blocker.x + blocker.w);
  }
  actor.x = Math.max(minX, Math.min(maxX, x));
  return blockedBy;
}

function update(delta = 16.6667) {
  if (gameState !== "playing") return;
  if (endingPhase && endingPhase !== "fight") {
    updateEndingSequence();
    return;
  }
  const dt = Math.max(0.5, Math.min(2.2, delta / 16.6667));
  const moveLeft = keys.has("a") || keys.has("arrowleft");
  const moveRight = keys.has("d") || keys.has("arrowright");
  if (moveLeft !== moveRight) {
    const moveSpeed = movementSpeedForLevel(movementUpgrades.runSpeed);
    player.vx = moveRight ? moveSpeed : -moveSpeed;
    player.facing = moveRight ? 1 : -1;
    player.walk += 0.19 * dt;
  } else {
    player.vx *= Math.pow(0.7, dt);
  }
  player.vy = flightCheatEnabled && keys.has(" ")
    ? -5
    : Math.min(player.vy + 0.52 * dt, 11);
  const oldY = player.y;
  player.y += player.vy * dt;
  player.onGround = false;
  if (player.vy >= 0) {
    const surfaces = [...groundSegments.map(segment => ({ ...segment, y: GROUND_Y })), ...platforms];
    for (const platform of surfaces) {
      if (oldY + player.h <= platform.y && player.y + player.h >= platform.y &&
          player.x + player.w > platform.x && player.x < platform.x + platform.w) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }
  const playerBlocker = moveActorHorizontally(
    player,
    player.vx * dt,
    enemies.filter(enemy => enemy.alive),
  );
  if (playerBlocker && !playerBlocker.boss && player.invulnerable <= 0) {
    hurtPlayer(false, playerBlocker.x < player.x ? -1 : 1);
  }
  if (player.y > HEIGHT + 40) hurtPlayer(true);
  if (player.invulnerable <= 0 && hazards.some(hazard =>
    hazard.type === "spikes" &&
    overlaps(player, { x: hazard.x + 4, y: GROUND_Y - 17, w: hazard.w - 8, h: 17 })
  )) hurtPlayer(false, player.vx >= 0 ? 1 : -1);
  if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);
  if (player.attack > 0) player.attack = Math.max(0, player.attack - dt);
  if (player.attackCooldown > 0) player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  if (flameDuration > 0) flameDuration = Math.max(0, flameDuration - dt);
  if (flameCooldown > 0) flameCooldown = Math.max(0, flameCooldown - dt);
  if (worldTransition > 0) worldTransition = Math.max(0, worldTransition - dt);
  if (damageFlash > 0) damageFlash = Math.max(0, damageFlash - dt);

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const range = enemy.boss ? 94 + currentWorld * 8 : 52 + currentWorld * 5;
    enemy.phase += 0.07 * dt;
    if (Math.abs(player.x - enemy.x) < range) enemy.direction = player.x > enemy.x ? 1 : -1;
    else if (Math.abs(enemy.x - enemy.homeX) > 42) enemy.direction = enemy.x > enemy.homeX ? -1 : 1;
    if (enemy.boss) {
      if (enemy.attackWindup > 0 || enemy.attackActive > 0) enemy.direction = enemy.attackDirection;
      const playerDistance = Math.abs((player.x + player.w / 2) - (enemy.x + enemy.w / 2));
      if (enemy.attackCooldown > 0) enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      if (enemy.attackWindup > 0) {
        enemy.attackWindup = Math.max(0, enemy.attackWindup - dt);
        if (enemy.attackWindup <= 0.05) {
          enemy.attackWindup = 0;
          enemy.attackActive = 12;
          enemy.attackHit = false;
        }
      } else if (enemy.attackActive > 0) {
        if (!enemy.attackHit) {
          const hitbox = {
            x: enemy.attackDirection > 0 ? enemy.x + enemy.w : enemy.x - 138,
            y: enemy.y + 7,
            w: 138,
            h: enemy.h - 7,
          };
          if (player.invulnerable <= 0 && overlaps(player, hitbox)) {
            hurtPlayer(false, enemy.attackDirection);
          }
          enemy.attackHit = true;
        }
        enemy.attackActive = Math.max(0, enemy.attackActive - dt);
        if (enemy.attackActive <= 0.05) {
          enemy.attackActive = 0;
          enemy.attackCooldown = 150;
        }
      } else if (enemy.attackCooldown <= 0.05 && playerDistance < 185) {
        enemy.attackDirection = player.x >= enemy.x ? 1 : -1;
        enemy.direction = enemy.attackDirection;
        enemy.attackWindup = 45;
      }
    }
    const blockers = [
      player,
      ...enemies.filter(other => other.alive && other !== enemy),
      ...hazards.map(hazardBounds),
    ];
    const preparingAttack = enemy.boss && (enemy.attackWindup > 0 || enemy.attackActive > 0);
    const enemyMaxX = enemy.endingBoss ? currentWorldWidth - enemy.w : bossPosition - 60;
    let blockedBy = preparingAttack
      ? null
      : moveActorHorizontally(enemy, enemy.direction * enemy.speed * dt, blockers, 300, enemyMaxX);
    if (blockedBy) {
      if (blockedBy === player && !enemy.boss && player.invulnerable <= 0) {
        hurtPlayer(false, enemy.x < player.x ? -1 : 1);
      }
      enemy.direction *= -1;
      blockedBy = moveActorHorizontally(enemy, enemy.direction * enemy.speed * dt, blockers, 300, enemyMaxX);
      if (blockedBy === player && !enemy.boss && player.invulnerable <= 0) {
        hurtPlayer(false, enemy.x < player.x ? -1 : 1);
      }
    }
    if (enemy.superBoss) {
      enemy.shootCooldown = Math.max(0, enemy.shootCooldown - dt);
      if (enemy.shootCooldown <= 0.05 && Math.abs(player.x - enemy.x) < 760) {
        const direction = player.x >= enemy.x ? 1 : -1;
        const fireballSpeed = 4.2;
        const targetY = player.y + player.h / 2;
        const originY = enemy.y + enemy.h / 2;
        const verticalAim = Math.max(-2.3, Math.min(2.3, (targetY - originY) / Math.max(100, Math.abs(player.x - enemy.x)) * fireballSpeed));
        fireballs.push({
          x: enemy.x + (direction > 0 ? enemy.w : -18),
          y: originY - 9,
          w: 18,
          h: 18,
          vx: direction * fireballSpeed,
          vy: verticalAim,
          gravity: 0.035,
        });
        enemy.shootCooldown = Math.max(42, 88 - currentDifficulty * 2);
        playFireballSound();
      } else if (enemy.shootCooldown <= 0.05) {
        enemy.shootCooldown = 30;
      }
    }
    if (flameDuration > 0 && !flameHitEnemies.has(enemy.id)) {
      const flameBounds = {
        x: player.facing > 0 ? player.x + player.w : player.x - 220,
        y: player.y + 3,
        w: 220,
        h: player.h - 6,
      };
      if (overlaps(enemy, flameBounds)) {
        flameHitEnemies.add(enemy.id);
        damageEnemy(enemy, 10 + attackUpgrades.power * 2);
      }
    }
    if (!enemy.alive) continue;
    if (player.attack > 4 && Math.abs((player.x + player.w / 2) - (enemy.x + enemy.w / 2)) < (enemy.boss ? 65 : 48) + attackUpgrades.reach * 26 &&
        Math.abs((player.y + player.h / 2) - (enemy.y + enemy.h / 2)) < (enemy.boss ? 63 : 42) &&
        (enemy.x - player.x) * player.facing > -8) {
      damageEnemy(enemy, 1 + attackUpgrades.power * 3);
      enemy.x += player.facing * 12;
      player.attack = 4;
    }
  }

  for (let i = fireballs.length - 1; i >= 0; i--) {
    const fireball = fireballs[i];
    fireball.x += fireball.vx * dt;
    fireball.y += fireball.vy * dt;
    fireball.vy += fireball.gravity * dt;
    if (fireball.x + fireball.w < 0 || fireball.x > currentWorldWidth || fireball.y > HEIGHT + 60 || fireball.y + fireball.h < -60) {
      fireballs.splice(i, 1);
      continue;
    }
    if (overlaps(player, fireball)) {
      fireballs.splice(i, 1);
      hurtPlayer(false, fireball.vx > 0 ? -1 : 1);
    }
  }

  for (let i = loot.length - 1; i >= 0; i--) {
    const drop = loot[i];
    drop.phase += 0.08 * dt;
    drop.y += Math.sin(drop.phase) * 0.18 * dt;
    if (overlaps(player, { x: drop.x, y: drop.y, w: 15, h: 15 })) {
      coins += drop.value;
      collectedEnemyLoot[currentWorld].add(drop.sourceId);
      loot.splice(i, 1);
      updateHUD();
      showToast(`+${drop.value} MONED${drop.value === 1 ? "Ă" : "E"}!`, 700);
      if (drop.type === "pouch") {
        nextWorld();
        break;
      }
    }
  }

  const boss = enemies.find(enemy => enemy.boss);
  if (customLevelMode && overlaps(player, {
    x: currentWorldWidth - 76,
    y: GROUND_Y - 62,
    w: 44,
    h: 62,
  })) {
    finishCustomLevel();
    return;
  }
  if (!endingPhase && currentSublevel === LEVELS_PER_WORLD - 1 && boss && !boss.alive &&
      overlaps(player, { x: crystalPosition - 6, y: GROUND_Y - 36, w: 24, h: 36 })) nextWorld();
  cameraX = Math.max(0, Math.min(currentWorldWidth - WIDTH, player.x - WIDTH * 0.42));
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function hurtPlayer(fell, enemyDirection = 0) {
  if (invulnerabilityCheatEnabled || player.invulnerable > 0) return;
  player.hp--;
  damageFlash = 32;
  playHurtSound();
  if (player.hp <= 0) {
    updateHUD();
    endGame();
    return;
  }
  if (fell) {
    player.x = Math.max(30, player.x - 160);
    player.y = GROUND_Y - player.h;
    player.vy = 0;
  } else {
    player.vx = -enemyDirection * 4.5;
    player.vy = -5.5;
  }
  player.invulnerable = 100;
  updateHUD();
  showToast("AI FOST LOVIT! FEREȘTE-TE DE MONȘTRI.", 1100);
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawBackground(world, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, world.colors[0]);
  gradient.addColorStop(.68, world.colors[1]);
  gradient.addColorStop(1, world.colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.globalAlpha = .7;
  rect(748, 75, 62, 62, world.moon);
  rect(760, 65, 38, 8, world.colors[0]);
  rect(804, 89, 8, 38, world.colors[0]);
  ctx.globalAlpha = 1;

  for (let i = 0; i < 45; i++) {
    const x = (i * 197 - cameraX * .16 + 4000) % 1040;
    const y = 35 + (i * 71) % 260;
    const twinkle = .35 + Math.sin(time * .002 + i) * .2;
    ctx.globalAlpha = twinkle;
    rect(x, y, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2, world.accent);
  }
  ctx.globalAlpha = 1;

  for (let layer = 0; layer < 3; layer++) {
    const parallax = .18 + layer * .16;
    const blockWidth = 150 + layer * 42;
    const shift = (cameraX * parallax) % blockWidth;
    const base = 329 + layer * 41;
    ctx.globalAlpha = .20 + layer * .12;
    ctx.fillStyle = world.colors[(layer + 2) % world.colors.length];
    for (let x = -blockWidth - shift; x < WIDTH + blockWidth; x += blockWidth) {
      const h = 50 + ((Math.floor((x + shift) / blockWidth) * 37 + layer * 23 + 800) % 80);
      ctx.fillRect(Math.round(x), base - h, blockWidth + 1, HEIGHT - base + h);
      if (world.kind === "forest") {
        rect(x + 20, base - h - 15, 20, 18, world.colors[2]);
        rect(x + 2, base - h - 3, 54, 10, world.colors[2]);
      }
      if (world.kind === "desert") {
        rect(x + 55, base - h + 18, 36, 6, world.colors[3]);
        rect(x + 66, base - h + 5, 10, 25, world.colors[3]);
      }
      if (world.kind === "ice") {
        rect(x + 29, base - h - 10, 18, 19, world.colors[2]);
        rect(x + 38, base - h - 20, 7, 30, world.colors[2]);
      }
      if (world.kind === "lava" && layer === 2) {
        rect(x + 24, base - h + 30, 14, 5, world.accent);
        rect(x + 28, base - h + 39, 7, 3, world.accent);
      }
      if (world.kind === "shadow") {
        rect(x + 27, base - h - 7, 10, 12, world.colors[2]);
        rect(x + 19, base - h - 3, 7, 8, world.colors[2]);
      }
    }
  }

  if (world.kind === "lava") {
    ctx.globalAlpha = .36;
    for (let i = 0; i < 8; i++) {
      const x = (i * 171 - cameraX * .4 + 2400) % 1050;
      rect(x, 426 + Math.sin(time * .003 + i) * 4, 34, 5, world.accent);
      rect(x + 5, 431, 19, 3, "#ffcb6c");
    }
    ctx.globalAlpha = 1;
  }
}

function drawGround(world) {
  rect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, "#17141d");
  for (const segment of groundSegments) {
    const left = Math.max(0, segment.x - cameraX);
    const right = Math.min(WIDTH, segment.x + segment.w - cameraX);
    if (right <= left) continue;
    rect(left, GROUND_Y, right - left, HEIGHT - GROUND_Y, world.ground);
    rect(left, GROUND_Y, right - left, 5, world.platform);
    const firstMark = Math.ceil((segment.x - cameraX) / 38) * 38 + 6 - cameraX;
    for (let x = firstMark; x < right; x += 38) {
      if (x >= left) rect(x, GROUND_Y + 12, 14, 3, world.colors[2]);
      if (x + 17 >= left) rect(x + 17, GROUND_Y + 28, 8, 3, world.colors[1]);
      if (x + 6 >= left) rect(x + 6, GROUND_Y + 42, 20, 3, world.colors[2]);
    }
  }
  for (const hazard of hazards) {
    const x = hazard.x - cameraX;
    if (x + hazard.w < 0 || x > WIDTH) continue;
    if (hazard.type === "pit") {
      rect(x, GROUND_Y - 2, hazard.w, 7, "#14131c");
      rect(x + 5, GROUND_Y + 9, hazard.w - 10, 4, world.kind === "lava" ? "#ff755b" : "#55496b");
      rect(x + 13, GROUND_Y + 19, hazard.w - 26, 3, world.kind === "lava" ? "#ffb271" : "#362f4b");
      continue;
    }
    const spikeCount = Math.max(2, Math.floor(hazard.w / 15));
    for (let i = 0; i < spikeCount; i++) {
      const spikeX = x + i * hazard.w / spikeCount;
      const spikeWidth = hazard.w / spikeCount;
      ctx.fillStyle = world.kind === "ice" ? "#c6f3ff" : world.kind === "lava" ? "#ff9870" : "#c9c8d5";
      ctx.beginPath();
      ctx.moveTo(Math.round(spikeX), GROUND_Y + 3);
      ctx.lineTo(Math.round(spikeX + spikeWidth / 2), GROUND_Y - 18);
      ctx.lineTo(Math.round(spikeX + spikeWidth), GROUND_Y + 3);
      ctx.closePath();
      ctx.fill();
      rect(spikeX + spikeWidth / 2 - 1, GROUND_Y - 5, 2, 6, "#fff1d8");
    }
  }
  for (const platform of platforms) {
    const x = platform.x - cameraX;
    if (x > -platform.w && x < WIDTH) {
      rect(x, platform.y, platform.w, platform.h, world.ground);
      rect(x, platform.y, platform.w, 5, world.platform);
      rect(x + 8, platform.y + 8, 11, 3, world.colors[2]);
      rect(x + platform.w - 28, platform.y + 8, 13, 3, world.colors[2]);
    }
  }
}

function drawNinja(time) {
  if (player.invulnerable > 0 && Math.floor(time / 70) % 2 === 0) return;
  const x = player.x - cameraX;
  const y = player.y;
  const step = player.onGround && Math.abs(player.vx) > .5 ? Math.sin(player.walk) * 3 : 0;
  const skin = [defaultSkin, ...skins].find(item => item.id === equippedSkinId) || defaultSkin;
  if (player.attack > 4) {
    ctx.globalAlpha = .58;
    const slashWidth = 28 + attackUpgrades.reach * 26;
    const slashX = x + (player.facing > 0 ? player.w + 2 : -slashWidth);
    rect(slashX, y + 10, slashWidth, 4, "#ecffff");
    rect(slashX + (player.facing > 0 ? 6 : 4), y + 5, slashWidth - 10, 3, "#a9f7ff");
    rect(slashX + (player.facing > 0 ? 12 : 0), y + 17, slashWidth - 10, 3, "#a9f7ff");
    ctx.globalAlpha = 1;
  }
  rect(x + 5, y + 8, 16, 18, skin.body);
  rect(x + 3, y + 8, 19, 9, skin.hood);
  rect(x + (player.facing > 0 ? 12 : 2), y + 12, 11, 4, "#f3e6da");
  rect(x + (player.facing > 0 ? 17 : 4), y + 13, 4, 3, skin.accent);
  rect(x + 6, y + 4, 14, 5, skin.scarf);
  rect(x + (player.facing > 0 ? 0 : 17), y + 5, 12, 3, skin.accent);
  rect(x + 7, y + 25, 6, 8 + step, skin.body);
  rect(x + 15, y + 25, 6, 8 - step, skin.body);
  rect(x + 5, y + 32 + step, 9, 5, skin.hood);
  rect(x + 14, y + 32 - step, 9, 5, skin.hood);
  rect(x + 2, y + 20, 6, 4, skin.scarf);
  rect(x + (player.facing > 0 ? 19 : 0), y + 19, 8, 4, skin.scarf);
}

function drawEnemy(enemy, world) {
  const x = enemy.x - cameraX;
  if (x < -80 || x > WIDTH + 80) return;
  const y = enemy.y + (enemy.boss ? 0 : Math.sin(enemy.phase) * 1.3);
  if (enemy.boss) {
    if (enemy.attackWindup > 0) {
      const warningX = x + enemy.w / 2 - 5;
      rect(warningX - 3, y - 24, 16, 20, "#521f32");
      rect(warningX + 3, y - 21, 4, 11, "#ff697d");
      rect(warningX + 3, y - 7, 4, 4, "#fff0a1");
      rect(x, y - 2, enemy.w * (1 - enemy.attackWindup / 45), 3, "#ff697d");
    } else if (enemy.attackActive > 0) {
      const slashX = enemy.attackDirection > 0 ? x + enemy.w : x - 62;
      ctx.globalAlpha = .8;
      rect(slashX, y + 23, 62, 5, world.accent);
      rect(slashX + 8, y + 16, 48, 3, "#fff0a1");
      rect(slashX + 13, y + 32, 42, 3, "#fff0a1");
      ctx.globalAlpha = 1;
    }
    if (enemy.superBoss) {
      rect(x + 12, y + 8, 58, 62, "#211525");
      rect(x + 5, y + 22, 72, 39, world.boss);
      rect(x + 12, y + 5, 58, 27, world.boss);
      rect(x + 8, y + 31, 66, 9, "#292138");
      rect(x + (enemy.direction > 0 ? 49 : 19), y + 37, 13, 8, "#fff0a0");
      rect(x + 14, y + 59, 18, 17, "#221b2b");
      rect(x + 51, y + 59, 18, 17, "#221b2b");
      rect(x + 9, y, 18, 16, world.accent);
      rect(x + 56, y, 18, 16, world.accent);
      rect(x + 30, y + 51, 23, 6, "#28202e");
      rect(x, y - 12, enemy.w, 6, "#352637");
      rect(x, y - 12, enemy.w * enemy.hp / (enemy.maxHp || 4 + currentDifficulty * 5), 6, "#ff697d");
      return;
    }
    rect(x + 8, y + 4, 36, 49, "#211b2a");
    rect(x + 3, y + 16, 45, 31, world.boss);
    rect(x + 8, y + 3, 37, 19, world.boss);
    rect(x + 5, y + 20, 43, 7, "#292138");
    rect(x + (enemy.direction > 0 ? 30 : 11), y + 25, 8, 5, "#ffed9c");
    rect(x + 5, y + 46, 12, 10, "#221b2b");
    rect(x + 34, y + 46, 12, 10, "#221b2b");
    rect(x + 7, y, 8, 9, world.accent);
    rect(x + 37, y, 8, 9, world.accent);
    rect(x + 17, y + 35, 19, 4, "#28202e");
    const bossMaxHp = enemy.maxHp || 4 + currentDifficulty * 5;
    rect(x, y - 12, 51, 5, "#352637");
    rect(x, y - 12, 51 * enemy.hp / bossMaxHp, 5, "#ff697d");
  } else {
    rect(x + 4, y + 6, 19, 18, "#222331");
    rect(x + 1, y + 12, 24, 12, world.enemy);
    rect(x + 5, y + 3, 6, 8, world.enemy);
    rect(x + 17, y + 2, 6, 9, world.enemy);
    rect(x + (enemy.direction > 0 ? 14 : 5), y + 12, 5, 4, "#fff0b6");
    rect(x + 5, y + 23, 6, 4, "#252331");
    rect(x + 17, y + 23, 6, 4, "#252331");
    if (currentWorld > 0) {
      rect(x, y - 5, 26, 3, "#352637");
      rect(x, y - 5, 26 * enemy.hp / (1 + currentWorld * 2), 3, "#ff697d");
    }
  }
}

function drawFlamethrower(time) {
  if (flameDuration <= 0 || equippedSkinId !== "fire") return;
  const x = player.x - cameraX;
  const y = player.y;
  const length = 150 + Math.sin(time * .05) * 22;
  const flameX = player.facing > 0 ? x + player.w : x - length;
  const flicker = Math.sin(time * .08) * 5;
  ctx.globalAlpha = .24;
  rect(flameX, y + 7, length, player.h - 12, "#ff3d20");
  ctx.globalAlpha = .75;
  rect(flameX + (player.facing > 0 ? 12 : 5), y + 12 + flicker, length - 18, 14, "#ff6128");
  rect(flameX + (player.facing > 0 ? 34 : 10), y + 17 - flicker, length - 45, 8, "#ffb52e");
  ctx.globalAlpha = .95;
  rect(flameX + (player.facing > 0 ? 12 : 5), y + 19, Math.max(8, length - 34), 5, "#fff0a1");
  ctx.globalAlpha = 1;
  for (let i = 0; i < 7; i++) {
    const emberX = player.facing > 0
      ? flameX + ((time * .3 + i * 31) % length)
      : flameX + length - ((time * .3 + i * 31) % length);
    const emberY = y + 7 + ((i * 13 + Math.floor(time / 55)) % 28);
    rect(emberX, emberY, 4, 3, i % 2 ? "#fff0a1" : "#ff542e");
  }
}

function drawFireballs() {
  for (const fireball of fireballs) {
    const x = fireball.x - cameraX;
    if (x < -24 || x > WIDTH + 24) continue;
    const y = fireball.y;
    ctx.globalAlpha = .28;
    rect(x - Math.sign(fireball.vx) * 8, y + 3, 22, 12, "#ff5238");
    ctx.globalAlpha = 1;
    rect(x + 5, y, 9, 4, "#fff0a1");
    rect(x + 1, y + 4, 16, 10, "#ff743c");
    rect(x + 5, y + 14, 9, 4, "#d62e41");
    rect(x + 6, y + 5, 7, 7, "#ffd56b");
  }
}

function drawLoot() {
  for (const drop of loot) {
    const x = drop.x - cameraX;
    if (x < -20 || x > WIDTH + 20) continue;
    const y = drop.y + Math.sin(drop.phase) * 2;
    if (drop.type === "pouch") {
      rect(x + 4, y, 7, 3, "#e4a843");
      rect(x + 2, y + 3, 11, 10, "#b97837");
      rect(x + 4, y + 3, 7, 8, "#e7b84e");
      rect(x + 6, y + 5, 3, 4, "#fff0a1");
      rect(x + 4, y + 13, 3, 2, "#89512e");
      rect(x + 9, y + 13, 3, 2, "#89512e");
      continue;
    }
    rect(x + 4, y, 8, 4, "#fff0a1");
    rect(x + 1, y + 4, 14, 8, "#f3bf4f");
    rect(x + 4, y + 12, 8, 4, "#b97837");
    rect(x + 6, y + 5, 3, 6, "#fff0a1");
  }
}

function drawCrystal(world, time) {
  if (currentSublevel !== LEVELS_PER_WORLD - 1) return;
  const boss = enemies.find(enemy => enemy.boss);
  if (boss && boss.alive) {
    const x = crystalPosition - cameraX;
    rect(x + 14, GROUND_Y - 41, 4, 36, world.accent);
    rect(x + 6, GROUND_Y - 24, 22, 3, world.accent);
    return;
  }
  const bob = Math.sin(time * .004) * 5;
  const x = crystalPosition - cameraX;
  const y = GROUND_Y - 37 + bob;
  ctx.globalAlpha = .35;
  rect(x - 12, y + 3, 37, 28, world.accent);
  ctx.globalAlpha = 1;
  rect(x + 1, y, 12, 8, "#efffff");
  rect(x - 5, y + 8, 24, 11, world.accent);
  rect(x - 1, y + 19, 16, 8, world.accent);
  rect(x + 3, y + 27, 8, 7, world.accent);
  rect(x + 2, y + 9, 6, 9, "#ffffff");
  rect(x + 6, y + 4, 3, 4, "#fff");
}

function drawEndingCrystal(x, y, color) {
  rect(x - 3, y - 9, 6, 4, "#fff");
  rect(x - 7, y - 5, 14, 10, color);
  rect(x - 4, y + 5, 8, 6, color);
  rect(x - 2, y + 11, 4, 4, "#fff0a1");
  rect(x - 2, y - 3, 3, 7, "#ffffff");
}

function drawEndingDialogue(speaker, line) {
  const dialogueY = 24;
  ctx.fillStyle = "#10121df2";
  ctx.fillRect(42, dialogueY, WIDTH - 84, 88);
  ctx.strokeStyle = "#d6c5ff";
  ctx.lineWidth = 3;
  ctx.strokeRect(42, dialogueY, WIDTH - 84, 88);
  ctx.textAlign = "left";
  ctx.fillStyle = "#a5f2c0";
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.fillText(speaker, 66, dialogueY + 30);
  ctx.fillStyle = "#fff";
  ctx.font = '19px "VT323", monospace';
  ctx.fillText(line, 66, dialogueY + 63);
}

function drawEndingScene(time) {
  if (!endingPhase || endingPhase === "fight") return;
  if (endingPhase === "steal" || endingPhase === "dialogue") drawEnemy(endingBoss, worlds[currentWorld]);

  const playerX = player.x - cameraX + player.w / 2;
  const playerY = player.y + player.h / 2;
  const bossX = endingBoss.x - cameraX + endingBoss.w / 2;
  const bossY = endingBoss.y + endingBoss.h / 2 - 8;
  if (endingPhase === "gather" || endingPhase === "steal") {
    const progress = endingPhase === "steal" ? Math.min(endingTimer / 100, 1) : 0;
    for (let index = 0; index < worlds.length; index++) {
      const angle = time * 0.003 + index * Math.PI * 2 / worlds.length;
      const startX = playerX + Math.cos(angle) * 38;
      const startY = playerY + Math.sin(angle) * 28;
      const x = startX + (bossX - startX) * progress;
      const y = startY + (bossY - startY) * progress;
      drawEndingCrystal(x, y, worlds[index].accent);
    }
    if (endingPhase === "gather") {
      drawEndingDialogue("NINJA", "Cele cinci cristale... împreună vor salva lumile!");
    } else if (endingTimer < 55) {
      drawEndingDialogue("NINJA", "Hei! Cristalele! Dă-mi-le înapoi!");
    }
  }
  if (endingPhase === "dialogue") {
    for (let index = 0; index < worlds.length; index++) {
      const angle = index * Math.PI * 2 / worlds.length;
      drawEndingCrystal(
        bossX + Math.cos(angle) * 43,
        bossY + Math.sin(angle) * 29,
        worlds[index].accent,
      );
    }
    const lineIndex = Math.floor(endingTimer / 100);
    if (lineIndex === 0) drawEndingDialogue("BOSSUL", "Puterea cristalelor va fi doar a mea!");
    else if (lineIndex === 1) drawEndingDialogue("NINJA", "Nu te voi lăsa să distrugi cele cinci lumi!");
    else drawEndingDialogue("BOSSUL", "Atunci luptă pentru ele, ninja!");
  }
  if (endingPhase === "absorb") {
    const progress = Math.min(endingTimer / 210, 1);
    for (let index = 0; index < worlds.length; index++) {
      const angle = time * 0.005 + index * Math.PI * 2 / worlds.length;
      const radius = 48 * (1 - progress);
      const x = playerX + Math.cos(angle) * radius;
      const y = playerY + Math.sin(angle) * radius;
      drawEndingCrystal(x, y, worlds[index].accent);
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, progress - .7) * .9})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (endingTimer < 125) drawEndingDialogue("NINJA", "Cristalele... puterea lor curge prin mine!");
  }
}

function draw(time = 0) {
  if (gameState === "editor") {
    drawLevelEditor();
    return;
  }
  if (gameState === "parttwo") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f4f0e7";
    ctx.font = '22px "Press Start 2P", monospace';
    ctx.fillText("PART TWO", WIDTH / 2, HEIGHT / 2 - 12);
    ctx.fillStyle = "#a5f2c0";
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText("COMING SOON", WIDTH / 2, HEIGHT / 2 + 28);
    return;
  }
  const world = worlds[currentWorld];
  drawBackground(world, time);
  drawGround(world);
  for (const enemy of enemies) if (enemy.alive) drawEnemy(enemy, world);
  drawFireballs();
  drawFlamethrower(time);
  drawLoot();
  drawCrystal(world, time);
  if (customLevelMode) {
    const gateX = currentWorldWidth - 76 - cameraX;
    rect(gateX + 18, GROUND_Y - 54, 8, 54, "#d6c5ff");
    rect(gateX + 2, GROUND_Y - 58, 38, 5, "#a5f2c0");
  }
  drawNinja(time);
  if (worldTransition > 0 && gameState === "playing") {
    ctx.fillStyle = `rgba(10, 12, 20, ${Math.min(worldTransition / 35, 1) * .64})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = world.accent;
    ctx.textAlign = "center";
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(`LUMEA ${currentWorld + 1} · NIVEL ${currentSublevel + 1}/${LEVELS_PER_WORLD}`, WIDTH / 2, HEIGHT / 2 - 5);
    ctx.fillStyle = "#fff";
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText(world.name.toLocaleUpperCase("ro"), WIDTH / 2, HEIGHT / 2 + 20);
  }
  if (damageFlash > 0) {
    const intensity = damageFlash / 32;
    const edge = 28;
    const top = ctx.createLinearGradient(0, 0, 0, edge);
    top.addColorStop(0, `rgba(255, 20, 42, ${intensity * 0.78})`);
    top.addColorStop(1, "rgba(255, 20, 42, 0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, WIDTH, edge);
    const bottom = ctx.createLinearGradient(0, HEIGHT - edge, 0, HEIGHT);
    bottom.addColorStop(0, "rgba(255, 20, 42, 0)");
    bottom.addColorStop(1, `rgba(255, 20, 42, ${intensity * 0.78})`);
    ctx.fillStyle = bottom;
    ctx.fillRect(0, HEIGHT - edge, WIDTH, edge);
    const left = ctx.createLinearGradient(0, 0, edge, 0);
    left.addColorStop(0, `rgba(255, 20, 42, ${intensity * 0.78})`);
    left.addColorStop(1, "rgba(255, 20, 42, 0)");
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, edge, HEIGHT);
    const right = ctx.createLinearGradient(WIDTH - edge, 0, WIDTH, 0);
    right.addColorStop(0, "rgba(255, 20, 42, 0)");
    right.addColorStop(1, `rgba(255, 20, 42, ${intensity * 0.78})`);
    ctx.fillStyle = right;
    ctx.fillRect(WIDTH - edge, 0, edge, HEIGHT);
  }
  drawEndingScene(time);
}

function frame(time) {
  const delta = Math.min(time - lastFrame, 40);
  lastFrame = time;
  mobileControls.hidden = gameState !== "playing";
  mobileFlameButton.hidden = equippedSkinId !== "fire";
  gameStage.classList.toggle("editor-open", gameState === "editor");
  gameStage.classList.toggle("title-screen", gameState === "title");
  if (gameState === "editor") drawLevelEditor();
  if (delta > 0 && gameState === "playing") update(delta);
  if (gameState !== "gameover") draw(time);
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", () => {
  keys.clear();
  for (const button of mobileControls.querySelectorAll(".touch-button")) button.classList.remove("pressed");
});
startButton.addEventListener("click", () => {
  if (gameState === "customwon") openLevelEditor();
  else beginGame();
});
createLevelButton.addEventListener("click", openLevelEditor);
customReplayButton.addEventListener("click", () => startCustomLevel());
customHomeButton.addEventListener("click", returnToMainMenu);
editorCanvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  placeEditorObject(event);
});
for (const button of levelEditor.querySelectorAll(".editor-tool")) {
  button.addEventListener("click", () => {
    editorTool = button.dataset.editorTool;
    for (const toolButton of levelEditor.querySelectorAll(".editor-tool")) {
      toolButton.classList.toggle("selected", toolButton === button);
    }
    editorMessage.textContent = editorTool === "erase"
      ? "Apasă pe un obiect din grilă pentru a-l șterge."
      : `Instrument selectat: ${button.textContent}. Apasă pe grilă pentru plasare.`;
  });
}
editorClearButton.addEventListener("click", () => {
  customLevelObjects.length = 0;
  drawLevelEditor();
  editorMessage.textContent = "Nivelul este gol. Poarta de final rămâne în dreapta.";
});
editorPlayButton.addEventListener("click", () => startCustomLevel());
editorBackButton.addEventListener("click", closeLevelEditor);
continueRunButton.addEventListener("click", continueRunAfterGameOver);
audioToggle.addEventListener("click", toggleAudio);
continueButton.addEventListener("click", continueFromShop);
loadSkinProgress();
renderShopItems();
loadWorld(0);
requestAnimationFrame(frame);
