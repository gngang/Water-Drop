// ==========================================
// WATER DROP GAME - charity: water
// game.js (DEBUGGED)
// ==========================================

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded. Initializing game...');

    // CONFETTI FUNCTION
    function triggerConfetti() {
        const colors = ['#FFC907', '#2E9DF7', '#4FCB53', '#FF902A'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            document.body.appendChild(confetti);
            
            const fall = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: 3000 + Math.random() * 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            fall.onfinish = () => confetti.remove();
        }
        showFeedback('🎉 100% FULL! 🎉', '#FFC907');
    }

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
        pollutedHit: 0,
        confettiTriggered: false
    };

    let dropMaker = null;
    let gameTimer = null;

    // DOM ELEMENTS
    const startBtn = document.getElementById('start-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const scoreDisplay = document.getElementById('score');
    const streakDisplay = document.getElementById('streak');
    const timeDisplay = document.getElementById('time');
    const gameContainer = document.getElementById('game-container');
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    const gameOverModal = document.getElementById('game-over-modal');

    // --- ADD DEBUG LOGS ---
    console.log({
        startBtn,
        playAgainBtn,
        gameContainer
    });

    // --- EVENT LISTENERS ---
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('Start button clicked!');
            startGame();
        });
    } else {
        console.error('❌ Start button not found! Check your HTML: id="start-btn"');
    }

    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', restartGame);
    }

    // --- GAME LOGIC FUNCTIONS BELOW ---
    function startGame() {
        if (gameState.running) return;
        console.log('Starting game...');

        Object.assign(gameState, {
            running: true,
            score: 0,
            timeLeft: CONFIG.GAME_DURATION,
            streak: 0,
            bestStreak: 0,
            cleanDropsCollected: 0,
            pollutedHit: 0,
            confettiTriggered: false
        });

        // Clear and reset container
        gameContainer.innerHTML = '<div id="feedback-message" class="feedback-message"></div>';
        updateDisplays();

        clearInterval(dropMaker);
        clearInterval(gameTimer);
        dropMaker = setInterval(createDrop, CONFIG.DROP_SPAWN_INTERVAL);
        gameTimer = setInterval(updateTimer, 1000);

        // Initial drops
        createDrop();
        setTimeout(createDrop, 300);
        setTimeout(createDrop, 600);

        console.log('✅ Game started successfully');
    }

    function createDrop() {
        if (!gameState.running) return;

        const drop = document.createElement('div');
        drop.className = 'water-drop';
        const isPolluted = Math.random() < CONFIG.POLLUTED_CHANCE;

        if (isPolluted) {
            drop.classList.add('polluted');
            const randomPollutant = POLLUTANT_IMAGES[Math.floor(Math.random() * POLLUTANT_IMAGES.length)];
            drop.style.backgroundImage = `url('${randomPollutant}')`;
        } else {
            drop.classList.add('clean');
        }

        drop.dataset.isPolluted = isPolluted;
        const gameWidth = gameContainer.offsetWidth || 300; // fallback
        const xPosition = Math.random() * (gameWidth - 50);
        drop.style.left = `${xPosition}px`;
        drop.style.animationDuration = '4s';
        drop.addEventListener('click', () => handleDropClick(drop));
        gameContainer.appendChild(drop);
        drop.addEventListener('animationend', () => drop.remove());
    }

    function handleDropClick(drop) {
        if (!drop.parentNode) return;
        const isPolluted = drop.dataset.isPolluted === 'true';

        if (isPolluted) {
            gameState.score = Math.max(0, gameState.score - CONFIG.POLLUTED_DROP_PENALTY);
            gameState.streak = 0;
            gameState.pollutedHit++;
            showFeedback(`-${CONFIG.POLLUTED_DROP_PENALTY}`, '#F5402C');
        } else {
            gameState.score += CONFIG.CLEAN_DROP_POINTS;
            gameState.cleanDropsCollected++;
            gameState.streak++;
            if (gameState.streak > gameState.bestStreak) gameState.bestStreak = gameState.streak;

            if (gameState.streak > 0 && gameState.streak % CONFIG.STREAK_BONUS === 0) {
                const bonus = 20;
                gameState.score += bonus;
                showFeedback(`STREAK! +${bonus}`, '#FFC907');
            } else {
                showFeedback(`+${CONFIG.CLEAN_DROP_POINTS}`, '#4FCB53');
            }
        }

        drop.style.transform = 'scale(0)';
        drop.style.transition = 'transform 0.2s ease';
        setTimeout(() => drop.remove(), 200);
        updateDisplays();
    }

    function showFeedback(text, color) {
        const feedback = document.getElementById('feedback-message');
        if (!feedback) return;
        feedback.textContent = text;
        feedback.style.color = color;
        feedback.classList.remove('show');
        void feedback.offsetWidth;
        feedback.classList.add('show');
    }

    function updateDisplays() {
        if (!scoreDisplay || !streakDisplay || !timeDisplay) return;
        scoreDisplay.textContent = gameState.score;
        streakDisplay.textContent = gameState.streak;
        timeDisplay.textContent = gameState.timeLeft;

        const targetDrops = 50;
        const percentage = Math.min(100, Math.round((gameState.cleanDropsCollected / targetDrops) * 100));
        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressPercent) progressPercent.textContent = percentage + '%';
        
        if (percentage === 100 && !gameState.confettiTriggered) {
            gameState.confettiTriggered = true;
            triggerConfetti();
        }
    }

    function updateTimer() {
        gameState.timeLeft--;
        timeDisplay.textContent = gameState.timeLeft;
        if (gameState.timeLeft <= 10) timeDisplay.style.color = '#F5402C';
        if (gameState.timeLeft <= 0) endGame();
    }

    function endGame() {
        gameState.running = false;
        clearInterval(dropMaker);
        clearInterval(gameTimer);
        document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
        showGameOver();
    }

    function showGameOver() {
        const finalScore = document.getElementById('final-score');
        const cleanDrops = document.getElementById('clean-drops');
        const bestStreak = document.getElementById('best-streak');
        const performanceMsg = document.getElementById('performance-message');

        if (finalScore) finalScore.textContent = gameState.score;
        if (cleanDrops) cleanDrops.textContent = gameState.cleanDropsCollected;
        if (bestStreak) bestStreak.textContent = gameState.bestStreak;

        let message = '';
        if (gameState.score >= 400) message = '🌟 Outstanding! You\'re a water conservation champion!';
        else if (gameState.score >= 300) message = '🎉 Excellent! You understand the value of clean water!';
        else if (gameState.score >= 200) message = '👏 Great job! Keep fighting for clean water access!';
        else if (gameState.score >= 100) message = '💪 Good effort! Every drop makes a difference!';
        else message = '💙 Keep trying! Together we can bring clean water to all!';

        if (performanceMsg) performanceMsg.textContent = message;
        if (gameOverModal) gameOverModal.classList.add('active');
    }

    function restartGame() {
        if (gameOverModal) gameOverModal.classList.remove('active');
        timeDisplay.style.color = '#2E9DF7';
        startGame();
    }

    console.log('✅ Water Drop Game initialized');
});

