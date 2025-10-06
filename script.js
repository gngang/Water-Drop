// ==========================================
// WATER DROP - CHARITY: WATER GAME
// Simple Tap-to-Collect Game Logic
// ==========================================

// ===== GAME CONFIGURATION =====
const CONFIG = {
    GAME_DURATION: 60, // seconds
    CLEAN_DROP_POINTS: 10,
    POLLUTED_DROP_PENALTY: 15,
    DROP_SPAWN_INTERVAL: 800, // milliseconds
    DROP_FALL_DURATION: 4000, // milliseconds
    POLLUTED_DROP_CHANCE: 0.25, // 25% chance
    STREAK_BONUS_THRESHOLD: 5,
    FACT_SHOW_INTERVAL: 20 // Show fact every 20 seconds
};

// ===== CHARITY: WATER FACTS =====
const WATER_FACTS = [
    "771 million people worldwide lack access to clean water - that's 1 in 10 people.",
    "Women and children spend 200 million hours every day collecting water.",
    "Clean water can reduce waterborne diseases by up to 80%.",
    "Every $1 invested in clean water returns about $4 in productivity.",
    "Access to clean water increases school attendance, especially for girls.",
    "Clean water projects create jobs and boost local economies.",
    "785 million people still drink water from unsafe sources.",
    "Clean water is the foundation for health, education, and opportunity.",
    "Children in families without access to clean water are 10 times more likely to die from diarrheal diseases.",
    "With clean water, communities can break the cycle of poverty and disease."
];

// ===== GAME STATE =====
let gameState = {
    score: 0,
    timeLeft: CONFIG.GAME_DURATION,
    streak: 0,
    bestStreak: 0,
    cleanDropsCollected: 0,
    pollutedDropsAvoided: 0,
    pollutedDropsHit: 0,
    totalDropsSpawned: 0,
    gameRunning: false,
    currentScreen: 'title',
    lastFactTime: 0
};

// ===== DOM ELEMENTS =====
const titleScreen = document.getElementById('titleScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const factPopup = document.getElementById('factPopup');

const startGameBtn = document.getElementById('startGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');
const continueBtn = document.getElementById('continueBtn');

const gameArea = document.getElementById('gameArea');
const scoreValue = document.getElementById('scoreValue');
const timerValue = document.getElementById('timerValue');
const streakValue = document.getElementById('streakValue');
const feedbackMessage = document.getElementById('feedbackMessage');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');

const factText = document.getElementById('factText');
const finalScore = document.getElementById('finalScore');
const cleanDrops = document.getElementById('cleanDrops');
const pollutionAvoided = document.getElementById('pollutionAvoided');
const bestStreak = document.getElementById('bestStreak');
const performanceText = document.getElementById('performanceText');
const impactText = document.getElementById('impactText');
const bottlesCount = document.getElementById('bottlesCount');

// ===== TIMERS =====
let gameTimer;
let spawnTimer;
let gameStartTime;

// ===== INITIALIZATION =====
function init() {
    setupEventListeners();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    startGameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Start button clicked!');
        startGame();
    });
    
    playAgainBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Play again clicked!');
        startGame();
    });
    
    learnMoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showFactPopup();
    });
    
    continueBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideFactPopup();
    });
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenName) {
    titleScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');

    switch(screenName) {
        case 'title':
            titleScreen.classList.add('active');
            break;
        case 'game':
            gameScreen.classList.add('active');
            break;
        case 'gameover':
            gameOverScreen.classList.add('active');
            break;
    }
    
    gameState.currentScreen = screenName;
}

// ===== START GAME =====
function startGame() {
    // Reset game state
    gameState = {
        score: 0,
        timeLeft: CONFIG.GAME_DURATION,
        streak: 0,
        bestStreak: 0,
        cleanDropsCollected: 0,
        pollutedDropsAvoided: 0,
        pollutedDropsHit: 0,
        totalDropsSpawned: 0,
        gameRunning: true,
        currentScreen: 'game',
        lastFactTime: 0
    };
    
    // Clear game area
    gameArea.innerHTML = '';
    
    // Update UI
    updateHUD();
    showScreen('game');
    
    // Start game timers
    gameStartTime = Date.now();
    gameTimer = setInterval(updateTimer, 1000);
    spawnTimer = setInterval(spawnDrop, CONFIG.DROP_SPAWN_INTERVAL);
    
    // Spawn first drop immediately
    spawnDrop();
}

// ===== UPDATE TIMER =====
function updateTimer() {
    gameState.timeLeft--;
    timerValue.textContent = gameState.timeLeft;
    
    // Check for fact popup (every 20 seconds)
    const elapsedTime = CONFIG.GAME_DURATION - gameState.timeLeft;
    if (elapsedTime > 0 && elapsedTime % CONFIG.FACT_SHOW_INTERVAL === 0 && 
        elapsedTime !== gameState.lastFactTime) {
        gameState.lastFactTime = elapsedTime;
        pauseGameForFact();
    }
    
    // Game over
    if (gameState.timeLeft <= 0) {
        endGame();
    }
    
    // Visual warning when time is low
    if (gameState.timeLeft <= 10) {
        timerValue.style.color = 'var(--pollution-red)';
        timerValue.style.animation = 'pulse 0.5s ease-in-out infinite';
    }
}

// ===== SPAWN DROP =====
function spawnDrop() {
    if (!gameState.gameRunning) return;
    
    const drop = document.createElement('div');
    drop.className = 'water-drop';
    
    // Determine if clean or polluted
    const isPolluted = Math.random() < CONFIG.POLLUTED_DROP_CHANCE;
    drop.classList.add(isPolluted ? 'polluted' : 'clean');
    drop.dataset.isPolluted = isPolluted;
    
    // Random horizontal position
    const maxX = gameArea.clientWidth - 60;
    const randomX = Math.random() * maxX;
    drop.style.left = randomX + 'px';
    
    // Set fall animation
    const fallDuration = CONFIG.DROP_FALL_DURATION;
    drop.style.animationDuration = fallDuration + 'ms';
    
    // Add click handler
    drop.addEventListener('click', () => handleDropClick(drop));
    
    // Add to game area
    gameArea.appendChild(drop);
    gameState.totalDropsSpawned++;
    
    // Remove drop after it falls off screen
    setTimeout(() => {
        if (drop.parentNode && !drop.dataset.clicked) {
            // Drop missed - count as avoided if polluted
            if (drop.dataset.isPolluted === 'true') {
                gameState.pollutedDropsAvoided++;
            }
            drop.remove();
        }
    }, fallDuration);
}

// ===== HANDLE DROP CLICK =====
function handleDropClick(drop) {
    if (drop.dataset.clicked) return; // Already clicked
    drop.dataset.clicked = 'true';
    
    const isPolluted = drop.dataset.isPolluted === 'true';
    
    if (isPolluted) {
        // Hit polluted drop - penalty
        gameState.score = Math.max(0, gameState.score - CONFIG.POLLUTED_DROP_PENALTY);
        gameState.streak = 0;
        gameState.pollutedDropsHit++;
        showFeedback('Pollution! -' + CONFIG.POLLUTED_DROP_PENALTY, 'bad');
    } else {
        // Collected clean drop - reward
        gameState.score += CONFIG.CLEAN_DROP_POINTS;
        gameState.streak++;
        gameState.cleanDropsCollected++;
        
        // Update best streak
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
        }
        
        // Streak bonus
        if (gameState.streak % CONFIG.STREAK_BONUS_THRESHOLD === 0) {
            const bonus = 20;
            gameState.score += bonus;
            showFeedback('Streak! +' + bonus, 'streak');
        } else {
            showFeedback('+' + CONFIG.CLEAN_DROP_POINTS, 'good');
        }
    }
    
    // Visual feedback
    drop.style.animation = 'none';
    drop.style.transition = 'all 0.3s ease';
    drop.style.transform = 'scale(0)';
    drop.style.opacity = '0';
    
    setTimeout(() => drop.remove(), 300);
    
    updateHUD();
}

// ===== SHOW FEEDBACK =====
function showFeedback(message, type) {
    feedbackMessage.textContent = message;
    feedbackMessage.className = 'feedback-message ' + type;
    feedbackMessage.style.animation = 'none';
    
    // Trigger reflow
    void feedbackMessage.offsetWidth;
    
    feedbackMessage.style.animation = 'fadeOutUp 1s ease';
}

// ===== UPDATE HUD =====
function updateHUD() {
    scoreValue.textContent = gameState.score;
    streakValue.textContent = gameState.streak;
    
    // Update progress bar (based on clean drops collected)
    const targetDrops = 50; // Target for 100%
    const percentage = Math.min(100, Math.round((gameState.cleanDropsCollected / targetDrops) * 100));
    progressFill.style.width = percentage + '%';
    progressPercent.textContent = percentage + '%';
}

// ===== PAUSE GAME FOR FACT =====
function pauseGameForFact() {
    gameState.gameRunning = false;
    clearInterval(spawnTimer);
    
    // Pause all drops
    const drops = document.querySelectorAll('.water-drop');
    drops.forEach(drop => {
        const computedStyle = window.getComputedStyle(drop);
        const transform = computedStyle.transform;
        drop.style.animation = 'none';
        drop.style.transform = transform;
    });
    
    showFactPopup();
}

// ===== SHOW FACT POPUP =====
function showFactPopup() {
    const randomFact = WATER_FACTS[Math.floor(Math.random() * WATER_FACTS.length)];
    factText.textContent = randomFact;
    factPopup.classList.add('active');
}

// ===== HIDE FACT POPUP =====
function hideFactPopup() {
    factPopup.classList.remove('active');
    
    if (gameState.currentScreen === 'game' && gameState.timeLeft > 0) {
        // Resume game
        gameState.gameRunning = true;
        
        // Resume drops
        const drops = document.querySelectorAll('.water-drop');
        drops.forEach(drop => {
            const currentTop = parseInt(drop.style.transform.match(/translateY\(([^)]+)\)/)?.[1] || 0);
            const totalHeight = window.innerHeight + 100;
            const remainingDistance = totalHeight - currentTop;
            const remainingDuration = (remainingDistance / totalHeight) * CONFIG.DROP_FALL_DURATION;
            
            drop.style.animation = `fall ${remainingDuration}ms linear`;
        });
        
        spawnTimer = setInterval(spawnDrop, CONFIG.DROP_SPAWN_INTERVAL);
    }
}

// ===== END GAME =====
function endGame() {
    gameState.gameRunning = false;
    clearInterval(gameTimer);
    clearInterval(spawnTimer);
    
    // Clear remaining drops
    gameArea.innerHTML = '';
    
    // Show game over screen
    showGameOverScreen();
}

// ===== SHOW GAME OVER SCREEN =====
function showGameOverScreen() {
    // Update stats
    finalScore.textContent = gameState.score;
    cleanDrops.textContent = gameState.cleanDropsCollected;
    pollutionAvoided.textContent = gameState.pollutedDropsAvoided;
    bestStreak.textContent = gameState.bestStreak;
    
    // Calculate bottles (10 drops = 1 bottle)
    const bottles = Math.floor(gameState.cleanDropsCollected / 10);
    bottlesCount.textContent = bottles;
    impactText.innerHTML = `You collected enough drops to fill <strong id="bottlesCount">${bottles}</strong> water bottle${bottles !== 1 ? 's' : ''}!`;
    
    // Performance message
    let performance = '';
    if (gameState.score >= 400) {
        performance = '🌟 Outstanding! You\'re a water conservation champion!';
    } else if (gameState.score >= 300) {
        performance = '🎉 Excellent work! You really understand the importance of clean water!';
    } else if (gameState.score >= 200) {
        performance = '👏 Great job! You\'re making a real difference!';
    } else if (gameState.score >= 100) {
        performance = '💪 Good effort! Keep learning about clean water access!';
    } else {
        performance = '💙 Every drop counts! Try again to improve your score!';
    }
    performanceText.textContent = performance;
    
    showScreen('gameover');
}

// ===== START THE GAME =====
init();
