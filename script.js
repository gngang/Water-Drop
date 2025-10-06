// WATER DROP GAME - SIMPLE VERSION THAT WORKS

// CONFIG
const CONFIG = {
    GAME_DURATION: 60,
    CLEAN_DROP_POINTS: 10,
    POLLUTED_DROP_PENALTY: 15,
    DROP_SPAWN_INTERVAL: 800,
    DROP_FALL_DURATION: 4000,
    POLLUTED_DROP_CHANCE: 0.25,
    STREAK_BONUS_THRESHOLD: 5,
    FACT_SHOW_INTERVAL: 20
};

// FACTS
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

// GAME STATE
let gameState = {
    score: 0,
    timeLeft: CONFIG.GAME_DURATION,
    streak: 0,
    bestStreak: 0,
    cleanDropsCollected: 0,
    pollutedDropsAvoided: 0,
    pollutedDropsHit: 0,
    gameRunning: false,
    lastFactTime: 0
};

let gameTimer;
let spawnTimer;

// START GAME
function startGame() {
    console.log('GAME STARTING!');
    
    // Reset state
    gameState = {
        score: 0,
        timeLeft: CONFIG.GAME_DURATION,
        streak: 0,
        bestStreak: 0,
        cleanDropsCollected: 0,
        pollutedDropsAvoided: 0,
        pollutedDropsHit: 0,
        gameRunning: true,
        lastFactTime: 0
    };
    
    // Clear drops
    document.getElementById('gameArea').innerHTML = '';
    
    // Update UI
    updateHUD();
    
    // Show game screen
    document.getElementById('titleScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    
    // Start timers
    clearInterval(gameTimer);
    clearInterval(spawnTimer);
    
    gameTimer = setInterval(updateTimer, 1000);
    spawnTimer = setInterval(spawnDrop, CONFIG.DROP_SPAWN_INTERVAL);
    
    spawnDrop();
    
    console.log('GAME STARTED!');
}
