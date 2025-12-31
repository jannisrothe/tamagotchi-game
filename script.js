// ==========================================
// TAMAGOTCHI GAME - Vanilla Canvas + Sound
// ==========================================

const canvas = document.createElement('canvas');
canvas.width = 300;
canvas.height = 300;
canvas.className = 'pixel-art';
const ctx = canvas.getContext('2d');

document.getElementById('game-container').appendChild(canvas);

// ==========================================
// SOUND EFFECTS (jsfxr)
// ==========================================
const sounds = {
    eat: [0,,0.1487,,0.2732,0.4142,,,,,,,,,,0.6493,,,1,,,,,0.5],
    play: [0,,0.0837,,0.1916,0.3402,,-0.1437,,,,,,0.3189,,,,,1,,,,,0.5],
    clean: [0,,0.1516,,0.1953,0.4648,,0.1681,,,,,,0.2391,,,,,1,,,,,0.5],
    heal: [0,,0.2113,,0.3364,0.5405,,0.0918,,,,,,0.2818,,,,,1,,,,,0.5],
    evolve: [0,,0.3116,,0.3827,0.6021,,0.2393,,,,,0.0451,0.5719,,,,,1,,,0.2131,,0.5],
    click: [0,,0.01,,0.1,0.15,,,,,,,,,,,,,1,,,,,0.1],
};

function playSound(soundArray) {
    try {
        if (typeof jsfxr !== 'undefined') {
            const audio = jsfxr(soundArray);
            audio.play();
        }
    } catch(e) {
        console.log('Sound play failed:', e);
    }
}

// ==========================================
// BACKGROUND MUSIC (TinyMusic)
// ==========================================
let bgMusic = null;
let musicStarted = false;

function initMusic() {
    try {
        if (typeof TinyMusic !== 'undefined' && !musicStarted) {
            const tempo = 120;
            const sequence = new TinyMusic.Sequence(null, tempo, [
                'C4 q', 'E4 q', 'G4 q', 'E4 q',
                'C4 q', 'E4 q', 'G4 h',
                'D4 q', 'F4 q', 'A4 q', 'F4 q',
                'D4 q', 'F4 q', 'A4 h'
            ]);

            bgMusic = new TinyMusic.Player();
            bgMusic.loop = true;
            bgMusic.add(sequence);
            bgMusic.play();
            musicStarted = true;
        }
    } catch(e) {
        console.log('Music init failed:', e);
    }
}

// Start music on first user interaction
document.addEventListener('click', () => {
    if (!musicStarted) {
        initMusic();
    }
}, { once: true });

// ==========================================
// GAME STATE
// ==========================================
const gameState = {
    hunger: 100,
    happiness: 100,
    health: 100,
    age: 0,
    stage: 'egg',
    isDirty: false,
    isSick: false,
    isAlive: true,
    isPaused: false,
    isSleeping: false,
    isInteracting: false,
    birthTime: Date.now(),
    pausedTime: 0,
    petName: 'TAMA',
    poops: [],
};

// Tamagotchi sprite
const tama = {
    x: 150,
    y: 150,
    targetX: 150,
    targetY: 150,
    frame: 0,
    facingRight: true,
    isBlinking: false,
};

// Active objects (food, balls, etc.)
let activeObjects = [];

// ==========================================
// DRAWING FUNCTIONS
// ==========================================

function drawPixel(x, y, color, size = 10) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
}

function drawTamagotchi() {
    const s = 10; // Pixel size
    const cx = tama.x;
    const cy = tama.y;

    ctx.save();
    ctx.translate(cx, cy);
    if (!tama.facingRight) {
        ctx.scale(-1, 1);
    }

    // Colors based on stage
    const colors = {
        egg: { primary: '#a8d8ea', secondary: '#aa96da', accent: '#fcbad3' },
        baby: { primary: '#ffb6b9', secondary: '#fae3d9', accent: '#ff6b9d' },
        child: { primary: '#92e3a9', secondary: '#7ec4cf', accent: '#4ecdc4' },
        adult: { primary: '#ff9a56', secondary: '#ffcd38', accent: '#ff5e5b' }
    };
    const c = colors[gameState.stage];

    if (gameState.stage === 'egg') {
        // Egg shape
        ctx.fillStyle = c.primary;
        ctx.fillRect(-20, -30, s, s * 6);
        ctx.fillRect(-10, -40, s * 2, s * 8);
        ctx.fillRect(10, -30, s, s * 6);

        ctx.fillStyle = c.secondary;
        ctx.fillRect(-10, 0, s * 2, s * 2);

        // Spots
        ctx.fillStyle = c.accent;
        ctx.fillRect(-15, -10, s, s);
        ctx.fillRect(5, -10, s, s);
    } else {
        // Round body
        ctx.fillStyle = c.primary;
        ctx.fillRect(-20, -10, s * 4, s * 3);
        ctx.fillRect(-30, 0, s * 6, s * 2);
        ctx.fillRect(-20, 20, s * 4, s);

        // Eyes
        if (!tama.isBlinking) {
            ctx.fillStyle = '#000';
            ctx.fillRect(-15, -5, s * 0.8, s * 0.8);
            ctx.fillRect(5, -5, s * 0.8, s * 0.8);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(-15, -2, s, s * 0.3);
            ctx.fillRect(5, -2, s, s * 0.3);
        }

        // Smile
        ctx.fillStyle = '#000';
        ctx.fillRect(-10, 10, s * 2, s * 0.6);
    }

    ctx.restore();
}

function drawPoop(poop) {
    const s = 10;
    ctx.fillStyle = '#6b5310';
    ctx.fillRect(poop.x - 7, poop.y, s, s);
    ctx.fillRect(poop.x + 4, poop.y, s, s);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(poop.x - 3, poop.y - 10, s, s);
}

function draw8BitEmoji(x, y, type) {
    const s = 8;
    ctx.fillStyle = '#FFD700';

    // Yellow circle
    ctx.fillRect(x - s, y - 2*s, s*2, s*4);
    ctx.fillRect(x - 2*s, y - s, s*4, s*2);

    ctx.fillStyle = '#000';
    if (type === 'happy') {
        ctx.fillRect(x - s, y - s/2, s/2, s/2);
        ctx.fillRect(x + s/2, y - s/2, s/2, s/2);
        ctx.fillRect(x - s, y + s, s*2, s/2);
    } else if (type === 'heart') {
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(x - s, y - s/2, s/2, s);
        ctx.fillRect(x + s/2, y - s/2, s/2, s);
        ctx.fillRect(x - s*1.5, y, s*3, s*2);
    }
}

// ==========================================
// ANIMATION LOOP
// ==========================================

let animationFrame = 0;
let lastTime = 0;

function animate(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Clear canvas
    ctx.fillStyle = '#c8e6c9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw active objects (food, balls)
    activeObjects.forEach(obj => {
        if (obj.update) obj.update();
        if (obj.draw) obj.draw();
    });

    // Update Tamagotchi movement
    if (!gameState.isInteracting && !gameState.isPaused && gameState.stage !== 'egg') {
        const dx = tama.targetX - tama.x;
        const dy = tama.targetY - tama.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const speed = 0.5;
            tama.x += (dx / dist) * speed;
            tama.y += (dy / dist) * speed;
            tama.facingRight = dx > 0;
        }
    }

    // Draw poops
    gameState.poops.forEach(poop => drawPoop(poop));

    // Draw Tamagotchi
    drawTamagotchi();

    animationFrame++;
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// ==========================================
// GAME TIMERS
// ==========================================

// Random movement
setInterval(() => {
    if (!gameState.isInteracting && !gameState.isPaused && gameState.stage !== 'egg') {
        tama.targetX = 60 + Math.random() * 180;
        tama.targetY = 100 + Math.random() * 150;
    }
}, 3000);

// Random blink
setInterval(() => {
    if (gameState.stage !== 'egg' && !gameState.isPaused) {
        tama.isBlinking = true;
        setTimeout(() => {
            tama.isBlinking = false;
        }, 200);
    }
}, 2000);

// Poop generation
setInterval(() => {
    if (!gameState.isPaused && gameState.stage !== 'egg' && gameState.poops.length < 3 && Math.random() < 0.4) {
        gameState.poops.push({
            x: 60 + Math.random() * 180,
            y: 230 + Math.random() * 50
        });
    }
}, 15000);

// Stats degradation
setInterval(() => {
    if (gameState.isPaused || !gameState.isAlive || gameState.isSleeping) return;

    gameState.hunger = Math.max(0, gameState.hunger - 0.2);
    gameState.happiness = Math.max(0, gameState.happiness - 0.1);

    if (gameState.poops.length > 0) {
        gameState.health = Math.max(0, gameState.health - 0.5);
    }

    if (gameState.hunger < 30 || gameState.happiness < 30) {
        gameState.health = Math.max(0, gameState.health - 0.1);
    }

    if (gameState.health < 30 && !gameState.isSick) {
        gameState.isSick = true;
    }

    if ((gameState.hunger === 0 || gameState.health === 0) &&
        gameState.stage !== 'egg' && gameState.stage !== 'baby') {
        gameState.isAlive = false;
    }

    updateUI();
    saveGame();
}, 1000);

// Age update
setInterval(() => {
    if (gameState.isPaused || !gameState.isAlive) return;

    const ageInSeconds = Math.floor((Date.now() - gameState.birthTime - gameState.pausedTime) / 1000);
    gameState.age = ageInSeconds;

    if (gameState.stage === 'egg' && ageInSeconds >= 300) {
        evolve('baby');
    } else if (gameState.stage === 'baby' && ageInSeconds >= 3900) {
        evolve('child');
    } else if (gameState.stage === 'child' && ageInSeconds >= 25200) {
        evolve('adult');
    }

    updateUI();
}, 1000);

function evolve(newStage) {
    gameState.stage = newStage;
    playSound(sounds.evolve);
    showMessage(`${gameState.petName} evolved to ${newStage.toUpperCase()}!`);
}

// ==========================================
// INTERACTION FUNCTIONS
// ==========================================

function feedTamagotchi() {
    if (!gameState.isAlive || gameState.isPaused || gameState.isSleeping || gameState.isInteracting) return;

    gameState.isInteracting = true;
    playSound(sounds.click);
    showMessage(`Fed ${gameState.petName}!`);

    const foodX = 80 + Math.random() * 140;
    const foodY = 240;

    // Create food object
    const food = {
        x: foodX,
        y: -10,
        targetY: foodY,
        landed: false,
        draw() {
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fill();
        },
        update() {
            if (!this.landed && this.y < this.targetY) {
                this.y += 2;
            } else if (!this.landed) {
                this.landed = true;
                // Move Tamagotchi to food
                tama.targetX = foodX;
                tama.targetY = foodY - 20;
            }

            // Check if Tamagotchi reached food
            if (this.landed) {
                const dist = Math.sqrt(
                    Math.pow(tama.x - foodX, 2) +
                    Math.pow(tama.y - (foodY - 20), 2)
                );

                if (dist < 10) {
                    // Remove food from active objects
                    activeObjects = activeObjects.filter(obj => obj !== food);
                    playSound(sounds.eat);

                    setTimeout(() => {
                        gameState.hunger = Math.min(100, gameState.hunger + 20);
                        updateUI();

                        setTimeout(() => {
                            gameState.hunger = Math.min(100, gameState.hunger + 20);
                            playSound(sounds.eat);
                            updateUI();

                            setTimeout(() => {
                                gameState.isInteracting = false;
                                saveGame();
                            }, 1000);
                        }, 600);
                    }, 400);
                }
            }
        }
    };

    activeObjects.push(food);
}

function playWithTamagotchi() {
    if (!gameState.isAlive || gameState.isPaused || gameState.isSleeping || gameState.isInteracting) return;

    gameState.isInteracting = true;
    playSound(sounds.click);
    showMessage(`Played with ${gameState.petName}!`);

    const ballX = 80 + Math.random() * 140;
    const ballY = 240;

    // Create ball object
    const ball = {
        x: ballX,
        y: -10,
        targetY: ballY,
        landed: false,
        draw() {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        },
        update() {
            if (!this.landed && this.y < this.targetY) {
                this.y += 2;
            } else if (!this.landed) {
                this.landed = true;
                // Move Tamagotchi to ball
                tama.targetX = ballX;
                tama.targetY = ballY - 20;
            }

            // Check if Tamagotchi reached ball
            if (this.landed) {
                const dist = Math.sqrt(
                    Math.pow(tama.x - ballX, 2) +
                    Math.pow(tama.y - (ballY - 20), 2)
                );

                if (dist < 10) {
                    // Remove ball from active objects
                    activeObjects = activeObjects.filter(obj => obj !== ball);
                    playSound(sounds.play);

                    setTimeout(() => {
                        gameState.happiness = Math.min(100, gameState.happiness + 20);
                        gameState.hunger = Math.max(0, gameState.hunger - 2);
                        updateUI();

                        setTimeout(() => {
                            gameState.happiness = Math.min(100, gameState.happiness + 20);
                            gameState.hunger = Math.max(0, gameState.hunger - 3);
                            playSound(sounds.play);
                            updateUI();

                            setTimeout(() => {
                                gameState.isInteracting = false;
                                saveGame();
                            }, 1000);
                        }, 700);
                    }, 400);
                }
            }
        }
    };

    activeObjects.push(ball);
}

function cleanTamagotchi() {
    if (!gameState.isAlive || gameState.isPaused || gameState.isSleeping || gameState.isInteracting) return;

    if (gameState.poops.length > 0) {
        gameState.isInteracting = true;
        playSound(sounds.clean);
        showMessage('Cleaned up!');

        gameState.poops = [];
        gameState.health = Math.min(100, gameState.health + 15);
        updateUI();

        setTimeout(() => {
            gameState.health = Math.min(100, gameState.health + 15);
            updateUI();

            setTimeout(() => {
                gameState.isInteracting = false;
                saveGame();
            }, 800);
        }, 600);
    } else {
        showMessage('Nothing to clean!');
    }
}

function healTamagotchi() {
    if (!gameState.isAlive || gameState.isPaused || gameState.isSleeping || gameState.isInteracting) return;

    if (gameState.isSick) {
        gameState.isInteracting = true;
        gameState.isSick = false;
        playSound(sounds.heal);
        showMessage(`Healed ${gameState.petName}!`);

        gameState.health = Math.min(100, gameState.health + 25);
        updateUI();

        setTimeout(() => {
            gameState.health = Math.min(100, gameState.health + 25);
            updateUI();

            setTimeout(() => {
                gameState.isInteracting = false;
                saveGame();
            }, 800);
        }, 600);
    } else {
        showMessage(`${gameState.petName} is healthy!`);
    }
}

// ==========================================
// UI FUNCTIONS
// ==========================================

function updateUI() {
    document.getElementById('hunger-fill').style.width = gameState.hunger + '%';
    document.getElementById('happiness-fill').style.width = gameState.happiness + '%';
    document.getElementById('health-fill').style.width = gameState.health + '%';

    const days = Math.floor(gameState.age / 86400);
    const hours = Math.floor((gameState.age % 86400) / 3600);
    const minutes = Math.floor((gameState.age % 3600) / 60);
    document.getElementById('pet-age').textContent = `AGE: ${days}d ${hours}h ${minutes}m`;
    document.getElementById('pet-stage').textContent = gameState.stage.toUpperCase();
    document.getElementById('pet-name').textContent = gameState.petName;
}

function showMessage(msg) {
    const msgEl = document.getElementById('status-message');
    msgEl.textContent = msg;
    setTimeout(() => {
        msgEl.textContent = '';
    }, 2000);
}

function saveGame() {
    const data = {
        hunger: gameState.hunger,
        happiness: gameState.happiness,
        health: gameState.health,
        age: gameState.age,
        stage: gameState.stage,
        isSick: gameState.isSick,
        isAlive: gameState.isAlive,
        birthTime: gameState.birthTime,
        pausedTime: gameState.pausedTime,
        isPaused: gameState.isPaused,
        petName: gameState.petName,
        lastSave: Date.now()
    };
    localStorage.setItem('tamagotchi', JSON.stringify(data));
}

function loadGame() {
    const saved = localStorage.getItem('tamagotchi');
    if (saved) {
        const data = JSON.parse(saved);

        if (!data.isPaused) {
            const timePassed = Math.floor((Date.now() - data.lastSave) / 1000);
            gameState.hunger = Math.max(0, data.hunger - timePassed * 0.2);
            gameState.happiness = Math.max(0, data.happiness - (timePassed * 0.1));
            gameState.health = Math.max(0, data.health - (timePassed * 0.1));
        } else {
            gameState.hunger = data.hunger;
            gameState.happiness = data.happiness;
            gameState.health = data.health;
        }

        gameState.age = data.age;
        gameState.stage = data.stage;
        gameState.isSick = data.isSick;
        gameState.isAlive = data.isAlive;
        gameState.birthTime = data.birthTime;
        gameState.pausedTime = data.pausedTime || 0;
        gameState.isPaused = data.isPaused || false;
        gameState.petName = data.petName || 'TAMA';

        document.getElementById('pet-name').textContent = gameState.petName;

        if (gameState.isPaused) {
            document.getElementById('pause-icon').textContent = '▶';
            document.getElementById('pause-label').textContent = 'RESUME';
        }

        updateUI();
    } else {
        showNameModal();
    }
}

// ==========================================
// BUTTON HANDLERS
// ==========================================

document.getElementById('feed-btn').addEventListener('click', feedTamagotchi);
document.getElementById('play-btn').addEventListener('click', playWithTamagotchi);
document.getElementById('clean-btn').addEventListener('click', cleanTamagotchi);
document.getElementById('medicine-btn').addEventListener('click', healTamagotchi);

document.getElementById('pause-btn').addEventListener('click', () => {
    gameState.isPaused = !gameState.isPaused;
    const pauseIcon = document.getElementById('pause-icon');
    const pauseLabel = document.getElementById('pause-label');

    if (gameState.isPaused) {
        pauseIcon.textContent = '▶';
        pauseLabel.textContent = 'RESUME';
        gameState.pauseStartTime = Date.now();
        showMessage('Game Paused');
    } else {
        pauseIcon.textContent = '⏸';
        pauseLabel.textContent = 'PAUSE';
        gameState.pausedTime += Date.now() - gameState.pauseStartTime;
        showMessage('Game Resumed');
    }
    saveGame();
});

document.getElementById('new-game-btn').addEventListener('click', () => {
    if (confirm('Start a new game? Current progress will be lost.')) {
        localStorage.removeItem('tamagotchi');
        location.reload();
    }
});

// ==========================================
// NAME MODAL
// ==========================================

function showNameModal() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('pet-name-input');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    input.value = '';
    input.focus();
}

function submitName() {
    const input = document.getElementById('pet-name-input');
    const name = input.value.trim();

    if (name.length > 0) {
        gameState.petName = name.toUpperCase().substring(0, 12);
        document.getElementById('pet-name').textContent = gameState.petName;
        const modal = document.getElementById('name-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        saveGame();
    } else {
        alert('Please enter a name for your Tamagotchi!');
    }
}

document.getElementById('name-submit-btn').addEventListener('click', submitName);
document.getElementById('pet-name-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitName();
});

// ==========================================
// START GAME
// ==========================================

loadGame();
