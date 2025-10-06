// ==========================================
// GAME LOGIC - Campus Water Quest
// charity: water Mission Game
// ==========================================

// ===== GAME CONFIGURATION =====
const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 450,
    GRAVITY: 0.8,
    PLAYER_SPEED: 5,
    PLAYER_JUMP: -15,
    DROPLET_VALUE: 10,
    DROPLETS_PER_ZONE: 8,
    FACT_DURATION: 40000, // 40 seconds
    COLLISION_PADDING: 5
};

// ===== CHARITY: WATER FACTS =====
const WATER_FACTS = [
    "771 million people worldwide lack access to clean water - that's 1 in 10 people.",
    "Women and children spend 200 million hours every day collecting water.",
    "Clean water can reduce waterborne diseases by up to 80%.",
    "Every $1 invested in clean water returns about $4 in productivity.",
    "You're making a difference! Clean water transforms entire communities.",
    "Access to clean water increases school attendance, especially for girls.",
    "Clean water projects create jobs and boost local economies.",
    "Keep going! Your efforts help bring hope to families in need.",
    "785 million people still drink water from unsafe sources.",
    "Clean water is a foundation for health, education, and opportunity."
];

// ===== LEVEL DATA =====
const LEVELS = [
    {
        name: "The Campus Quad",
        platforms: [
            { x: 0, y: 400, w: 800, h: 50 }, // ground
            { x: 150, y: 320, w: 120, h: 20 },
            { x: 350, y: 250, w: 150, h: 20 },
            { x: 550, y: 180, w: 100, h: 20 }
        ],
        droplets: [
            { x: 100, y: 350 },
            { x: 200, y: 270 },
            { x: 420, y: 200 },
            { x: 600, y: 130 },
            { x: 300, y: 350 },
            { x: 500, y: 350 },
            { x: 650, y: 280 },
            { x: 250, y: 200 }
        ],
        enemies: [
            { x: 450, y: 380, w: 30, h: 30, type: 'trash' },
            { x: 280, y: 300, w: 30, h: 30, type: 'pollution' }
        ],
        checkpoints: [
            { x: 700, y: 340, w: 40, h: 60 }
        ]
    },
    {
        name: "The Library Zone",
        platforms: [
            { x: 0, y: 400, w: 800, h: 50 },
            { x: 100, y: 320, w: 100, h: 20 },
            { x: 250, y: 260, w: 120, h: 20 },
            { x: 420, y: 200, w: 100, h: 20 },
            { x: 580, y: 140, w: 120, h: 20 }
        ],
        droplets: [
            { x: 140, y: 270 },
            { x: 300, y: 210 },
            { x: 460, y: 150 },
            { x: 640, y: 90 },
            { x: 200, y: 350 },
            { x: 400, y: 350 },
            { x: 550, y: 280 },
            { x: 680, y: 200 }
        ],
        enemies: [
            { x: 350, y: 380, w: 30, h: 30, type: 'trash' },
            { x: 500, y: 380, w: 30, h: 30, type: 'pollution' },
            { x: 200, y: 300, w: 30, h: 30, type: 'trash' }
        ],
        checkpoints: [
            { x: 720, y: 340, w: 40, h: 60 }
        ]
    },
    {
        name: "Student Center Plaza",
        platforms: [
            { x: 0, y: 400, w: 800, h: 50 },
            { x: 120, y: 330, w: 90, h: 20 },
            { x: 280, y: 270, w: 110, h: 20 },
            { x: 450, y: 210, w: 100, h: 20 },
            { x: 620, y: 150, w: 90, h: 20 }
        ],
        droplets: [
            { x: 160, y: 280 },
            { x: 330, y: 220 },
            { x: 490, y: 160 },
            { x: 660, y: 100 },
            { x: 80, y: 350 },
            { x: 380, y: 350 },
            { x: 580, y: 290 },
            { x: 700, y: 220 }
        ],
        enemies: [
            { x: 250, y: 380, w: 30, h: 30, type: 'pollution' },
            { x: 420, y: 380, w: 30, h: 30, type: 'trash' },
            { x: 580, y: 380, w: 30, h: 30, type: 'pollution' },
            { x: 350, y: 250, w: 30, h: 30, type: 'trash' }
        ],
        checkpoints: [
            { x: 730, y: 340, w: 40, h: 60 }
        ]
    }
];

// ===== GAME STATE =====
let gameState = {
    currentScreen: 'title',
    currentLevel: 0,
    score: 0,
    waterCollected: 0,
    factsLearned: new Set(),
    selectedCharacter: 'boy',
    keys: {},
    mobileControls: {
        left: false,
        right: false,
        jump: false
    }
};

// ===== PLAYER STATE =====
let player = {
    x: 50,
    y: 300,
    w: 30,
    h: 40,
    vx: 0,
    vy: 0,
    onGround: false,
    canJump: true
};

// ===== GAME OBJECTS =====
let droplets = [];
let enemies = [];
let checkpoints = [];
let platforms = [];

// ===== DOM ELEMENTS =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Screens
const titleScreen = document.getElementById('titleScreen');
const gameScreen = document.getElementById('gameScreen');
const victoryScreen = document.getElementById('victoryScreen');
const factPopup = document.getElementById('factPopup');

// Buttons
const startGameBtn = document.getElementById('startGameBtn');
const nextZoneBtn = document.getElementById('nextZoneBtn');
const restartBtn = document.getElementById('restartBtn');
const charBtns = document.querySelectorAll('.char-btn');

// HUD Elements
const zoneName = document.getElementById('zoneName');
const scoreValue = document.getElementById('scoreValue');
const waterFill = document.getElementById('waterFill');
const waterPercent = document.getElementById('waterPercent');

// Fact Elements
const factText = document.getElementById('factText');
const factTimerBar = document.getElementById('factTimerBar');
const factCountdown = document.getElementById('factCountdown');

// Mobile Controls
const mobileLeft = document.getElementById('mobileLeft');
const mobileJump = document.getElementById('mobileJump');
const mobileRight = document.getElementById('mobileRight');

// ===== CANVAS SETUP =====
function setupCanvas() {
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    ctx.imageSmoothingEnabled = false;
}

// ===== INITIALIZATION =====
function init() {
    setupCanvas();
    setupEventListeners();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Character selection
    charBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            charBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.selectedCharacter = btn.dataset.char;
        });
    });

    // Start game
    startGameBtn.addEventListener('click', startGame);
    
    // Victory screen buttons
    nextZoneBtn.addEventListener('click', nextLevel);
    restartBtn.addEventListener('click', restartGame);

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.key.toLowerCase()] = true;
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
    });

    // Mobile controls
    mobileLeft.addEventListener('touchstart', () => gameState.mobileControls.left = true);
    mobileLeft.addEventListener('touchend', () => gameState.mobileControls.left = false);
    mobileLeft.addEventListener('mousedown', () => gameState.mobileControls.left = true);
    mobileLeft.addEventListener('mouseup', () => gameState.mobileControls.left = false);

    mobileRight.addEventListener('touchstart', () => gameState.mobileControls.right = true);
    mobileRight.addEventListener('touchend', () => gameState.mobileControls.right = false);
    mobileRight.addEventListener('mousedown', () => gameState.mobileControls.right = true);
    mobileRight.addEventListener('mouseup', () => gameState.mobileControls.right = false);

    mobileJump.addEventListener('touchstart', () => gameState.mobileControls.jump = true);
    mobileJump.addEventListener('touchend', () => gameState.mobileControls.jump = false);
    mobileJump.addEventListener('mousedown', () => gameState.mobileControls.jump = true);
    mobileJump.addEventListener('mouseup', () => gameState.mobileControls.jump = false);
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenName) {
    titleScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    victoryScreen.classList.remove('active');

    switch(screenName) {
        case 'title':
            titleScreen.classList.add('active');
            break;
        case 'game':
            gameScreen.classList.add('active');
            break;
        case 'victory':
            victoryScreen.classList.add('active');
            break;
    }
    
    gameState.currentScreen = screenName;
}

// ===== GAME START =====
function startGame() {
    gameState.currentLevel = 0;
    gameState.score = 0;
    gameState.waterCollected = 0;
    gameState.factsLearned.clear();
    loadLevel(0);
    showScreen('game');
    gameLoop();
}

// ===== LEVEL LOADING =====
function loadLevel(levelIndex) {
    const level = LEVELS[levelIndex];
    
    // Update HUD
    zoneName.textContent = level.name;
    
    // Reset player
    player.x = 50;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    
    // Load level data
    platforms = JSON.parse(JSON.stringify(level.platforms));
    
    droplets = level.droplets.map(d => ({
        x: d.x,
        y: d.y,
        collected: false
    }));
    
    enemies = level.enemies.map(e => ({
        x: e.x,
        y: e.y,
        w: e.w,
        h: e.h,
        type: e.type,
        hit: false
    }));
    
    checkpoints = level.checkpoints.map(c => ({
        x: c.x,
        y: c.y,
        w: c.w,
        h: c.h,
        triggered: false
    }));
    
    // Reset water collection for this zone
    gameState.waterCollected = 0;
    updateHUD();
}

// ===== GAME LOOP =====
let animationId;
function gameLoop() {
    if (gameState.currentScreen !== 'game') {
        cancelAnimationFrame(animationId);
        return;
    }
    
    update();
    render();
    
    animationId = requestAnimationFrame(gameLoop);
}

// ===== UPDATE =====
function update() {
    // Input handling
    const moveLeft = gameState.keys['arrowleft'] || gameState.keys['a'] || gameState.mobileControls.left;
    const moveRight = gameState.keys['arrowright'] || gameState.keys['d'] || gameState.mobileControls.right;
    const jump = gameState.keys[' '] || gameState.keys['arrowup'] || gameState.keys['w'] || gameState.mobileControls.jump;
    
    // Horizontal movement
    if (moveLeft) {
        player.vx = -GAME_CONFIG.PLAYER_SPEED;
    } else if (moveRight) {
        player.vx = GAME_CONFIG.PLAYER_SPEED;
    } else {
        player.vx = 0;
    }
    
    // Jump
    if (jump && player.onGround && player.canJump) {
        player.vy = GAME_CONFIG.PLAYER_JUMP;
        player.onGround = false;
        player.canJump = false;
    }
    
    if (!jump) {
        player.canJump = true;
    }
    
    // Apply gravity
    player.vy += GAME_CONFIG.GRAVITY;
    
    // Update position
    player.x += player.vx;
    player.y += player.vy;
    
    // World boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > GAME_CONFIG.CANVAS_WIDTH) {
        player.x = GAME_CONFIG.CANVAS_WIDTH - player.w;
    }
    
    // Platform collisions
    player.onGround = false;
    
    for (let platform of platforms) {
        if (checkCollision(player, platform)) {
            // Landing on top
            if (player.vy > 0 && player.y + player.h - player.vy < platform.y + GAME_CONFIG.COLLISION_PADDING) {
                player.y = platform.y - player.h;
                player.vy = 0;
                player.onGround = true;
            }
        }
    }
    
    // Fall off screen
    if (player.y > GAME_CONFIG.CANVAS_HEIGHT) {
        player.x = 50;
        player.y = 300;
        player.vy = 0;
    }
    
    // Droplet collection
    for (let droplet of droplets) {
        if (!droplet.collected) {
            const dropletHitbox = {
                x: droplet.x - 10,
                y: droplet.y - 10,
                w: 20,
                h: 20
            };
            
            if (checkCollision(player, dropletHitbox)) {
                droplet.collected = true;
                gameState.score += GAME_CONFIG.DROPLET_VALUE;
                gameState.waterCollected++;
                updateHUD();
                
                // Bounce effect
                player.vy = -8;
            }
        }
    }
    
    // Enemy collision
    for (let enemy of enemies) {
        if (!enemy.hit && checkCollision(player, enemy)) {
            enemy.hit = true;
            gameState.score = Math.max(0, gameState.score - 20);
            updateHUD();
            
            // Knockback
            player.vy = -10;
            player.x -= 40;
        }
    }
    
    // Checkpoint collision
    for (let checkpoint of checkpoints) {
        if (!checkpoint.triggered && checkCollision(player, checkpoint)) {
            checkpoint.triggered = true;
            showRandomFact();
            
            // Check if level complete
            if (gameState.waterCollected >= GAME_CONFIG.DROPLETS_PER_ZONE) {
                setTimeout(() => {
                    showVictoryScreen();
                }, 1000);
            }
        }
    }
}

// ===== COLLISION DETECTION =====
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.h > rect2.y;
}

// ===== RENDER =====
function render() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    
    // Draw background elements (campus buildings)
    drawBackground();
    
    // Draw platforms
    for (let platform of platforms) {
        ctx.fillStyle = '#7CB342';
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        
        // Grass highlight
        ctx.fillStyle = '#9CCC65';
        ctx.fillRect(platform.x, platform.y, platform.w, 5);
    }
    
    // Draw droplets
    for (let droplet of droplets) {
        if (!droplet.collected) {
            drawDroplet(droplet.x, droplet.y);
        }
    }
    
    // Draw enemies
    for (let enemy of enemies) {
        drawEnemy(enemy);
    }
    
    // Draw checkpoints
    for (let checkpoint of checkpoints) {
        drawCheckpoint(checkpoint);
    }
    
    // Draw player
    drawPlayer(player.x, player.y, gameState.selectedCharacter);
}

// ===== DRAW FUNCTIONS =====
function drawBackground() {
    // Simple campus buildings
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(100, 50, 120, 150);
    ctx.fillRect(400, 80, 150, 120);
    ctx.fillRect(650, 60, 100, 140);
    
    // Windows
    ctx.fillStyle = '#FFE082';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            ctx.fillRect(110 + i * 35, 70 + j * 35, 20, 25);
        }
    }
}

function drawPlayer(x, y, character) {
    // Body
    if (character === 'boy') {
        ctx.fillStyle = '#1E88E5';
    } else {
        ctx.fillStyle = '#E91E63';
    }
    ctx.fillRect(x + 8, y + 12, 14, 20);
    
    // Head
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(x + 10, y + 4, 10, 10);
    
    // Hair
    if (character === 'boy') {
        ctx.fillStyle = '#3E2723';
    } else {
        ctx.fillStyle = '#6D4C41';
    }
    ctx.fillRect(x + 9, y + 2, 12, 5);
    
    // Legs
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(x + 10, y + 32, 4, 8);
    ctx.fillRect(x + 16, y + 32, 4, 8);
    
    // Arms
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(x + 6, y + 14, 3, 10);
    ctx.fillRect(x + 21, y + 14, 3, 10);
}

function drawDroplet(x, y) {
    // Water droplet shape
    ctx.fillStyle = '#4DB8E8';
    ctx.beginPath();
    ctx.arc(x, y + 5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x - 5, y + 3);
    ctx.lineTo(x + 5, y + 3);
    ctx.closePath();
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = '#B3E5FC';
    ctx.beginPath();
    ctx.arc(x - 2, y + 2, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawEnemy(enemy) {
    if (enemy.type === 'trash') {
        ctx.fillStyle = '#795548';
    } else {
        ctx.fillStyle = '#E74C3C';
    }
    
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    
    // X mark if hit
    if (enemy.hit) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(enemy.x + 5, enemy.y + 5);
        ctx.lineTo(enemy.x + enemy.w - 5, enemy.y + enemy.h - 5);
        ctx.moveTo(enemy.x + enemy.w - 5, enemy.y + 5);
        ctx.lineTo(enemy.x + 5, enemy.y + enemy.h - 5);
        ctx.stroke();
    }
}

function drawCheckpoint(checkpoint) {
    // Flag pole
    ctx.fillStyle = '#424242';
    ctx.fillRect(checkpoint.x + 5, checkpoint.y, 5, checkpoint.h);
    
    // Flag
    ctx.fillStyle = checkpoint.triggered ? '#4CAF50' : '#FFD700';
    ctx.beginPath();
    ctx.moveTo(checkpoint.x + 10, checkpoint.y + 10);
    ctx.lineTo(checkpoint.x + 35, checkpoint.y + 20);
    ctx.lineTo(checkpoint.x + 10, checkpoint.y + 30);
    ctx.closePath();
    ctx.fill();
    
    // Checkmark if triggered
    if (checkpoint.triggered) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(checkpoint.x + 15, checkpoint.y + 20);
        ctx.lineTo(checkpoint.x + 20, checkpoint.y + 25);
        ctx.lineTo(checkpoint.x + 28, checkpoint.y + 15);
        ctx.stroke();
    }
}

// ===== HUD UPDATE =====
function updateHUD() {
    scoreValue.textContent = gameState.score;
    
    const totalDroplets = GAME_CONFIG.DROPLETS_PER_ZONE;
    const percentage = Math.min(100, Math.round((gameState.waterCollected / totalDroplets) * 100));
    
    waterFill.style.width = percentage + '%';
    waterPercent.textContent = percentage + '%';
}

// ===== FACT POPUP =====
let factTimer;
let factCountdownInterval;

function showRandomFact() {
    // Select a fact that hasn't been shown yet, or random if all shown
    let availableFacts = WATER_FACTS.filter(f => !gameState.factsLearned.has(f));
    
    if (availableFacts.length === 0) {
        availableFacts = WATER_FACTS;
    }
    
    const randomFact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
    gameState.factsLearned.add(randomFact);
    
    factText.textContent = randomFact;
    factPopup.classList.add('active');
    
    // Reset timer bar animation
    factTimerBar.style.animation = 'none';
    setTimeout(() => {
        factTimerBar.style.animation = 'shrinkTimer 40s linear';
    }, 10);
    
    // Countdown
    let secondsLeft = 40;
    factCountdown.textContent = secondsLeft;
    
    clearInterval(factCountdownInterval);
    factCountdownInterval = setInterval(() => {
        secondsLeft--;
        factCountdown.textContent = secondsLeft;
        if (secondsLeft <= 0) {
            clearInterval(factCountdownInterval);
        }
    }, 1000);
    
    // Auto-hide after 40 seconds
    clearTimeout(factTimer);
    factTimer = setTimeout(() => {
        hideFact();
    }, GAME_CONFIG.FACT_DURATION);
}

function hideFact() {
    factPopup.classList.remove('active');
    clearTimeout(factTimer);
    clearInterval(factCountdownInterval);
}

// ===== VICTORY SCREEN =====
function showVictoryScreen() {
    showScreen('victory');
    
    // Update stats
    const totalDroplets = GAME_CONFIG.DROPLETS_PER_ZONE;
    const percentage = Math.min(100, Math.round((gameState.waterCollected / totalDroplets) * 100));
    
    document.getElementById('waterStat').textContent = percentage + '%';
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('factsLearned').textContent = gameState.factsLearned.size;
    
    const level = LEVELS[gameState.currentLevel];
    document.getElementById('victoryTitle').textContent = level.name + ' Complete!';
    
    document.getElementById('impactText').textContent = 
        percentage >= 100 
            ? "Perfect! You collected all water droplets!" 
            : "Great work! Every drop makes a difference!";
}

// ===== LEVEL PROGRESSION =====
function nextLevel() {
    gameState.currentLevel++;
    
    if (gameState.currentLevel >= LEVELS.length) {
        // Game complete!
        alert('🎉 Congratulations! You completed all zones!\n\nVisit charity: water to learn more about bringing clean water to communities worldwide.');
        restartGame();
    } else {
        loadLevel(gameState.currentLevel);
        showScreen('game');
        gameLoop();
    }
}

function restartGame() {
    gameState.currentLevel = 0;
    gameState.score = 0;
    gameState.waterCollected = 0;
    gameState.factsLearned.clear();
    showScreen('title');
}

// ===== START THE GAME =====
init();
