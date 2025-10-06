/* File: app.js
   Purpose: Game logic for Water Drop prototype.
   Comments minimized; explain "why" where non-obvious.
*/

// ---- Config / constants ----
const CONFIG = {
  spawnInterval: 800,      // ms between spawns (will scale down)
  badChance: 0.18,         // probability a new drop is pollutant
  dropRadius: 18,
  baseSpeed: 70,           // px/sec
  gravityIncrease: 0.5,    // speed multiplier per difficulty stage
  checkpointScores: [50, 120, 220], // when to show facts
  facts: [
    "1 in 10 people lack access to safe water. Clean water helps education, health, and livelihoods.",
    "charity: water helps fund community-owned water projects — local people maintain them.",
    "Every $30 can provide one person with clean water for 20 years (varies by project)."
  ],
  maxMeter: 100,
  meterPerDrop: 12,
  penaltyForBad: 10,
  missedPenalty: 6
};

// ---- DOM ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', {alpha: false});
const scoreEl = document.getElementById('score');
const meterFill = document.getElementById('meterFill');
const messageEl = document.getElementById('message');
const factBox = document.getElementById('factBox');
const factText = document.getElementById('factText');
const nextCheckpointEl = document.getElementById('nextCheckpoint');
const restartBtn = document.getElementById('restartBtn');

// ---- State ----
let state = {
  drops: [],         // active falling drops
  score: 0,
  meter: 0,
  lastSpawn: 0,
  spawnInterval: CONFIG.spawnInterval,
  running: true,
  lastTime: 0,
  difficultyStage: 0,
  nextCheckpointIdx: 0,
  missedWater: 0
};

// ---- Helpers ----
function resizeCanvas() {
  // keep device-pixel-ratio crisp
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function showMessage(text, timeout = 1600) {
  messageEl.textContent = text;
  setTimeout(() => {
    // clear only if unchanged
    if (messageEl.textContent === text) messageEl.textContent = '';
  }, timeout);
}

// ---- Entities ----
class Drop {
  constructor(x, type = 'water', speed = 0) {
    this.x = x;
    this.y = -20;
    this.r = CONFIG.dropRadius;
    this.type = type; // 'water' or 'bad'
    this.speed = speed || (CONFIG.baseSpeed + rand(-20, 30));
    this.id = Math.random().toString(36).slice(2,9);
    this.collected = false;
  }

  update(dt) {
    // dt in seconds
    this.y += this.speed * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.type === 'water') {
      drawDrop(ctx, this.r, '#0B3D91', '#6fb3ff');
    } else {
      drawDrop(ctx, this.r, '#6b0b0b', '#ff7a7a', true);
    }
    ctx.restore();
  }
}

// simple drop drawing (stylized)
function drawDrop(ctx, radius=18, color='#0B3D91', fill='#6fb3ff', pollutant=false){
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.6);
  ctx.bezierCurveTo(radius * 0.8, -radius * 0.6, radius * 0.9, radius * 0.1, 0, radius);
  ctx.bezierCurveTo(-radius * 0.9, radius * 0.1, -radius * 0.8, -radius * 0.6, 0, -radius * 0.6);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();

  if (pollutant) {
    // little cross mark to indicate 'bad'
    ctx.beginPath();
    ctx.strokeStyle = '#330000';
    ctx.lineWidth = 2;
    ctx.moveTo(-radius*0.45, -radius*0.05);
    ctx.lineTo(radius*0.45, radius*0.35);
    ctx.moveTo(radius*0.45, -radius*0.05);
    ctx.lineTo(-radius*0.45, radius*0.35);
    ctx.stroke();
  }
}

// ---- Spawning & progression ----
function spawnDrop() {
  const pad = CONFIG.dropRadius + 6;
  const x = rand(pad, canvas.clientWidth - pad);
  const isBad = Math.random() < CONFIG.badChance;
  // difficulty modifies speed
  const speed = CONFIG.baseSpeed * (1 + state.difficultyStage * CONFIG.gravityIncrease) + rand(-10,40);
  const d = new Drop(x, isBad ? 'bad' : 'water', speed);
  state.drops.push(d);
}

function updateDifficulty() {
  // bump visual challenge based on score
  const stage = Math.floor(state.score / 80);
  if (stage !== state.difficultyStage) {
    state.difficultyStage = stage;
    state.spawnInterval = Math.max(300, CONFIG.spawnInterval - stage * 100);
  }
}

// ---- Collisions & interactions ----
function handlePointer(x, y) {
  // check topmost drop first (reverse iterate)
  for (let i = state.drops.length - 1; i >= 0; i--) {
    const d = state.drops[i];
    const dx = x - d.x;
    const dy = y - d.y;
    if (Math.hypot(dx, dy) <= d.r) {
      if (d.type === 'water') {
        collectWater(d);
      } else {
        hitBad(d);
      }
      // remove
      state.drops.splice(i,1);
      return;
    }
  }
  // no hit: small negative feedback
  // showMessage('Missed — try to tap the drops!', 900);
}

function collectWater(drop) {
  state.score += 10;
  state.meter = clamp(state.meter + CONFIG.meterPerDrop, 0, CONFIG.maxMeter);
  showMessage('+10 Water!');
  spawnCollectBurst(drop.x, drop.y, '#0B3D91');
  updateUI();
  checkCheckpoint();
}

function hitBad(drop) {
  state.score = Math.max(0, state.score - CONFIG.penaltyForBad);
  state.meter = Math.max(0, state.meter - Math.floor(CONFIG.meterPerDrop/2));
  showMessage('-' + CONFIG.penaltyForBad + ' Pollutant!');
  spawnCollectBurst(drop.x, drop.y, '#aa1111');
  updateUI();
}

// missed when water reaches bottom
function missWater(drop) {
  state.missedWater++;
  state.score = Math.max(0, state.score - CONFIG.missedPenalty);
  state.meter = Math.max(0, state.meter - Math.floor(CONFIG.meterPerDrop/2));
  showMessage('You missed clean water — collect more!', 1400);
  updateUI();
}

// ---- Visual effects (simple) ----
const bursts = [];
function spawnCollectBurst(x,y,color) {
  bursts.push({x,y,color, t:0, lifetime:650});
}
function drawBursts(ctx, dt) {
  for (let i = bursts.length-1; i >= 0; i--) {
    const b = bursts[i];
    b.t += dt*1000;
    const p = b.t / b.lifetime;
    if (p >= 1) { bursts.splice(i,1); continue; }
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6 + 24 * p, 0, Math.PI*2);
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = 1 - p;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ---- Checkpoints & facts ----
function checkCheckpoint() {
  const idx = state.nextCheckpointIdx;
  if (idx >= CONFIG.checkpointScores.length) return;
  if (state.score >= CONFIG.checkpointScores[idx]) {
    showFact(idx);
    state.nextCheckpointIdx++;
    nextCheckpointEl.textContent = CONFIG.checkpointScores[state.nextCheckpointIdx] ?? '—';
  }
}
function showFact(idx) {
  factText.textContent = CONFIG.facts[idx] ?? 'Learn more about clean water access.';
  factBox.hidden = false;
  // auto hide after 10s
  setTimeout(() => {
    factBox.hidden = true;
  }, 10000);
}

// ---- UI updates ----
function updateUI() {
  scoreEl.textContent = state.score;
  meterFill.style.width = `${(state.meter / CONFIG.maxMeter) * 100}%`;
}

// ---- Main loop ----
function step(ts) {
  if (!state.running) return;
  if (!state.lastTime) state.lastTime = ts;
  const dt = (ts - state.lastTime) / 1000;
  state.lastTime = ts;

  // spawn logic
  state.lastSpawn += dt * 1000;
  if (state.lastSpawn >= state.spawnInterval) {
    spawnDrop();
    state.lastSpawn = 0;
  }

  // update drops
  for (let i = state.drops.length -1; i >= 0; i--) {
    const d = state.drops[i];
    d.update(dt);
    // off bottom?
    if (d.y - d.r > canvas.clientHeight) {
      if (d.type === 'water') {
        missWater(d);
      }
      state.drops.splice(i,1);
    }
  }

  updateDifficulty(); // adjust spawn etc.

  // draw
  render();

  requestAnimationFrame(step);
}

// ---- Render ----
function render() {
  // clear
  ctx.fillStyle = '#e9fbff';
  ctx.fillRect(0,0, canvas.clientWidth, canvas.clientHeight);

  // ground indicator
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, canvas.clientHeight - 10, canvas.clientWidth, 10);

  // draw drops
  for (const d of state.drops) {
    d.draw(ctx);
  }
  // draw bursts
  drawBursts(ctx, 1/60);

  // HUD overlay (tiny floating text)
  // Not necessary to draw score here because HUD DOM manages it.
}

// ---- Input handling ----
function getCanvasMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left),
    y: (clientY - rect.top)
  };
}

canvas.addEventListener('pointerdown', (ev) => {
  const pos = getCanvasMousePos(ev);
  handlePointer(pos.x, pos.y);
  // prevent scrolling on touch
  ev.preventDefault();
});

// restart button
restartBtn.addEventListener('click', resetGame);

// ---- Initialization & reset ----
function resetGame() {
  state.drops = [];
  state.score = 0;
  state.meter = 0;
  state.lastSpawn = 0;
  state.spawnInterval = CONFIG.spawnInterval;
  state.running = true;
  state.lastTime = 0;
  state.difficultyStage = 0;
  state.nextCheckpointIdx = 0;
  state.missedWater = 0;
  nextCheckpointEl.textContent = CONFIG.checkpointScores[0];
  factBox.hidden = true;
  updateUI();
  showMessage('Game restarted — collect water!');
  requestAnimationFrame(step);
}

// Start
nextCheckpointEl.textContent = CONFIG.checkpointScores[0];
resetGame();
