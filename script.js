// WATER FLOW: CAMPUS QUEST

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = { x: 50, y: 300, width: 30, height: 40, dy: 0, grounded: false, character: "boy" };
let gravity = 0.8;
let keys = {};

let waterDrops = [{ x: 300, y: 320 }, { x: 600, y: 320 }];
let pollution = [{ x: 200, y: 340 }, { x: 500, y: 340 }];
let checkpoint = { x: 750, y: 320 };
let score = 0;
let factIndex = 0;

const facts = [
  "Every $40 donation to charity: water helps one person gain access to clean water.",
  "663 million people worldwide lack access to clean water.",
  "charity: water ensures 100% of donations fund water projects.",
  "Access to clean water improves education and health outcomes."
];

// Draw game elements
function drawPlayer() {
  ctx.fillStyle = player.character === "boy" ? "#0077C8" : "#FF69B4";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPollution() {
  ctx.fillStyle = "gray";
  pollution.forEach(p => ctx.fillRect(p.x, p.y, 20, 20));
}

function drawWater() {
  ctx.fillStyle = "#00BFFF";
  waterDrops.forEach(w => ctx.fillRect(w.x, w.y, 10, 15));
}

function drawCheckpoint() {
  ctx.fillStyle = "#FFD200";
  ctx.fillRect(checkpoint.x, checkpoint.y - 30, 10, 30);
}

function showFact() {
  const box = document.getElementById("fact-box");
  if (factIndex < facts.length) {
    box.textContent = facts[factIndex];
    box.classList.remove("hidden");
    setTimeout(() => box.classList.add("hidden"), 40000);
    factIndex++;
  }
}

// Update loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Movement
  if (keys["ArrowLeft"] || keys["a"]) player.x -= 3;
  if (keys["ArrowRight"] || keys["d"]) player.x += 3;

  // Gravity + jump
  player.y += player.dy;
  if (!player.grounded) player.dy += gravity;

  if (player.y > 300) {
    player.y = 300;
    player.dy = 0;
    player.grounded = true;
  }

  drawPlayer();
  drawPollution();
  drawWater();
  drawCheckpoint();

  // Collision with water drops
  waterDrops = waterDrops.filter(w => {
    if (Math.abs(player.x - w.x) < 20 && Math.abs(player.y - w.y) < 20) {
      score++;
      return false;
    }
    return true;
  });

  // Collision with pollution
  pollution.forEach(p => {
    if (Math.abs(player.x - p.x) < 25 && Math.abs(player.y - p.y) < 25) {
      alert("You hit pollution! Try again.");
      document.location.reload();
    }
  });

  // Reaching checkpoint
  if (player.x >= checkpoint.x - 10) {
    showFact();
    player.x = 50;
  }

  requestAnimationFrame(update);
}

// Controls
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if ((e.key === " " || e.key === "ArrowUp" || e.key === "w") && player.grounded) {
    player.dy = -12;
    player.grounded = false;
  }
});
document.addEventListener("keyup", e => delete keys[e.key]);

// Character select
document.querySelectorAll(".char-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    player.character = btn.dataset.char;
    document.getElementById("character-select").style.display = "none";
    update();
  });
});
