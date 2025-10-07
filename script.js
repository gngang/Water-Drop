// ==========================================
// WATER DROP GAME - charity: water
// ==========================================

// GAME CONFIG
const CONFIG = {
    GAME_DURATION: 60,
    CLEAN_DROP_POINTS: 10,
    POLLUTED_DROP_PENALTY: 15,
    DROP_SPAWN_INTERVAL: 800,
    STREAK_BONUS: 5,
    POLLUTED_CHANCE: 0.30
};

// POLLUTANT IMAGES
const POLLUTANT_IMAGES = [
    'images/trash.png',
    'images/oil.png',
    'images/plastic.png',
    'images/chemical pollutant.png'
];

// GAME STATE
let gameState = {
    running: false,
    score: 0,
    timeLeft: CONFIG.GAME_DURATION,
    streak: 0,
    bestStreak: 0,
    cleanDropsCollected: 0,
    pollutedHit: 0
};

let dropMaker;
let gameTimer;

// DOM ELEMENTS
const startBtn = document.getElementById('start-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const scoreDisplay = document.getElementById('score');
const streakDisplay = document.getElementById('streak');
const timeDisplay = document.getElementById('time');
const gameContainer = document.getElementById('game-container');
const feedbackMessage = document.getElementById('feedback-message');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const gameOverModal = document.getElementById('game-over-modal');

// EVENT LISTENERS
startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', restartGame);

// START GAME
function startGame() {
    if (gameState.running) return;
    
    console.log('Starting game...');
    
    // Reset state
    gameState = {
        running: true,
        score: 0,
        timeLeft: CONFIG.GAME_DURATION,
        streak: 0,
        bestStreak: 0,
        cleanDropsCollected: 0,
        pollutedHit: 0
    };
    
    // Clear container
    gameContainer.innerHTML = '<div id="feedback-message" class="feedback-message"></div>';
    
    // Update displays
    updateDisplays();
    
    // Start timers
    clearInterval(dropMaker);
    clearInterval(gameTimer);
    
    dropMaker = setInterval(createDrop, CONFIG.DROP_SPAWN_INTERVAL);
    gameTimer = setInterval(updateTimer, 1000);
    
    // Spawn initial drops
    createDrop();
    setTimeout(createDrop, 300);
    setTimeout(createDrop, 600);
    
    console.log('Game started!');
}

// CREATE DROP
function createDrop() {
    if (!gameState.running) return;
    
    const drop = document.createElement('div');
    drop.className = 'water-drop';
    
    // Determine if polluted
    const isPolluted = Math.random() < CONFIG.POLLUTED_CHANCE;
    
    if (isPolluted) {
        drop.classList.add('polluted');
        // Random pollutant image
        const randomPollutant = POLLUTANT_IMAGES[Math.floor(Math.random() * POLLUTANT_IMAGES.length)];
        drop.style.backgroundImage = `url('${randomPollutant}')`;
    } else {
        drop.classList.add('clean');
    }
    
    drop.dataset.isPolluted = isPolluted;
    
    // Random position
    const gameWidth = gameContainer.offsetWidth;
    const xPosition = Math.random() * (gameWidth - 50);
    drop.style.left = xPosition + 'px';
    
    // Fall duration
    drop.style.animationDuration = '4s';
    
    // Click handler
    drop.addEventListener('click', () => handleDropClick(drop));
    
    // Add to container
    gameContainer.appendChild(drop);
    
    // Remove when animation ends
    drop.addEventListener('animationend', () => {
        if (drop.parentNode) {
            drop.remove();
        }
    });
}

// HANDLE DROP CLICK
function handleDropClick(drop) {
    if (!drop.parentNode) return;
    
    const isPolluted = drop.dataset.isPolluted === 'true';
    
    if (isPolluted) {
        // Hit pollution - penalty
        gameState.score = Math.max(0, gameState.score - CONFIG.POLLUTED_DROP_PENALTY);
        gameState.streak = 0;
        gameState.pollutedHit++;
        showFeedback(`-${CONFIG.POLLUTED_DROP_PENALTY}`, '#F5402C');
    } else {
        // Collected clean water - reward
        gameState.score += CONFIG.CLEAN_DROP_POINTS;
        gameState.cleanDropsCollected++;
        gameState.streak++;
        
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
        }
        
        // Streak bonus
        if (gameState.streak > 0 && gameState.streak % CONFIG.STREAK_BONUS === 0) {
            const bonus = 20;
            gameState.score += bonus;
            showFeedback(`STREAK! +${bonus}`, '#FFC907');
        } else {
            showFeedback(`+${CONFIG.CLEAN_DROP_POINTS}`, '#4FCB53');
        }
    }
    
    // Remove drop
    drop.style.transform = 'scale(0)';
    drop.style.transition = 'transform 0.2s ease';
    setTimeout(() => drop.remove(), 200);
    
    updateDisplays();
}

// SHOW FEEDBACK
function showFeedback(text, color) {
    const feedback = document.getElementById('feedback-message');
    feedback.textContent = text;
    feedback.style.color = color;
    feedback.classList.remove('show');
    
    // Trigger reflow
    void feedback.offsetWidth;
    
    feedback.classList.add('show');
}

// UPDATE DISPLAYS
function updateDisplays() {
    scoreDisplay.textContent = gameState.score;
    streakDisplay.textContent = gameState.streak;
    timeDisplay.textContent = gameState.timeLeft;
    
    // Update progress bar
    const targetDrops = 50;
    const percentage = Math.min(100, Math.round((gameState.cleanDropsCollected / targetDrops) * 100));
    progressFill.style.width = percentage + '%';
    progressPercent.textContent = percentage + '%';
}

// UPDATE TIMER
function updateTimer() {
    gameState.timeLeft--;
    timeDisplay.textContent = gameState.timeLeft;
    
    // Time warning
    if (gameState.timeLeft <= 10) {
        timeDisplay.style.color = '#F5402C';
    }
    
    // Game over
    if (gameState.timeLeft <= 0) {
        endGame();
    }
}

// END GAME
function endGame() {
    gameState.running = false;
    clearInterval(dropMaker);
    clearInterval(gameTimer);
    
    // Remove all drops
    const drops = document.querySelectorAll('.water-drop');
    drops.forEach(drop => drop.remove());
    
    // Show game over modal
    showGameOver();
}

// SHOW GAME OVER
function showGameOver() {
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('clean-drops').textContent = gameState.cleanDropsCollected;
    document.getElementById('best-streak').textContent = gameState.bestStreak;
    
    // Performance message
    let message = '';
    if (gameState.score >= 400) {
        message = '🌟 Outstanding! You\'re a water conservation champion!';
    } else if (gameState.score >= 300) {
        message = '🎉 Excellent! You understand the value of clean water!';
    } else if (gameState.score >= 200) {
        message = '👏 Great job! Keep fighting for clean water access!';
    } else if (gameState.score >= 100) {
        message = '💪 Good effort! Every drop makes a difference!';
    } else {
        message = '💙 Keep trying! Together we can bring clean water to all!';
    }
    
    document.getElementById('performance-message').textContent = message;
    
    gameOverModal.classList.add('active');
}

// RESTART GAME
function restartGame() {
    gameOverModal.classList.remove('active');
    timeDisplay.style.color = '#2E9DF7';
    startGame();
}

console.log('Water Drop Game loaded!');
