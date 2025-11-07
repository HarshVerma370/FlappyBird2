document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const finalScoreDisplay = document.getElementById('final-score');
    const levelOptions = document.querySelectorAll('.level-option');

    // Game variables
    let gameRunning = false;
    let score = 0;
    let currentLevel = 1;

    // Improved physics constants
    const PHYSICS = {
        GRAVITY: 2400,          // base gravity (px/s^2)
        FLAP_IMPULSE: -360,     // immediate upward velocity on flap (px/s)
        TERMINAL_VELOCITY: 700, // max downward speed (px/s)
        MAX_UPWARD_VELOCITY: -500 // max upward speed (px/s)
    };

    let birdVelocity = 0;
    let birdPosition = 150;
    let birdAngle = 0; // degrees, used for smooth rotation
    let lastFlapTime = 0; // timestamp for flap animation
    const FLAP_ANIM_DURATION = 150; // ms for wing-flap visual
    let pipeGap = 150;
    let pipeWidth = 60;
    let pipes = [];
    let frameCount = 0;
    let pipeFrequency = 100;

    // Set canvas dimensions
    function resizeCanvas() {
        const container = document.getElementById('game-container');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Bird properties
    const bird = {
        width: 40,
        height: 30,
        x: 50
    };

    const levels = {
        1: { gravity: 0.4, speed: 2, gap: 160, frequency: 120 },
        2: { gravity: 0.6, speed: 3, gap: 140, frequency: 90 },
        3: { gravity: 0.8, speed: 4, gap: 120, frequency: 70 }
    };

    // Set level option buttons
    levelOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            currentLevel = parseInt(option.dataset.level);
            document.getElementById('level-btn').textContent = option.textContent;
            document.getElementById('level-dropdown').classList.add('hidden');
        });
    });

    // Draw bird with rotation based on velocity
    function drawBird() {
        // Use the smooth birdAngle computed in the game loop
        const angleRad = (birdAngle * Math.PI) / 180;

        ctx.save();
        ctx.translate(bird.x, birdPosition);
        ctx.rotate(angleRad);

        // Body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(8, -6, 4, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(24, -6);
        ctx.lineTo(24, 6);
        ctx.closePath();
        ctx.fill();

        // Wing: animate based on lastFlapTime
        const now = performance.now();
        const sinceFlap = now - lastFlapTime;
        let wingTilt = -10; // default wing angle
        if (sinceFlap < FLAP_ANIM_DURATION) {
            // flap up quickly then settle
            const t = sinceFlap / FLAP_ANIM_DURATION;
            wingTilt = -45 + 35 * (1 - t); // from -45 -> -10
        }

        ctx.save();
        ctx.rotate((wingTilt * Math.PI) / 180);
        ctx.fillStyle = '#E07A00';
        ctx.beginPath();
        ctx.ellipse(-4, 6, bird.width * 0.3, bird.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    // Pipes draw and update unchanged (use previous code)

    function drawPipes() {
        ctx.fillStyle = '#2ECC71';

        pipes.forEach(pipe => {
            ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
            ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
        });
    }

    function generatePipes() {
        if (frameCount % pipeFrequency === 0) {
            const topHeight = Math.floor(Math.random() * (canvas.height / 2)) + 50;
            const bottomY = topHeight + pipeGap;

            pipes.push({ x: canvas.width, topHeight, bottomY, passed: false });
        }
    }

    function updatePipes() {
        pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

        pipes.forEach(pipe => {
            pipe.x -= levels[currentLevel].speed;

            if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
                pipe.passed = true;
                score++;
            }
        });
    }

    // Collision check unchanged (previous code)

    function checkCollision() {
        if (birdPosition + bird.height / 2 > canvas.height) return true;
        if (birdPosition - bird.height / 2 < 0) return true;

        for (const pipe of pipes) {
            if (
                bird.x + bird.width / 2 > pipe.x &&
                bird.x - bird.width / 2 < pipe.x + pipeWidth &&
                (birdPosition - bird.height / 2 < pipe.topHeight || birdPosition + bird.height / 2 > pipe.bottomY)
            ) return true;
        }

        return false;
    }

    // Draw score unchanged

    function drawScore() {
        ctx.fillStyle = '#000';
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, 20, 30);

        ctx.font = '16px Arial';
        ctx.fillText(`Level: ${currentLevel}`, 20, 55);
    }

    // Main loop with deltaTime and improved physics

    let lastFrameTime = performance.now();
    function gameLoop() {
        if (!gameRunning) return;

        const now = performance.now();
        const deltaTime = (now - lastFrameTime) / 1000;
        lastFrameTime = now;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply gravity scaled by level difficulty
        const levelGravityFactor = levels[currentLevel] ? levels[currentLevel].gravity : 1;
        birdVelocity += PHYSICS.GRAVITY * levelGravityFactor * deltaTime;

        // Clamp velocities
        birdVelocity = Math.min(birdVelocity, PHYSICS.TERMINAL_VELOCITY);
        birdVelocity = Math.max(birdVelocity, PHYSICS.MAX_UPWARD_VELOCITY);

        // Integrate position
        birdPosition += birdVelocity * deltaTime;

        // Smooth rotation: target angle based on velocity, lerp towards it
        const maxTilt = 45; // degrees
        const targetAngle = Math.max(Math.min((birdVelocity / PHYSICS.TERMINAL_VELOCITY) * maxTilt, maxTilt), -maxTilt);
        // lerp factor scaled by deltaTime for frame-rate independence
        const lerpFactor = Math.min(1, 8 * deltaTime);
        birdAngle = birdAngle + (targetAngle - birdAngle) * lerpFactor;

        generatePipes();
        updatePipes();

        drawBird();
        drawPipes();
        drawScore();

        if (checkCollision()) {
            gameOver();
            return;
        }

        frameCount++;
        requestAnimationFrame(gameLoop);
    }

    // Start, gameOver, jump function updates

    function startGame() {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        gameRunning = true;
        score = 0;
        birdPosition = 150;
        birdVelocity = 0;
        birdAngle = 0;
        lastFlapTime = 0;
        pipes = [];
        frameCount = 0;
        lastFrameTime = performance.now();

        pipeGap = levels[currentLevel].gap;
        pipeFrequency = levels[currentLevel].frequency;

        gameLoop();
    }

    function gameOver() {
        gameRunning = false;
        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    function jump() {
        // If game not started, start on first input
        if (!gameRunning) {
            startGame();
            // small delay so the initial flap is applied after the game loop starts
        }

        // Immediate set of upward velocity for snappy response
        birdVelocity = PHYSICS.FLAP_IMPULSE;
        lastFlapTime = performance.now();
    }

    // Event listeners unchanged

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            jump();
        }
    });

    // Pointer input: start game if not running, otherwise flap
    canvas.addEventListener('click', (e) => {
        e.preventDefault();
        jump();
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    });
});
