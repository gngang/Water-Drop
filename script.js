/*
  game.js

  Polished prototype:
  - Responsive pixel canvas with internal resolution (keeps pixel look)
  - Two zones (short levels): Quad (zone 1) and Library (zone 2)
  - Player (boy/girl) created as pixel sprite via offscreen canvas (no external assets)
  - Enemies (trash) and puddle obstacles with collision detection
  - Collectible water droplets + score + Water Meter
  - Checkpoint flags: show facts (auto-hide after 40s)
  - Restart and Next Zone flow
  - Comments map to rubric: idea, wireframe labels (in HTML), branding (colors), logic (below)
*/

/* ---------- Configuration ---------- */
const INTERNAL_W = 920;    // internal canvas resolution (keeps pixel aspect)
const INTERNAL_H = 480;
const SCALE_NEAREST = true;
const FACT_DISPLAY_MS = 40000; // 40 seconds

/* ---------- DOM references ---------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', {alpha:false});
const startOverlay = document.getElementById('overlay-start');
const startBtn = document.getElementById('startBtn');
const demoFactBtn = document.getElementById('demoFact');
const pickBoy = document.getElementById('pickBoy');
const pickGirl = document.getElementById('pickGirl');
const factOverlay = document.getElementById('overlay-fact');
const factText = document.getElementById('factText');
const endOverlay = document.getElementById('overlay-end');
const endSummary = document.getElementById('endSummary');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const waterBar = document.getElementById('water-bar');
const scoreLabel = document.getElementById('score');

/* ---------- State ---------- */
let scale = 1;
let activeChar = 'boy';
let keys = {};
let running = false;
let zoneIndex = 0;
let factTimer = null;
let factsSeen = new Set();

/* ---------- Gameplay objects (populated per zone) ---------- */
let player = null;
let platforms = [];
let droplets = [];
let enemies = [];
let flags = [];
let waterCollected = 0;
let score = 0;
const DROPLET_VALUE = 10;
const DROPLETS_TO_FILL = 8 * DROPLET_VALUE; // defines zone completion threshold

/* ---------- Facts (80% facts, 20% motivational) ---------- */
const FACTS = [
  {text: "771 million people lack access to clean water. (1 in 10)", type:'fact'},
  {text: "Every $1 invested in clean water returns ~$4 in increased productivity.", type:'fact'},
  {text: "Clean water reduces disease and improves education outcomes.", type:'fact'},
  {text: "Keep going — every drop you collect makes a difference!", type:'motivation'},
  {text: "Access to clean water supports health and opportunity.", type:'fact'}
];

/* ---------- Levels (two short zones) ---------- */
const LEVELS = [
  {
    id:'zone-quad',
    name:'The Quad (Tutorial)',
    platforms: [
      {x:0,y:420,w:920,h:60},
      {x:140,y:340,w:160,h:14},
      {x:360,y:300,w:160,h:14},
      {x:620,y:260,w:160,h:14}
    ],
    droplets: [{x:180,y:300},{x:400,y:260},{x:660,y:220},{x:90,y:380},{x:240,y:380},{x:520,y:360},{x:780,y:380},{x:430,y:360}],
    enemies: [{x:460,y:388,w:28,h:28,type:'plastic'}],
    flags: [{x:860,y:200,w:28,h:60}],
    hint:"Tutorial: collect droplets to fill the meter."
  },
  {
    id:'zone-library',
    name:'Library Zone',
    platforms: [
      {x:0,y:420,w:920,h:60},
      {x:200,y:330,w:120,h:14},
      {x:360,y:290,w:120,h:14},
      {x:520,y:250,w:120,h:14},
      {x:720,y:320,w:120,h:14}
    ],
    droplets: [{x:220,y:290},{x:380,y:250},{x:540,y:210},{x:760,y:290},{x:120,y:380},{x:480,y:350}],
    enemies: [{x:300,y:388,w:28,h:28,type:'paper'},{x:660,y:388,w:28,h:28,type:'plastic'}],
    flags: [{x:860,y:180,w:28,h:60}],
    hint:"More drops and pollution — careful timing."
  }
];

/* ---------- Pixel Sprites: created via offscreen canvas ----------- */
/* This avoids external assets while still producing nice pixel sprites.
   We make small scale sprites (16x24 or similar) and draw scaled to screen. */
const SPRITES = {};

function makePlayerSprite(palette){
  const w=16,h=24;
  const oc = document.createElement('canvas');
  oc.width=w; oc.height=h;
  const octx = oc.getContext('2d');
  // clean pixel body
  // skin head
  octx.fillStyle = palette.skin; octx.fillRect(5,1,6,6);
  // hair
  octx.fillStyle = palette.hair; octx.fillRect(4,1,8,3);
  // torso
  octx.fillStyle = palette.cloth; octx.fillRect(3,8,10,10);
  // backpack
  octx.fillStyle = '#222'; octx.fillRect(0,9,3,10);
  // legs
  octx.fillStyle = '#222'; octx.fillRect(4,18,3,5); octx.fillRect(9,18,3,5);
  return oc;
}
function makeEnemySprite(color){
  const w=12,h=12; const oc=document.createElement('canvas'); oc.width=w; oc.height=h;
  const octx=oc.getContext('2d'); octx.fillStyle=color; octx.fillRect(0,0,w,h);
  octx.fillStyle='#fff'; octx.fillRect(3,3,6,6);
  return oc;
}
function makeDropletSprite(){
  const w=8,h=12; const oc=document.createElement('canvas'); oc.width=w; oc.height=h; const octx=oc.getContext('2d');
  octx.fillStyle='#3ad0ff'; octx.beginPath(); octx.ellipse(4,6,3,5,0,0,Math.PI*2); octx.fill();
  octx.fillStyle='#aef2ff'; octx.fillRect(3,2,2,2);
  return oc;
}
function makeFlagSprite(){
  const w=12,h=18; const oc=document.createElement('canvas'); oc.width=w; oc.height=h; const octx=oc.getContext('2d');
  octx.fillStyle='#6b6b6b'; octx.fillRect(0,0,4,h); octx.fillStyle='#f1c40f'; octx.fillRect(4,3,8,6);
  return oc;
}

/* ---------------- Setup canvas & responsive scaling --------------- */
function resizeCanvas(){
  // set canvas drawing buffer
  canvas.width = INTERNAL_W;
  canvas.height = INTERNAL_H;
  // CSS size adjusts via CSS; we keep internal resolution constant to preserve pixel art
  // Compute scale for pointer calculations (if needed)
  const rect = canvas.getBoundingClientRect();
  scale = rect.width / INTERNAL_W;
  // ensure pixelated
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);

/* ---------- Player helper ---------- */
function spawnPlayer(){
  player = { x:40, y:360, w:22, h:34, vx:0, vy:0, speed:2.4, jumpPower:14, onGround:false, lives:3 };
}

/* ---------- Level loader ---------- */
function loadZone(index){
  const lvl = LEVELS[index];
  platforms = JSON.parse(JSON.stringify(lvl.platforms));
  droplets = JSON.parse(JSON.stringify(lvl.droplets)).map(d=>({x:d.x,y:d.y,col:false}));
  enemies = JSON.parse(JSON.stringify(lvl.enemies)).map(e=>({...e,hit:false}));
  flags = JSON.parse(JSON.stringify(lvl.flags)).map(f=>({...f,triggered:false}));
  waterCollected = 0; score = 0; factsSeen.clear();
  updateUI();
}

/* ---------- UI updates ---------- */
function updateUI(){
  scoreLabel.innerText = `Score: ${score}`;
  const pct = Math.min(100, Math.round((waterCollected / DROPLETS_TO_FILL) * 100));
  waterBar.style.width = pct + '%';
}

/* ---------- Input ---------- */
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

/* ---------- Fact popup ---------- */
function showFact(text){
  factText.innerText = text;
  factOverlay.style.display = 'flex';
  if (factTimer) clearTimeout(factTimer);
  factTimer = setTimeout(()=>{ hideFact(); }, FACT_DISPLAY_MS);
}
function hideFact(){ if (factTimer) clearTimeout(factTimer); factTimer=null; factOverlay.style.display='none'; }

/* ---------- Collision helpers ---------- */
function aabb(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ---------- Game logic update ---------- */
let lastTime=0;
function update(dt){
  // Input
  const left = keys['arrowleft'] || keys['a'];
  const right = keys['arrowright'] || keys['d'];
  const jump = keys[' '] || keys['arrowup'] || keys['w'];

  if (left) player.vx = -player.speed;
  else if (right) player.vx = player.speed;
  else player.vx = 0;

  if (jump && player.onGround){
    player.vy = -player.jumpPower; player.onGround=false;
  }

  // physics
  player.vy += 0.9; // gravity
  player.x += player.vx;
  player.y += player.vy;

  // world bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > INTERNAL_W) player.x = INTERNAL_W - player.w;
  if (player.y > INTERNAL_H){ // fall off
    player.y = INTERNAL_H - player.h - 60;
    player.vy = 0; player.lives--; if (player.lives <= 0) endZone(false);
  }

  // platform collision
  player.onGround = false;
  for (let p of platforms){
    const plat = {x:p.x,y:p.y,w:p.w,h:p.h};
    if (player.vy >= 0 && player.x + player.w > plat.x && player.x < plat.x + plat.w){
      const foot = player.y + player.h;
      if (foot > plat.y && player.y < plat.y + plat.h){
        player.y = plat.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  // droplets collection
  for (let d of droplets){
    if (d.col) continue;
    const droRect = {x:d.x-6,y:d.y-10,w:12,h:14};
    if (aabb(player,droRect)){
      d.col = true; score += DROPLET_VALUE; waterCollected += DROPLET_VALUE; updateUI();
      // bounce feedback
      player.vy = -6;
    }
  }

  // enemy collision (static for prototype)
  for (let e of enemies){
    const er = {x:e.x,y:e.y,w:e.w,h:e.h};
    if (!e.hit && aabb(player,er)){
      e.hit = true;
      score = Math.max(0, score - 20);
      player.vy = -8;
      player.x = Math.max(0, player.x - 28);
      updateUI();
    }
  }

  // flags / checkpoint
  for (let f of flags){
    const fr = {x:f.x,y:f.y,w:f.w,h:f.h};
    if (!f.triggered && aabb(player,fr)){
      f.triggered = true;
      // pick next unseen fact (prefer 'fact' types)
      let candidate = FACTS.find(x => !factsSeen.has(x.text) && x.type === 'fact') 
                      || FACTS.find(x => !factsSeen.has(x.text))
                      || FACTS[Math.floor(Math.random()*FACTS.length)];
      factsSeen.add(candidate.text);
      showFact(candidate.text);
    }
  }

  // zone complete?
  if (waterCollected >= DROPLETS_TO_FILL){
    endZone(true);
  }
}

/* ---------- Render ---------- */
function render(){
  // clear
  ctx.fillStyle = '#dff7ff';
  ctx.fillRect(0,0,INTERNAL_W,INTERNAL_H);

  // background buildings (simple blocks to read as campus zones)
  ctx.fillStyle = '#6aa9c8';
  ctx.fillRect(40,100,160,140);
  ctx.fillRect(260,80,160,180);
  ctx.fillRect(520,120,180,120);
  ctx.fillRect(760,90,120,190);

  // decorative trees / banners
  ctx.fillStyle = '#2c8b3a'; ctx.fillRect(100,168,8,28); ctx.fillRect(160,160,10,34);

  // draw platforms
  for (let p of platforms){
    ctx.fillStyle = '#6b8b5a'; ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.fillStyle = '#8cc07a'; ctx.fillRect(p.x,p.y,Math.min(6,p.w),4);
  }

  // draw puddles (visual obstacles)
  ctx.fillStyle = '#333'; ctx.fillRect(260,420,80,7); ctx.fillStyle='#555'; ctx.fillRect(260,427,80,3);

  // draw droplets
  for (let d of droplets){
    if (d.col) continue;
    ctx.drawImage(SPRITES.droplet, d.x - 6, d.y - 10);
  }

  // draw enemies
  for (let e of enemies){
    ctx.drawImage(SPRITES.enemy, e.x, e.y);
    // if hit, draw overlay
    if (e.hit){
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(e.x, e.y, e.w, e.h);
    }
  }

  // flags
  for (let f of flags){
    ctx.drawImage(SPRITES.flag, f.x, f.y - f.h + 12);
    if (f.triggered){
      // small sparkle
      ctx.fillStyle = '#20c97a';
      ctx.fillRect(f.x+6, f.y-6, 6, 6);
    }
  }

  // draw player sprite (scaled)
  const pal = (activeChar === 'boy') ? {skin:'#f0d6c8',hair:'#1b1b1b',cloth:'#1b9bd7'} : {skin:'#f0d6c8',hair:'#8b1b7b',cloth:'#e07aa7'};
  const sprite = makePlayerSpriteIfNeeded(pal); // returns SPRITES.player_boy/girl
  ctx.drawImage(sprite, Math.round(player.x), Math.round(player.y), player.w, player.h);
}

/* ---------- Game loop ---------- */
function loop(ts){
  if (!running) return;
  const dt = ts - lastTime; lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

/* ---------- End zone ---------- */
function endZone(success){
  running = false;
  endOverlay.style.display = 'flex';
  const pct = Math.min(100, Math.round((waterCollected / DROPLETS_TO_FILL) * 100));
  if (success){
    document.getElementById('endTitle').innerText = `${LEVELS[zoneIndex].name} Complete`;
    endSummary.innerText = `Water collected: ${pct}% • Facts discovered: ${factsSeen.size}`;
  } else {
    document.getElementById('endTitle').innerText = `You failed`;
    endSummary.innerText = `Try again. Facts discovered: ${factsSeen.size}`;
  }
}

/* ---------- Start/Restart handlers ---------- */
startBtn.addEventListener('click', () => {
  zoneIndex = 0; startZone(zoneIndex);
});
demoFactBtn.addEventListener('click', ()=>{ showFact("Demo: Facts are automatic at flags and fade after 40 seconds."); setTimeout(hideFact,3000); });
pickBoy.addEventListener('click', ()=>{ activeChar='boy'; pickBoy.classList.add('selected'); pickGirl.classList.remove('selected'); });
pickGirl.addEventListener('click', ()=>{ activeChar='girl'; pickGirl.classList.add('selected'); pickBoy.classList.remove('selected'); });
nextBtn.addEventListener('click', ()=>{
  zoneIndex++;
  if (zoneIndex >= LEVELS.length) {
    // final success screen; show CTA to charity site
    alert('All zones complete — you restored campus water! Visit charity: water to learn more.');
    // restart fresh
    zoneIndex = 0;
  }
  startZone(zoneIndex);
});
restartBtn.addEventListener('click', ()=>{ zoneIndex = 0; startZone(zoneIndex); });

/* ---------- Start zone loader ---------- */
function startZone(index){
  hideFact();
  endOverlay.style.display = 'none';
  startOverlay.style.display = 'none';
  loadZone(index);
  spawnPlayer();
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

/* ---------- Initialize sprites (only once) ---------- */
function initSprites(){
  // player sprites cached per palette
  SPRITES.player_boy = makePlayerSprite({skin:'#f0d6c8',hair:'#1b1b1b',cloth:'#1b9bd7'});
  SPRITES.player_girl = makePlayerSprite({skin:'#f0d6c8',hair:'#8b1b7b',cloth:'#e07aa7'});
  SPRITES.enemy = makeEnemySprite('#6b4a3a'); // trash colored
  SPRITES.droplet = makeDropletSprite();
  SPRITES.flag = makeFlagSprite();
}

/* helper that returns the correct player sprite canvas */
function makePlayerSpriteIfNeeded(pal){
  return (activeChar === 'boy') ? SPRITES.player_boy : SPRITES.player_girl;
}

/* ---------- Sprite factory functions (small offscreen canvases) ---------- */
function makePlayerSprite(pal){
  const w=16,h=24;
  const oc=document.createElement('canvas'); oc.width=w; oc.height=h;
  const o=oc.getContext('2d');
  o.imageSmoothingEnabled=false;
  // hair
  o.fillStyle = pal.hair; o.fillRect(3,0,10,5);
  // head
  o.fillStyle = pal.skin; o.fillRect(5,5,6,6);
  // eyes
  o.fillStyle = '#000'; o.fillRect(7,7,1,1); o.fillRect(9,7,1,1);
  // torso
  o.fillStyle = pal.cloth; o.fillRect(3,11,10,8);
  // backpack
  o.fillStyle = '#222'; o.fillRect(0,12,3,7);
  // legs
  o.fillStyle = '#222'; o.fillRect(4,19,3,4); o.fillRect(9,19,3,4);
  return oc;
}
function makeEnemySprite(color){
  const w=20,h=20; const oc=document.createElement('canvas'); oc.width=w; oc.height=h; const o=oc.getContext('2d');
  o.fillStyle=color; o.fillRect(0,0,w,h);
  o.fillStyle='#fff'; o.fillRect(5,5,10,10);
  return oc;
}
function makeDropletSprite(){
  const w=12,h=16; const oc=document.createElement('canvas'); oc.width=w; oc.height=h; const o=oc.getContext('2d');
  o.fillStyle='#3ad0ff'; o.beginPath(); o.ellipse(6,8,4,6,0,0,Math.PI*2); o.fill();
  o.fillStyle='#aef2ff'; o.fillRect(5,4,2,2);
  return oc;
}
function makeFlagSprite(){
  const w=20,h=36; const oc=document.createElement('canvas'); oc.width=w; oc.height=h; const o=oc.getContext('2d');
  o.fillStyle='#333'; o.fillRect(0,0,6,h);
  o.fillStyle='#f1c40f'; o.fillRect(6,6,12,10);
  return oc;
}

/* ---------- Initial setup ---------- */
function init(){
  // canvases & sprites
  resizeCanvas();
  initSprites();
  // load first zone (not started until user hits Start)
  loadZone(0);
  spawnPlayer();
  render(); // initial visual
  updateUI();

  // Show start overlay (already visible)
}
function resizeCanvas(){
  // set internal resolution
  canvas.width = INTERNAL_W; canvas.height = INTERNAL_H;
  // CSS size handled by CSS rules; compute scale if needed:
  const rect = canvas.getBoundingClientRect();
  // ensure crisp pixels
  ctx.imageSmoothingEnabled = false;
}

/* ---------- Start the UI ---------- */
init();

/* ---------- Expose small debug keys (optional) ---------- */
window.addEventListener('keydown', (e)=>{
  if (e.key === 'p'){ waterCollected = DROPLETS_TO_FILL; updateUI(); } // skip
  if (e.key === 'f'){ showFact("Debug fact: auto-hide after 40s"); setTimeout(hideFact,3000); }
});
