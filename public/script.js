// ==========================================
// TAMAGOTCHI GAME - Vanilla Canvas + Sound
// ==========================================

const canvas = document.createElement('canvas');
canvas.width = 250;
canvas.height = 250;
canvas.style.imageRendering = 'pixelated'; // Pixel-perfect rendering for retro aesthetic
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for crisp pixels

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
            audio.play().catch(err => console.log('Audio play blocked:', err));
            console.log('Sound played');
        } else {
            console.error('jsfxr library not loaded!');
        }
    } catch(e) {
        console.error('Sound play failed:', e);
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
            console.log('Initializing background music...');
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
            console.log('Background music started!');
        } else if (typeof TinyMusic === 'undefined') {
            console.error('TinyMusic library not loaded!');
        }
    } catch(e) {
        console.error('Music init failed:', e);
    }
}

// Start music on first user interaction
document.addEventListener('click', () => {
    if (!musicStarted) {
        console.log('First click detected, starting music...');
        initMusic();
    }
}, { once: true });

// Check if libraries loaded
window.addEventListener('load', () => {
    console.log('jsfxr loaded:', typeof jsfxr !== 'undefined');
    console.log('TinyMusic loaded:', typeof TinyMusic !== 'undefined');
});

// ==========================================
// SPRITE LOADING
// ==========================================
const sprites = {
    egg: null,
    baby: {},
    child: {},
    adult: {},
    items: {} // Item sprites (apple, ball, poop, pill, heart)
};

let spritesLoaded = false;

function loadSprites() {
    // Base path for assets (works in dev and production)
    const basePath = import.meta.env.BASE_URL || './';
    const spriteLoadPromises = [];

    // Load egg
    const eggImg = new Image();
    eggImg.src = `${basePath}assets/sprites/tamagotchi/egg/egg-idle.png`;
    spriteLoadPromises.push(new Promise(resolve => {
        eggImg.onload = () => {
            sprites.egg = eggImg;
            resolve();
        };
    }));

    // Load baby sprites
    const babyFrames = ['idle-1', 'idle-2', 'idle-3', 'idle-4', 'blink-1', 'blink-2', 'blink-3',
                        'eat-1', 'eat-2', 'eat-3', 'eat-4', 'happy', 'neutral', 'sad'];
    babyFrames.forEach(frame => {
        const img = new Image();
        img.src = `${basePath}assets/sprites/tamagotchi/baby/${frame}.png`;
        spriteLoadPromises.push(new Promise(resolve => {
            img.onload = () => {
                sprites.baby[frame] = img;
                resolve();
            };
        }));
    });

    // Load child sprites
    const childFrames = ['idle-1', 'idle-2', 'idle-3', 'idle-4', 'blink-1', 'blink-2', 'blink-3',
                         'eat-1', 'eat-2', 'eat-3', 'eat-4', 'happy', 'neutral', 'sad'];
    childFrames.forEach(frame => {
        const img = new Image();
        img.src = `${basePath}assets/sprites/tamagotchi/child/${frame}.png`;
        spriteLoadPromises.push(new Promise(resolve => {
            img.onload = () => {
                sprites.child[frame] = img;
                resolve();
            };
        }));
    });

    // Load adult sprites
    const adultFrames = ['idle-1', 'idle-2', 'idle-3', 'idle-4', 'blink-1', 'blink-2', 'blink-3',
                         'eat-1', 'eat-2', 'eat-3', 'eat-4', 'happy', 'neutral', 'sad'];
    adultFrames.forEach(frame => {
        const img = new Image();
        img.src = `${basePath}assets/sprites/tamagotchi/adult/${frame}.png`;
        spriteLoadPromises.push(new Promise(resolve => {
            img.onload = () => {
                sprites.adult[frame] = img;
                resolve();
            };
        }));
    });

    // Load item sprites
    const itemNames = ['burger', 'ball', 'poop', 'pill', 'heart'];
    itemNames.forEach(itemName => {
        const img = new Image();
        img.src = `${basePath}assets/sprites/items/${itemName}.png`;
        spriteLoadPromises.push(new Promise(resolve => {
            img.onload = () => {
                sprites.items[itemName] = img;
                resolve();
            };
        }));
    });

    // Wait for all sprites to load
    Promise.all(spriteLoadPromises).then(() => {
        console.log('✓ All sprites loaded!');
        spritesLoaded = true;
    });
}

// Load sprites on page load
loadSprites();

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
    x: 125,
    y: 125,
    targetX: 125,
    targetY: 125,
    frame: 0,
    facingRight: true,
    isBlinking: false,
    mouthOpen: false,
    showHeart: false,
    heartTimer: 0,
    bounce: 0,
    squish: 1,
};

// Active objects (food, balls, etc.)
let activeObjects = [];

// ==========================================
// DRAWING FUNCTIONS
// ==========================================

function drawTamagotchi() {
    // Wait for sprites to load
    if (!spritesLoaded) return;

    const cx = tama.x;
    const cy = tama.y + tama.bounce;

    ctx.save();
    ctx.translate(cx, cy);
    if (!tama.facingRight) {
        ctx.scale(-1, 1);
    }

    // Determine which sprite to render
    let sprite = null;

    if (gameState.stage === 'egg') {
        sprite = sprites.egg;
    } else {
        const stageSprites = sprites[gameState.stage]; // baby/child/adult

        if (tama.mouthOpen) {
            // Eating animation
            const eatFrame = Math.floor(Date.now() / 200) % 4 + 1;
            sprite = stageSprites[`eat-${eatFrame}`];
        } else if (tama.isBlinking) {
            // Blinking animation
            const blinkFrame = Math.floor(Date.now() / 100) % 3 + 1;
            sprite = stageSprites[`blink-${blinkFrame}`];
        } else {
            // Show mood-based sprite or idle animation
            const avgStat = (gameState.hunger + gameState.happiness + gameState.health) / 3;
            const mood = avgStat >= 70 ? 'happy' : avgStat >= 40 ? 'neutral' : 'sad';

            if (stageSprites[mood]) {
                sprite = stageSprites[mood];
            } else {
                // Fallback to idle animation
                const idleFrame = Math.floor(Date.now() / 150) % 4 + 1;
                sprite = stageSprites[`idle-${idleFrame}`];
            }
        }
    }

    // Render sprite (scaled 2.5x to match original size)
    if (sprite) {
        const scale = 2.5;
        const w = sprite.width * scale * tama.squish;
        const h = sprite.height * scale / tama.squish;
        ctx.drawImage(sprite, -w/2, -h/2, w, h);
    }

    ctx.restore();

    // Draw smooth heart with particles
    if (tama.showHeart) {
        ctx.save();
        ctx.translate(cx, cy);

        // Floating animation
        const floatY = -50 + Math.sin(tama.heartTimer / 20) * 3;
        ctx.translate(10, floatY);

        // Speech bubble with shadow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect(-15, -15, 35, 30, 10);
        ctx.fill();

        // Bubble tail
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(-15, 15);
        ctx.lineTo(-8, 12);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Pixel art heart sprite
        if (sprites.items.heart) {
            const heartScale = 0.6 + Math.sin(tama.heartTimer / 10) * 0.1;
            ctx.save();
            ctx.scale(heartScale, heartScale);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprites.items.heart, -24, -24, 48, 48);
            ctx.restore();
        }

        ctx.restore();
    }
}

function drawPoop(poop) {
    if (sprites.items.poop) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprites.items.poop, poop.x - 24, poop.y - 24, 48, 48);
        ctx.restore();
    }
}

// Idle bounce animation
setInterval(() => {
    if (!gameState.isPaused && gameState.stage !== 'egg') {
        anime({
            targets: tama,
            bounce: [
                { value: -5, duration: 300, easing: 'easeOutQuad' },
                { value: 0, duration: 300, easing: 'easeInQuad' }
            ],
            duration: 600
        });
    }
}, 3000);

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
    // Sort by zIndex to control draw order (higher zIndex draws in front)
    const sortedObjects = [...activeObjects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    activeObjects.forEach(obj => {
        if (obj.update) obj.update();
    });

    sortedObjects.forEach(obj => {
        if (obj.draw) obj.draw();
    });

    // Update Tamagotchi movement (allow movement during interactions)
    if (!gameState.isPaused && gameState.stage !== 'egg') {
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

    // Update heart timer
    if (tama.heartTimer > 0) {
        tama.heartTimer--;
        if (tama.heartTimer === 0) {
            tama.showHeart = false;
        }
    }

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
        tama.targetX = 50 + Math.random() * 150;
        tama.targetY = 80 + Math.random() * 120;
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
            x: 50 + Math.random() * 150,
            y: 190 + Math.random() * 40
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

    if (gameState.stage === 'egg' && ageInSeconds >= 10) {
        evolve('baby');
    } else if (gameState.stage === 'baby' && ageInSeconds >= 30) {
        evolve('child');
    } else if (gameState.stage === 'child' && ageInSeconds >= 60) {
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

    const foodX = 70 + Math.random() * 110;
    const foodY = 200;

    // Create food object
    const food = {
        x: foodX,
        y: -10,
        targetY: foodY,
        landed: false,
        draw() {
            if (sprites.items.burger) {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(sprites.items.burger, this.x - 24, this.y - 24, 48, 48);
                ctx.restore();
            }
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

                    // First bite with squish - mouth opens
                    tama.mouthOpen = true;
                    playSound(sounds.eat);
                    anime({
                        targets: tama,
                        squish: [
                            { value: 0.9, duration: 150, easing: 'easeOutQuad' },
                            { value: 1, duration: 150, easing: 'easeInQuad' }
                        ]
                    });

                    setTimeout(() => {
                        // Close mouth
                        tama.mouthOpen = false;
                        gameState.hunger = Math.min(100, gameState.hunger + 20);
                        updateUI();

                        setTimeout(() => {
                            // Second bite with squish - mouth opens again
                            tama.mouthOpen = true;
                            playSound(sounds.eat);
                            gameState.hunger = Math.min(100, gameState.hunger + 20);
                            updateUI();
                            anime({
                                targets: tama,
                                squish: [
                                    { value: 0.9, duration: 150, easing: 'easeOutQuad' },
                                    { value: 1, duration: 150, easing: 'easeInQuad' }
                                ]
                            });

                            setTimeout(() => {
                                // Close mouth and show heart
                                tama.mouthOpen = false;
                                tama.showHeart = true;
                                tama.heartTimer = 120; // Show for ~2 seconds at 60fps

                                setTimeout(() => {
                                    gameState.isInteracting = false;
                                    saveGame();
                                }, 800);
                            }, 300);
                        }, 400);
                    }, 300);
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

    const ballX = 70 + Math.random() * 110;
    const ballY = 200;

    // Create ball object
    const ball = {
        x: ballX,
        y: -10,
        targetY: ballY,
        landed: false,
        playing: false,
        bounceCount: 0,
        bounceY: 0,
        bounceVelocity: -4,
        zIndex: 10, // Render in front of Tamagotchi
        draw() {
            if (sprites.items.ball) {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(sprites.items.ball, this.x - 24, this.y - 24, 48, 48);
                ctx.restore();
            }
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
            if (this.landed && !this.playing) {
                const dist = Math.sqrt(
                    Math.pow(tama.x - ballX, 2) +
                    Math.pow(tama.y - (ballY - 20), 2)
                );

                if (dist < 10) {
                    this.playing = true;
                    playSound(sounds.play);
                    gameState.happiness = Math.min(100, gameState.happiness + 20);
                    gameState.hunger = Math.max(0, gameState.hunger - 2);
                    updateUI();
                }
            }

            // Ball bouncing animation
            if (this.playing) {
                this.bounceY += this.bounceVelocity;
                this.bounceVelocity += 0.3; // Gravity
                this.y = this.targetY + this.bounceY;

                // Bounce when hitting ground
                if (this.y >= this.targetY && this.bounceVelocity > 0) {
                    this.y = this.targetY;
                    this.bounceVelocity = -4 + (this.bounceCount * 0.3); // Gradually smaller bounces
                    this.bounceCount++;

                    // Add happiness every 2 bounces
                    if (this.bounceCount % 2 === 0) {
                        playSound(sounds.play);
                        gameState.happiness = Math.min(100, gameState.happiness + 15);
                        gameState.hunger = Math.max(0, gameState.hunger - 2);
                        updateUI();
                    }

                    // Stop after 7 bounces
                    if (this.bounceCount >= 7) {
                        activeObjects = activeObjects.filter(obj => obj !== ball);
                        tama.showHeart = true;
                        tama.heartTimer = 120;

                        setTimeout(() => {
                            gameState.isInteracting = false;
                            saveGame();
                        }, 1000);
                    }
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

            // Show heart
            tama.showHeart = true;
            tama.heartTimer = 120;

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

        // Create floating pill visual
        const pill = {
            x: tama.x,
            y: tama.y - 30,
            opacity: 1,
            floatY: 0,
            draw() {
                if (sprites.items.pill) {
                    ctx.save();
                    ctx.globalAlpha = this.opacity;
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(sprites.items.pill, this.x - 24, this.y + this.floatY - 24, 48, 48);
                    ctx.restore();
                }
            },
            update() {
                this.floatY -= 0.5; // Float upward
                this.opacity -= 0.02; // Fade out
                if (this.opacity <= 0) {
                    activeObjects = activeObjects.filter(obj => obj !== pill);
                }
            }
        };
        activeObjects.push(pill);

        gameState.health = Math.min(100, gameState.health + 25);
        updateUI();

        setTimeout(() => {
            gameState.health = Math.min(100, gameState.health + 25);
            updateUI();

            // Show heart
            tama.showHeart = true;
            tama.heartTimer = 120;

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
