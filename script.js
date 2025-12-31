class Tamagotchi {
    constructor() {
        this.hunger = 100;
        this.happiness = 100;
        this.health = 100;
        this.age = 0;
        this.stage = 'egg';
        this.isDirty = false;
        this.isSick = false;
        this.isAlive = true;
        this.animationFrame = 0;
        this.birthTime = Date.now();
        this.isPaused = false;
        this.pausedTime = 0;
        this.isSleeping = false;
        this.petName = 'TAMA';

        this.x = 100;
        this.y = 100;
        this.targetX = 100;
        this.targetY = 100;
        this.facingRight = true;
        this.isBlinking = false;

        this.poops = [];
        this.particles = [];
        this.particleQueue = [];
        this.speechBubble = null;
        this.lastMood = 'neutral';
        this.isInteracting = false;
        this.interactionQueue = [];

        this.intervals = [];

        this.canvas = document.getElementById('petCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.colors = {
            egg: { primary: '#a8d8ea', secondary: '#aa96da', accent: '#fcbad3' },
            baby: { primary: '#ffb6b9', secondary: '#fae3d9', accent: '#ff6b9d' },
            child: { primary: '#92e3a9', secondary: '#7ec4cf', accent: '#4ecdc4' },
            adult: { primary: '#ff9a56', secondary: '#ffcd38', accent: '#ff5e5b' }
        };

        this.loadGame();
        this.init();
    }

    init() {
        this.updateUI();
        this.draw();

        this.intervals.push(setInterval(() => this.tick(), 1000));
        this.intervals.push(setInterval(() => this.updateAge(), 1000));
        this.intervals.push(setInterval(() => this.animate(), 300));
        this.intervals.push(setInterval(() => this.updateMovement(), 50));
        this.intervals.push(setInterval(() => this.randomMove(), 3000));
        this.intervals.push(setInterval(() => this.randomBlink(), 2000));
        this.intervals.push(setInterval(() => this.maybeSpawnPoop(), 15000));
        this.intervals.push(setInterval(() => this.checkMoodChange(), 2000));
        this.intervals.push(setInterval(() => this.spawnNextParticle(), 400));
        // Sleep mode disabled for testing
        // this.intervals.push(setInterval(() => this.checkSleepTime(), 1000));

        document.getElementById('feed-btn').addEventListener('click', () => this.feed());
        document.getElementById('play-btn').addEventListener('click', () => this.play());
        document.getElementById('clean-btn').addEventListener('click', () => this.clean());
        document.getElementById('medicine-btn').addEventListener('click', () => this.heal());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());

        const nameSubmitBtn = document.getElementById('name-submit-btn');
        const nameInput = document.getElementById('pet-name-input');

        nameSubmitBtn.addEventListener('click', () => this.submitName());
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitName();
        });
    }

    checkSleepTime() {
        const now = new Date();
        const hour = now.getHours();

        const shouldBeSleeping = hour >= 22 || hour < 8;

        if (shouldBeSleeping && !this.isSleeping) {
            this.isSleeping = true;
            this.showSleepIndicator(true);
            this.showMessage(`${this.petName} is sleeping... Zzz`);
        } else if (!shouldBeSleeping && this.isSleeping) {
            this.isSleeping = false;
            this.showSleepIndicator(false);
            this.showMessage(`${this.petName} woke up!`);
        }
    }

    showSleepIndicator(show) {
        const indicator = document.getElementById('sleep-indicator');
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    tick() {
        if (!this.isAlive || this.isPaused || this.isSleeping) return;

        this.hunger = Math.max(0, this.hunger - 0.2);
        this.happiness = Math.max(0, this.happiness - 0.1);

        if (this.poops.length > 0) {
            this.health = Math.max(0, this.health - 0.5);
        }

        if (this.hunger < 30 || this.happiness < 30) {
            this.health = Math.max(0, this.health - 0.1);
        }

        if (this.health < 30 && !this.isSick) {
            this.isSick = true;
            this.showMessage(`${this.petName} is sick!`);
        }

        if ((this.hunger === 0 || this.health === 0) && this.stage !== 'egg' && this.stage !== 'baby') {
            this.die();
        }

        this.updateUI();
        this.saveGame();
    }

    updateAge() {
        if (!this.isAlive || this.isPaused) return;

        const ageInSeconds = Math.floor((Date.now() - this.birthTime - this.pausedTime) / 1000);
        this.age = ageInSeconds;

        if (this.stage === 'egg' && ageInSeconds >= 300) {
            this.evolve('baby');
        } else if (this.stage === 'baby' && ageInSeconds >= 3900) {
            this.evolve('child');
        } else if (this.stage === 'child' && ageInSeconds >= 25200) {
            this.evolve('adult');
        }

        this.updateUI();
    }

    evolve(newStage) {
        this.stage = newStage;
        this.showMessage(`${this.petName} evolved to ${newStage.toUpperCase()}!`);
        this.createParticles(this.x, this.y - 20, '★', 4, 'fall');
        this.showSpeechBubble('🎉');
    }

    animate() {
        if (!this.isPaused) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.updateParticles();
        }
        this.draw();
    }

    randomMove() {
        if (!this.isAlive || this.stage === 'egg' || this.isPaused || this.isSleeping || this.isInteracting) return;

        this.targetX = 40 + Math.random() * 120;
        this.targetY = 70 + Math.random() * 100;
    }

    updateMovement() {
        if (!this.isAlive || this.stage === 'egg' || this.isPaused || this.isSleeping || this.isInteracting) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const speed = 0.5;
            this.x += (dx / distance) * speed;
            this.y += (dy / distance) * speed;
            this.facingRight = dx > 0;
        }
    }

    randomBlink() {
        if (!this.isAlive || this.stage === 'egg' || this.isPaused) return;

        this.isBlinking = true;
        setTimeout(() => {
            this.isBlinking = false;
        }, 200);
    }

    maybeSpawnPoop() {
        if (!this.isAlive || this.stage === 'egg' || this.poops.length >= 3 || this.isPaused || this.isSleeping) return;

        if (Math.random() < 0.4) {
            this.poops.push({
                x: 40 + Math.random() * 120,
                y: 150 + Math.random() * 40
            });
        }
    }

    createParticles(x, y, emoji, count, type = 'fall') {
        for (let i = 0; i < count; i++) {
            if (type === 'fall') {
                this.particleQueue.push({
                    x: 100,
                    y: -10,
                    vx: 0,
                    vy: 1.5,
                    life: 80,
                    emoji: emoji,
                    targetY: y
                });
            } else {
                this.particleQueue.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 1,
                    life: 60,
                    emoji: emoji
                });
            }
        }
    }

    spawnNextParticle() {
        if (this.particleQueue.length > 0 && !this.isPaused) {
            this.particles.push(this.particleQueue.shift());
        }
    }

    showSpeechBubble(emoji) {
        this.speechBubble = {
            emoji: emoji,
            life: 120
        };
    }

    checkMoodChange() {
        if (!this.isAlive || this.isPaused || this.stage === 'egg' || this.isSleeping) return;

        const currentMood = this.getMood();
        if (currentMood !== this.lastMood) {
            const moodEmojis = {
                'happy': '😊',
                'sad': '😢',
                'hungry': '😋',
                'sick': '🤢',
                'bored': '😐'
            };
            if (moodEmojis[currentMood]) {
                this.showSpeechBubble(moodEmojis[currentMood]);
            }
            this.lastMood = currentMood;
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.targetY !== undefined) {
                if (p.y < p.targetY) {
                    p.vy += 0.05;
                } else {
                    p.vy *= 0.95;
                }
            } else {
                p.vy += 0.1;
            }

            p.life--;
            return p.life > 0 && p.y < 130;
        });

        if (this.speechBubble) {
            this.speechBubble.life--;
            if (this.speechBubble.life <= 0) {
                this.speechBubble = null;
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseIcon = document.getElementById('pause-icon');
        const pauseLabel = document.getElementById('pause-label');

        if (this.isPaused) {
            pauseIcon.textContent = '▶';
            pauseLabel.textContent = 'RESUME';
            this.pauseStartTime = Date.now();
            this.showMessage('Game Paused');
        } else {
            pauseIcon.textContent = '⏸';
            pauseLabel.textContent = 'PAUSE';
            this.pausedTime += Date.now() - this.pauseStartTime;
            this.showMessage('Game Resumed');
        }
        this.saveGame();
    }

    newGame() {
        if (confirm('Start a new game? Current progress will be lost.')) {
            localStorage.removeItem('tamagotchi');
            this.showNameModal();
        }
    }

    showNameModal() {
        const modal = document.getElementById('name-modal');
        const input = document.getElementById('pet-name-input');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        input.value = '';
        input.focus();
    }

    submitName() {
        const input = document.getElementById('pet-name-input');
        const name = input.value.trim();

        if (name.length > 0) {
            this.petName = name.toUpperCase().substring(0, 12);
            document.getElementById('pet-name').textContent = this.petName;
            const modal = document.getElementById('name-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            this.saveGame();
        } else {
            alert('Please enter a name for your Tamagotchi!');
        }
    }

    feed() {
        if (!this.isAlive || this.isPaused || this.isSleeping || this.isInteracting) return;

        this.isInteracting = true;
        this.showMessage(`Fed ${this.petName}!`);

        // Drop food particle slowly
        this.createParticles(this.x, this.y, '●', 1, 'fall');

        // Wait for food to arrive, then eat
        setTimeout(() => {
            this.showSpeechBubble('😋');
            // First bite
            setTimeout(() => {
                this.hunger = Math.min(100, this.hunger + 20);
                this.updateUI();
                // Second bite
                setTimeout(() => {
                    this.hunger = Math.min(100, this.hunger + 20);
                    this.updateUI();
                    // Finish interaction
                    setTimeout(() => {
                        this.isInteracting = false;
                        this.saveGame();
                    }, 800);
                }, 600);
            }, 400);
        }, 1200);
    }

    play() {
        if (!this.isAlive || this.isPaused || this.isSleeping || this.isInteracting) return;

        this.isInteracting = true;
        this.showMessage(`Played with ${this.petName}!`);

        // Drop ball
        this.createParticles(this.x, this.y, '○', 1, 'fall');

        // Wait for ball to arrive, then play
        setTimeout(() => {
            this.showSpeechBubble('😄');
            this.happiness = Math.min(100, this.happiness + 20);
            this.hunger = Math.max(0, this.hunger - 2);
            this.updateUI();
            // Continue playing
            setTimeout(() => {
                this.happiness = Math.min(100, this.happiness + 20);
                this.hunger = Math.max(0, this.hunger - 3);
                this.updateUI();
                // Finish interaction
                setTimeout(() => {
                    this.isInteracting = false;
                    this.saveGame();
                }, 800);
            }, 700);
        }, 1200);
    }

    clean() {
        if (!this.isAlive || this.isPaused || this.isSleeping || this.isInteracting) return;

        if (this.poops.length > 0) {
            this.isInteracting = true;
            this.showMessage('Cleaned up!');

            // Cleaning sparkles
            this.createParticles(this.x, this.y - 20, '✦', 2, 'fall');

            setTimeout(() => {
                this.poops = [];
                this.health = Math.min(100, this.health + 15);
                this.updateUI();
                this.showSpeechBubble('😌');
                setTimeout(() => {
                    this.health = Math.min(100, this.health + 15);
                    this.updateUI();
                    setTimeout(() => {
                        this.isInteracting = false;
                        this.saveGame();
                    }, 800);
                }, 600);
            }, 1200);
        } else {
            this.showMessage('Nothing to clean!');
        }
    }

    heal() {
        if (!this.isAlive || this.isPaused || this.isSleeping || this.isInteracting) return;

        if (this.isSick) {
            this.isInteracting = true;
            this.isSick = false;
            this.showMessage(`Healed ${this.petName}!`);

            // Medicine drop
            this.createParticles(this.x, this.y, '+', 1, 'fall');

            setTimeout(() => {
                this.showSpeechBubble('😊');
                this.health = Math.min(100, this.health + 25);
                this.updateUI();
                setTimeout(() => {
                    this.health = Math.min(100, this.health + 25);
                    this.updateUI();
                    setTimeout(() => {
                        this.isInteracting = false;
                        this.saveGame();
                    }, 800);
                }, 600);
            }, 1200);
        } else {
            this.showMessage(`${this.petName} is healthy!`);
        }
    }

    die() {
        this.isAlive = false;
        this.showMessage(`${this.petName} has died... Click New Game to restart.`);
        this.draw();
    }

    showMessage(msg) {
        const msgEl = document.getElementById('status-message');
        msgEl.textContent = msg;
        setTimeout(() => {
            msgEl.textContent = '';
        }, 2000);
    }

    updateUI() {
        document.getElementById('hunger-fill').style.width = this.hunger + '%';
        document.getElementById('happiness-fill').style.width = this.happiness + '%';
        document.getElementById('health-fill').style.width = this.health + '%';

        const days = Math.floor(this.age / 86400);
        const hours = Math.floor((this.age % 86400) / 3600);
        const minutes = Math.floor((this.age % 3600) / 60);
        document.getElementById('pet-age').textContent = `AGE: ${days}d ${hours}h ${minutes}m`;
        document.getElementById('pet-stage').textContent = this.stage.toUpperCase();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.poops.forEach(poop => this.drawPoop(poop.x, poop.y));

        if (!this.isAlive) {
            this.drawDead();
        } else {
            switch(this.stage) {
                case 'egg':
                    this.drawEgg();
                    break;
                case 'baby':
                    this.drawBaby();
                    break;
                case 'child':
                    this.drawChild();
                    break;
                case 'adult':
                    this.drawAdult();
                    break;
            }

            if (this.isSick) {
                this.drawSickIcon();
            }
        }

        this.particles.forEach(p => this.drawParticle(p));

        if (this.speechBubble) {
            this.drawSpeechBubble();
        }
    }

    drawSpeechBubble() {
        const bubbleX = this.x + 42;
        const bubbleY = this.y - 50;
        const bubbleWidth = 50;
        const bubbleHeight = 42;

        this.ctx.save();
        const alpha = Math.min(1, this.speechBubble.life / 30);
        this.ctx.globalAlpha = alpha;

        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(bubbleX, bubbleY + bubbleHeight - 8);
        this.ctx.lineTo(bubbleX - 8, bubbleY + bubbleHeight + 8);
        this.ctx.lineTo(bubbleX + 8, bubbleY + bubbleHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = '30px Arial';
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillText(this.speechBubble.emoji, bubbleX + 10, bubbleY + 32);

        this.ctx.restore();
    }

    getMood() {
        if (this.isSick) return 'sick';
        if (this.hunger < 30) return 'hungry';
        if (this.happiness < 30) return 'bored';
        if (this.happiness > 70 && this.hunger > 70) return 'happy';
        return 'neutral';
    }

    drawColoredPixel(x, y, color, size = 7) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, size, size);
    }

    drawEgg() {
        const colors = this.colors.egg;
        const bounce = this.animationFrame < 2 ? 0 : 2;
        const cx = this.x;
        const cy = this.y + bounce;

        for (let dy = -12; dy <= 12; dy += 4) {
            for (let dx = -10; dx <= 10; dx += 4) {
                const dist = Math.sqrt(dx * dx + dy * dy * 1.5);
                if (dist < 14) {
                    const color = dy < 0 ? colors.primary : colors.secondary;
                    this.drawColoredPixel(cx + dx, cy + dy, color);
                }
            }
        }

        this.drawColoredPixel(cx - 6, cy - 4, colors.accent);
        this.drawColoredPixel(cx - 2, cy - 4, colors.accent);
    }

    drawBaby() {
        const colors = this.colors.baby;
        const mood = this.getMood();
        const bounce = this.isSleeping ? 0 : Math.sin(this.animationFrame * Math.PI / 2) * 2;
        const cx = this.x;
        const cy = this.y + bounce;

        this.ctx.save();
        if (!this.facingRight) {
            this.ctx.translate(this.canvas.width, 0);
            this.ctx.scale(-1, 1);
        }

        const drawX = this.facingRight ? cx : this.canvas.width - cx;

        for (let dy = -8; dy <= 8; dy += 4) {
            for (let dx = -8; dx <= 8; dx += 4) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 12) {
                    this.drawColoredPixel(drawX + dx, cy + dy, colors.primary);
                }
            }
        }

        if (this.isSleeping || this.isBlinking) {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 5, cy - 1, 4, 1);
            this.ctx.fillRect(drawX + 3, cy - 1, 4, 1);

            if (this.isSleeping) {
                this.ctx.font = '20px Arial';
                this.ctx.fillText('Z', drawX + 20, cy - 13);
                this.ctx.fillText('z', drawX + 30, cy - 20);
            }
        } else {
            this.drawColoredPixel(drawX - 4, cy - 2, '#2c3e50', 3);
            this.drawColoredPixel(drawX + 4, cy - 2, '#2c3e50', 3);
        }

        if (mood === 'happy') {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 3, cy + 4, 6, 2);
            this.drawColoredPixel(drawX - 5, cy + 3, '#2c3e50', 2);
            this.drawColoredPixel(drawX + 4, cy + 3, '#2c3e50', 2);
        } else if (mood === 'sad') {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 3, cy + 6, 6, 2);
            this.drawColoredPixel(drawX - 5, cy + 7, '#2c3e50', 2);
            this.drawColoredPixel(drawX + 4, cy + 7, '#2c3e50', 2);
        }

        this.drawColoredPixel(drawX - 6, cy + 8, colors.accent);
        this.drawColoredPixel(drawX + 6, cy + 8, colors.accent);

        this.ctx.restore();
    }

    drawChild() {
        const colors = this.colors.child;
        const mood = this.getMood();
        const bounce = this.isSleeping ? 0 : Math.sin(this.animationFrame * Math.PI / 2) * 2;
        const cx = this.x;
        const cy = this.y + bounce;

        this.ctx.save();
        if (!this.facingRight) {
            this.ctx.translate(this.canvas.width, 0);
            this.ctx.scale(-1, 1);
        }

        const drawX = this.facingRight ? cx : this.canvas.width - cx;

        this.drawColoredPixel(drawX - 10, cy - 12, colors.secondary);
        this.drawColoredPixel(drawX + 10, cy - 12, colors.secondary);

        for (let dy = -10; dy <= 10; dy += 4) {
            for (let dx = -10; dx <= 10; dx += 4) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 14) {
                    this.drawColoredPixel(drawX + dx, cy + dy, colors.primary);
                }
            }
        }

        if (this.isSleeping || this.isBlinking) {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 6, cy - 2, 5, 1);
            this.ctx.fillRect(drawX + 3, cy - 2, 5, 1);

            if (this.isSleeping) {
                this.ctx.font = '23px Arial';
                this.ctx.fillText('Z', drawX + 23, cy - 17);
                this.ctx.fillText('z', drawX + 33, cy - 23);
            }
        } else {
            this.drawColoredPixel(drawX - 5, cy - 3, '#2c3e50', 4);
            this.drawColoredPixel(drawX + 5, cy - 3, '#2c3e50', 4);
            this.drawColoredPixel(drawX - 5, cy - 4, '#fff', 2);
            this.drawColoredPixel(drawX + 5, cy - 4, '#fff', 2);
        }

        if (mood === 'happy') {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 4, cy + 5, 8, 2);
            this.drawColoredPixel(drawX - 6, cy + 4, '#2c3e50', 2);
            this.drawColoredPixel(drawX + 5, cy + 4, '#2c3e50', 2);
        } else if (mood === 'sad') {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 4, cy + 8, 8, 2);
            this.drawColoredPixel(drawX - 6, cy + 9, '#2c3e50', 2);
            this.drawColoredPixel(drawX + 5, cy + 9, '#2c3e50', 2);
        }

        this.drawColoredPixel(drawX - 8, cy + 12, colors.accent);
        this.drawColoredPixel(drawX + 8, cy + 12, colors.accent);
        this.drawColoredPixel(drawX - 12, cy + 10, colors.accent);
        this.drawColoredPixel(drawX + 12, cy + 10, colors.accent);

        this.ctx.restore();
    }

    drawAdult() {
        const colors = this.colors.adult;
        const mood = this.getMood();
        const bounce = this.isSleeping ? 0 : Math.sin(this.animationFrame * Math.PI / 2) * 3;
        const cx = this.x;
        const cy = this.y + bounce;

        this.ctx.save();
        if (!this.facingRight) {
            this.ctx.translate(this.canvas.width, 0);
            this.ctx.scale(-1, 1);
        }

        const drawX = this.facingRight ? cx : this.canvas.width - cx;

        this.drawColoredPixel(drawX - 12, cy - 14, colors.secondary);
        this.drawColoredPixel(drawX + 12, cy - 14, colors.secondary);

        for (let dy = -12; dy <= 12; dy += 4) {
            for (let dx = -12; dx <= 12; dx += 4) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 16) {
                    this.drawColoredPixel(drawX + dx, cy + dy, colors.primary);
                }
            }
        }

        if (this.isSleeping || this.isBlinking) {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 8, cy - 3, 6, 2);
            this.ctx.fillRect(drawX + 4, cy - 3, 6, 2);

            if (this.isSleeping) {
                this.ctx.font = '27px Arial';
                this.ctx.fillText('Z', drawX + 27, cy - 20);
                this.ctx.fillText('z', drawX + 40, cy - 27);
            }
        } else {
            this.drawColoredPixel(drawX - 6, cy - 4, '#2c3e50', 5);
            this.drawColoredPixel(drawX + 6, cy - 4, '#2c3e50', 5);
            this.drawColoredPixel(drawX - 6, cy - 5, '#fff', 3);
            this.drawColoredPixel(drawX + 6, cy - 5, '#fff', 3);
        }

        if (mood === 'happy') {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 5, cy + 6, 10, 3);
            this.drawColoredPixel(drawX - 7, cy + 5, '#2c3e50', 3);
            this.drawColoredPixel(drawX + 6, cy + 5, '#2c3e50', 3);
        } else if (mood === 'sad') {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 5, cy + 10, 10, 3);
            this.drawColoredPixel(drawX - 7, cy + 11, '#2c3e50', 3);
            this.drawColoredPixel(drawX + 6, cy + 11, '#2c3e50', 3);
        } else {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(drawX - 5, cy + 8, 10, 2);
        }

        this.drawColoredPixel(drawX - 10, cy + 14, colors.accent);
        this.drawColoredPixel(drawX + 10, cy + 14, colors.accent);
        this.drawColoredPixel(drawX - 14, cy + 12, colors.accent);
        this.drawColoredPixel(drawX + 14, cy + 12, colors.accent);

        this.ctx.restore();
    }

    drawDead() {
        const cx = 100;
        const cy = 100;

        this.ctx.fillStyle = '#95a5a6';
        for (let dy = -18; dy <= 18; dy += 7) {
            for (let dx = -18; dx <= 18; dx += 7) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 24) {
                    this.drawColoredPixel(cx + dx, cy + dy, '#95a5a6');
                }
            }
        }

        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(cx - 10, cy - 3, 5, 5);
        this.ctx.fillRect(cx + 7, cy - 3, 5, 5);

        this.ctx.font = 'bold 24px "Space Mono"';
        this.ctx.fillText('RIP', cx - 20, cy + 60);
    }

    drawPoop(x, y) {
        this.ctx.fillStyle = '#8b6914';
        this.drawColoredPixel(x - 5, y, '#6b5310', 7);
        this.drawColoredPixel(x + 3, y, '#6b5310', 7);
        this.drawColoredPixel(x - 2, y - 7, '#8b6914', 7);
        this.drawColoredPixel(x - 5, y + 7, '#5a4208', 7);
        this.drawColoredPixel(x + 3, y + 7, '#5a4208', 7);
    }

    drawSickIcon() {
        const cx = this.x;
        const cy = this.y - 35;

        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(cx - 3, cy - 10, 3, 13);
        this.ctx.fillRect(cx - 10, cy - 3, 13, 3);
        this.ctx.fillRect(cx, cy + 7, 3, 3);
    }

    drawParticle(p) {
        this.ctx.save();
        this.ctx.globalAlpha = p.life / 60;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(p.emoji, p.x - 10, p.y);
        this.ctx.restore();
    }

    saveGame() {
        const data = {
            hunger: this.hunger,
            happiness: this.happiness,
            health: this.health,
            age: this.age,
            stage: this.stage,
            isSick: this.isSick,
            isAlive: this.isAlive,
            birthTime: this.birthTime,
            pausedTime: this.pausedTime,
            isPaused: this.isPaused,
            petName: this.petName,
            poops: this.poops,
            lastSave: Date.now()
        };
        localStorage.setItem('tamagotchi', JSON.stringify(data));
    }

    loadGame() {
        const saved = localStorage.getItem('tamagotchi');
        if (saved) {
            const data = JSON.parse(saved);

            if (!data.isPaused) {
                const timePassed = Math.floor((Date.now() - data.lastSave) / 1000);
                this.hunger = Math.max(0, data.hunger - timePassed);
                this.happiness = Math.max(0, data.happiness - (timePassed * 0.5));
                this.health = Math.max(0, data.health - (timePassed * 0.5));
            } else {
                this.hunger = data.hunger;
                this.happiness = data.happiness;
                this.health = data.health;
            }

            this.age = data.age;
            this.stage = data.stage;
            this.isSick = data.isSick;
            this.isAlive = data.isAlive && (this.hunger > 0 || this.stage === 'egg' || this.stage === 'baby') && (this.health > 0 || this.stage === 'egg' || this.stage === 'baby');
            this.birthTime = data.birthTime;
            this.pausedTime = data.pausedTime || 0;
            this.isPaused = data.isPaused || false;
            this.petName = data.petName || 'TAMA';
            this.poops = data.poops || [];

            document.getElementById('pet-name').textContent = this.petName;

            if (this.isPaused) {
                this.pauseStartTime = Date.now();
                const pauseIcon = document.getElementById('pause-icon');
                const pauseLabel = document.getElementById('pause-label');
                pauseIcon.textContent = '▶';
                pauseLabel.textContent = 'RESUME';
            }
        } else {
            this.showNameModal();
        }
    }
}

const game = new Tamagotchi();
