// ==========================================
// TAMAGOTCHI GAME - Kaboom.js + jsfxr + TinyMusic
// ==========================================

// Initialize Kaboom after DOM is ready
let k;

function initKaboom() {
    const container = document.getElementById('game-container');

    if (!container) {
        console.error('Game container not found!');
        return null;
    }

    if (typeof kaboom === 'undefined') {
        console.error('Kaboom library not loaded!');
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Kaboom library failed to load. Please refresh.</div>';
        return null;
    }

    try {
        k = kaboom({
            global: false,
            width: 300,
            height: 300,
            background: [200, 230, 201], // Light green background
            crisp: true, // Pixel-perfect rendering
        });

        // Style the canvas
        k.canvas.style.display = 'block';
        k.canvas.style.imageRendering = 'pixelated';
        k.canvas.style.imageRendering = 'crisp-edges';

        // Clear container and append canvas
        container.innerHTML = '';
        container.appendChild(k.canvas);

        console.log('Kaboom initialized successfully');
        return k;
    } catch (error) {
        console.error('Failed to initialize Kaboom:', error);
        // Fallback message
        container.innerHTML = '<div style="padding: 20px; text-align: center;">Failed to load game. Please refresh the page.</div>';
        return null;
    }
}

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
        const audio = jsfxr(soundArray);
        audio.play();
    } catch(e) {
        console.log('Sound play failed:', e);
    }
}

// ==========================================
// BACKGROUND MUSIC (TinyMusic)
// ==========================================
let bgMusic = null;

function initMusic() {
    try {
        if (typeof TinyMusic !== 'undefined') {
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
        }
    } catch(e) {
        console.log('Music init failed:', e);
    }
}

// Start music after user interaction
let musicStarted = false;
document.addEventListener('click', () => {
    if (!musicStarted) {
        initMusic();
        musicStarted = true;
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

// ==========================================
// SPRITE DEFINITIONS (Pixel Art)
// ==========================================

// Define colors for each stage
const colors = {
    egg: { primary: [168, 216, 234], secondary: [170, 150, 218], accent: [252, 186, 211] },
    baby: { primary: [255, 182, 185], secondary: [250, 227, 217], accent: [255, 107, 157] },
    child: { primary: [146, 227, 169], secondary: [126, 196, 207], accent: [78, 205, 196] },
    adult: { primary: [255, 154, 86], secondary: [255, 205, 56], accent: [255, 94, 91] }
};

// Draw pixel art Tamagotchi
function drawTamagotchi(stage, frame, isBlinking) {
    const size = 10; // Pixel size
    const c = colors[stage];

    k.pushTransform();
    k.pushTranslate(k.vec2(-50, -50)); // Center the sprite

    // Draw based on stage
    if (stage === 'egg') {
        // Oval egg shape
        for (let dy = -12; dy <= 12; dy += size) {
            for (let dx = -10; dx <= 10; dx += size) {
                const dist = Math.sqrt((dx/10) * (dx/10) + (dy/14) * (dy/14));
                if (dist < 1.2) {
                    const color = dy < 0 ? c.primary : c.secondary;
                    k.drawRect({
                        pos: k.vec2(dx, dy),
                        width: size,
                        height: size,
                        color: k.rgb(color[0], color[1], color[2]),
                    });
                }
            }
        }
        // Spots
        k.drawRect({ pos: k.vec2(-6*size/10, -4*size/10), width: size, height: size, color: k.rgb(c.accent[0], c.accent[1], c.accent[2]) });
        k.drawRect({ pos: k.vec2(-2*size/10, -4*size/10), width: size, height: size, color: k.rgb(c.accent[0], c.accent[1], c.accent[2]) });
    } else {
        // Round body
        for (let dy = -12; dy <= 12; dy += size) {
            for (let dx = -12; dx <= 12; dx += size) {
                const dist = Math.sqrt(dx * dx + dy * dy) / size;
                if (dist < 2.5) {
                    k.drawRect({
                        pos: k.vec2(dx, dy),
                        width: size,
                        height: size,
                        color: k.rgb(c.primary[0], c.primary[1], c.primary[2]),
                    });
                }
            }
        }

        // Eyes
        if (!isBlinking) {
            k.drawRect({ pos: k.vec2(-size, -size), width: size*0.8, height: size*0.8, color: k.BLACK });
            k.drawRect({ pos: k.vec2(size*0.3, -size), width: size*0.8, height: size*0.8, color: k.BLACK });
        } else {
            k.drawRect({ pos: k.vec2(-size, -size*0.3), width: size, height: size*0.3, color: k.BLACK });
            k.drawRect({ pos: k.vec2(size*0.3, -size*0.3), width: size, height: size*0.3, color: k.BLACK });
        }

        // Smile
        k.drawRect({ pos: k.vec2(-size, size), width: size*3, height: size*0.6, color: k.BLACK });
    }

    k.popTransform();
}

// ==========================================
// GAME OBJECT: TAMAGOTCHI
// ==========================================

k.scene("game", () => {
    // Add Tamagotchi sprite
    const tama = k.add([
        k.pos(150, 150),
        k.anchor("center"),
        {
            frame: 0,
            isBlinking: false,
            targetPos: k.vec2(150, 150),
            facingRight: true,

            draw() {
                k.pushTransform();
                k.pushTranslate(this.pos);
                if (!this.facingRight) {
                    k.pushScale(k.vec2(-1, 1));
                }
                drawTamagotchi(gameState.stage, this.frame, this.isBlinking);
                k.popTransform();
            },

            update() {
                // Animation frame
                this.frame = (this.frame + 0.05) % 4;

                // Movement (only when not interacting)
                if (!gameState.isInteracting && !gameState.isPaused && gameState.stage !== 'egg') {
                    const dx = this.targetPos.x - this.pos.x;
                    const dy = this.targetPos.y - this.pos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 1) {
                        const speed = 0.5;
                        this.pos.x += (dx / dist) * speed;
                        this.pos.y += (dy / dist) * speed;
                        this.facingRight = dx > 0;
                    }
                }
            }
        }
    ]);

    // Random movement timer
    k.loop(3, () => {
        if (!gameState.isInteracting && !gameState.isPaused && gameState.stage !== 'egg') {
            tama.targetPos = k.vec2(
                60 + Math.random() * 180,
                100 + Math.random() * 150
            );
        }
    });

    // Random blink
    k.loop(2, () => {
        if (gameState.stage !== 'egg' && !gameState.isPaused) {
            tama.isBlinking = true;
            k.wait(0.2, () => {
                tama.isBlinking = false;
            });
        }
    });

    // Poop sprites
    const poops = [];

    k.loop(15, () => {
        if (!gameState.isPaused && gameState.stage !== 'egg' && poops.length < 3 && Math.random() < 0.4) {
            const poop = k.add([
                k.pos(60 + Math.random() * 180, 230 + Math.random() * 50),
                k.anchor("center"),
                {
                    draw() {
                        const s = 10;
                        k.pushTransform();
                        k.pushTranslate(this.pos);
                        k.drawRect({ pos: k.vec2(-7, 0), width: s, height: s, color: k.rgb(107, 83, 16) });
                        k.drawRect({ pos: k.vec2(4, 0), width: s, height: s, color: k.rgb(107, 83, 16) });
                        k.drawRect({ pos: k.vec2(-3, -10), width: s, height: s, color: k.rgb(139, 105, 20) });
                        k.popTransform();
                    }
                }
            ]);
            poops.push(poop);
            gameState.poops.push(poop);
        }
    });

    // Game loop - stats degradation
    k.loop(1, () => {
        if (gameState.isPaused || !gameState.isAlive || gameState.isSleeping) return;

        gameState.hunger = Math.max(0, gameState.hunger - 0.2);
        gameState.happiness = Math.max(0, gameState.happiness - 0.1);

        if (poops.length > 0) {
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
    });

    // Age update
    k.loop(1, () => {
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
    });

    // Evolution function
    function evolve(newStage) {
        gameState.stage = newStage;
        playSound(sounds.evolve);
        showMessage(`${gameState.petName} evolved to ${newStage.toUpperCase()}!`);

        // Particle effect
        for (let i = 0; i < 10; i++) {
            k.add([
                k.pos(tama.pos.x + (Math.random() - 0.5) * 100, tama.pos.y - 30),
                k.opacity(1),
                {
                    vy: -2 - Math.random() * 2,
                    life: 2,
                    update() {
                        this.pos.y += this.vy;
                        this.vy += 0.1;
                        this.life -= k.dt();
                        this.opacity = this.life / 2;
                        if (this.life <= 0) this.destroy();
                    },
                    draw() {
                        k.pushTransform();
                        k.pushTranslate(this.pos);
                        k.drawRect({ pos: k.vec2(-3, -3), width: 6, height: 6, color: k.rgb(255, 215, 0) });
                        k.popTransform();
                    }
                }
            ]);
        }
    }

    // Feed interaction
    window.feedTamagotchi = () => {
        if (!gameState.isAlive || gameState.isPaused || gameState.isSleeping || gameState.isInteracting) return;

        gameState.isInteracting = true;
        playSound(sounds.click);
        showMessage(`Fed ${gameState.petName}!`);

        const foodX = 80 + Math.random() * 140;
        const foodY = 240;

        // Drop food
        const food = k.add([
            k.pos(foodX, -10),
            k.anchor("center"),
            {
                targetY: foodY,
                vy: 1.5,
                update() {
                    if (this.pos.y < this.targetY) {
                        this.pos.y += this.vy;
                    }
                },
                draw() {
                    k.pushTransform();
                    k.pushTranslate(this.pos);
                    k.drawCircle({ pos: k.vec2(0, 0), radius: 8, color: k.rgb(139, 69, 19) });
                    k.popTransform();
                }
            }
        ]);

        // Wait for food to land, then Tamagotchi walks to it
        k.wait(2, () => {
            tama.targetPos = k.vec2(foodX, foodY - 20);

            // Check when Tamagotchi reaches food
            const checkArrival = k.loop(0.1, () => {
                const dist = Math.sqrt(
                    Math.pow(tama.pos.x - foodX, 2) +
                    Math.pow(tama.pos.y - (foodY - 20), 2)
                );

                if (dist < 10) {
                    checkArrival.cancel();
                    food.destroy();
                    playSound(sounds.eat);

                    // Eating animation
                    k.wait(0.4, () => {
                        gameState.hunger = Math.min(100, gameState.hunger + 20);
                        updateUI();

                        k.wait(0.6, () => {
                            gameState.hunger = Math.min(100, gameState.hunger + 20);
                            playSound(sounds.eat);
                            updateUI();

                            k.wait(1, () => {
                                gameState.isInteracting = false;
                                saveGame();
                            });
                        });
                    });
                }
            });
        });
    };

    // Play interaction
    window.playWithTamagotchi = () => {
        if (!gameState.isAlive || gameState.isPaused || gameState.isSleeping || gameState.isInteracting) return;

        gameState.isInteracting = true;
        playSound(sounds.click);
        showMessage(`Played with ${gameState.petName}!`);

        const ballX = 80 + Math.random() * 140;
        const ballY = 240;

        // Drop ball
        const ball = k.add([
            k.pos(ballX, -10),
            k.anchor("center"),
            {
                targetY: ballY,
                vy: 1.5,
                update() {
                    if (this.pos.y < this.targetY) {
                        this.pos.y += this.vy;
                    }
                },
                draw() {
                    k.pushTransform();
                    k.pushTranslate(this.pos);
                    k.drawCircle({ pos: k.vec2(0, 0), radius: 8, color: k.WHITE, outline: { color: k.BLACK, width: 2 } });
                    k.popTransform();
                }
            }
        ]);

        k.wait(2, () => {
            tama.targetPos = k.vec2(ballX, ballY - 20);

            const checkArrival = k.loop(0.1, () => {
                const dist = Math.sqrt(
                    Math.pow(tama.pos.x - ballX, 2) +
                    Math.pow(tama.pos.y - (ballY - 20), 2)
                );

                if (dist < 10) {
                    checkArrival.cancel();
                    ball.destroy();
                    playSound(sounds.play);

                    k.wait(0.4, () => {
                        gameState.happiness = Math.min(100, gameState.happiness + 20);
                        gameState.hunger = Math.max(0, gameState.hunger - 2);
                        updateUI();

                        k.wait(0.7, () => {
                            gameState.happiness = Math.min(100, gameState.happiness + 20);
                            gameState.hunger = Math.max(0, gameState.hunger - 3);
                            playSound(sounds.play);
                            updateUI();

                            k.wait(1, () => {
                                gameState.isInteracting = false;
                                saveGame();
                            });
                        });
                    });
                }
            });
        });
    };

    // Clean interaction
    window.cleanTamagotchi = () => {
        if (!gameState.isAlive || gameState.isPaused || gameState.isSleeping || gameState.isInteracting) return;

        if (poops.length > 0) {
            gameState.isInteracting = true;
            playSound(sounds.clean);
            showMessage('Cleaned up!');

            poops.forEach(p => p.destroy());
            poops.length = 0;
            gameState.poops = [];

            gameState.health = Math.min(100, gameState.health + 15);
            updateUI();

            k.wait(0.6, () => {
                gameState.health = Math.min(100, gameState.health + 15);
                updateUI();

                k.wait(0.8, () => {
                    gameState.isInteracting = false;
                    saveGame();
                });
            });
        } else {
            showMessage('Nothing to clean!');
        }
    };

    // Heal interaction
    window.healTamagotchi = () => {
        if (!gameState.isAlive || gameState.isPaused || gameState.isSleeping || gameState.isInteracting) return;

        if (gameState.isSick) {
            gameState.isInteracting = true;
            gameState.isSick = false;
            playSound(sounds.heal);
            showMessage(`Healed ${gameState.petName}!`);

            gameState.health = Math.min(100, gameState.health + 25);
            updateUI();

            k.wait(0.6, () => {
                gameState.health = Math.min(100, gameState.health + 25);
                updateUI();

                k.wait(0.8, () => {
                    gameState.isInteracting = false;
                    saveGame();
                });
            });
        } else {
            showMessage(`${gameState.petName} is healthy!`);
        }
    };
});

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
        k.go("game");
    } else {
        showNameModal();
    }
}

// ==========================================
// BUTTON HANDLERS
// ==========================================

function setupButtonHandlers() {
    document.getElementById('feed-btn').addEventListener('click', () => {
        if (window.feedTamagotchi) window.feedTamagotchi();
    });

    document.getElementById('play-btn').addEventListener('click', () => {
        if (window.playWithTamagotchi) window.playWithTamagotchi();
    });

    document.getElementById('clean-btn').addEventListener('click', () => {
        if (window.cleanTamagotchi) window.cleanTamagotchi();
    });

    document.getElementById('medicine-btn').addEventListener('click', () => {
        if (window.healTamagotchi) window.healTamagotchi();
    });

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

    document.getElementById('name-submit-btn').addEventListener('click', submitName);
    document.getElementById('pet-name-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitName();
    });
}

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
        k.go("game");
    } else {
        alert('Please enter a name for your Tamagotchi!');
    }
}

// ==========================================
// START GAME
// ==========================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}

function startGame() {
    console.log('Starting game...');

    const kaboomReady = initKaboom();

    if (!kaboomReady) {
        console.error('Kaboom failed to initialize');
        return;
    }

    setupButtonHandlers();
    loadGame();
}
