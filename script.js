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

        this.x = 60;
        this.y = 60;
        this.targetX = 60;
        this.targetY = 60;
        this.facingRight = true;
        this.isBlinking = false;

        this.poops = [];
        this.particles = [];
        this.speechBubble = null;
        this.lastMood = 'neutral';

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
        this.intervals.push(setInterval(() => this.checkSleepTime(), 1000));

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

        this.hunger = Math.max(0, this.hunger - 1);
        this.happiness = Math.max(0, this.happiness - 0.5);

        if (this.poops.length > 0) {
            this.health = Math.max(0, this.health - 2);
        }

        if (this.hunger < 30 || this.happiness < 30) {
            this.health = Math.max(0, this.health - 0.5);
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
        this.createParticles(this.x, this.y - 20, '✨', 10, 'fall');
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
        if (!this.isAlive || this.stage === 'egg' || this.isPaused || this.isSleeping) return;

        this.targetX = 20 + Math.random() * 80;
        this.targetY = 40 + Math.random() * 60;
    }

    updateMovement() {
        if (!this.isAlive || this.stage === 'egg' || this.isPaused || this.isSleeping) return;

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
                x: 20 + Math.random() * 80,
                y: 80 + Math.random() * 20
            });
        }
    }

    createParticles(x, y, emoji, count, type = 'fall') {
        for (let i = 0; i < count; i++) {
            if (type === 'fall') {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 40,
                    y: -10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: Math.random() * 2 + 1,
                    life: 90,
                    emoji: emoji,
                    targetY: y
                });
            } else {
                this.particles.push({
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
        if (!this.isAlive || this.isPaused || this.isSleeping) return;

        this.hunger = Math.min(100, this.hunger + 20);
        this.showMessage(`Fed ${this.petName}!`);
        this.createParticles(this.x, this.y, '🍖', 5, 'fall');
        this.showSpeechBubble('😋');
        this.updateUI();
        this.saveGame();
    }

    play() {
        if (!this.isAlive || this.isPaused || this.isSleeping) return;

        this.happiness = Math.min(100, this.happiness + 20);
        this.hunger = Math.max(0, this.hunger - 5);
        this.showMessage(`Played with ${this.petName}!`);
        this.createParticles(this.x, this.y, '⚾', 6, 'fall');
        this.showSpeechBubble('😄');
        this.updateUI();
        this.saveGame();
    }

    clean() {
        if (!this.isAlive || this.isPaused || this.isSleeping) return;

        if (this.poops.length > 0) {
            this.poops = [];
            this.health = Math.min(100, this.health + 10);
            this.showMessage('Cleaned up!');
            this.createParticles(this.x, this.y - 20, '✨', 12, 'fall');
            this.showSpeechBubble('😌');
        } else {
            this.showMessage('Nothing to clean!');
        }
        this.updateUI();
        this.saveGame();
    }

    heal() {
        if (!this.isAlive || this.isPaused || this.isSleeping) return;

        if (this.isSick) {
            this.isSick = false;
            this.health = Math.min(100, this.health + 30);
            this.showMessage(`Healed ${this.petName}!`);
            this.createParticles(this.x, this.y, '💊', 6, 'fall');
            this.showSpeechBubble('😊');
        } else {
            this.showMessage(`${this.petName} is healthy!`);
        }
        this.updateUI();
        this.saveGame();
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
        document.getElementById('pet-age').textContent = `Age: ${days}d ${hours}h`;
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
        const bubbleX = this.x + 25;
        const bubbleY = this.y - 30;
        const bubbleWidth = 30;
        const bubbleHeight = 25;

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
        this.ctx.moveTo(bubbleX, bubbleY + bubbleHeight - 5);
        this.ctx.lineTo(bubbleX - 5, bubbleY + bubbleHeight + 5);
        this.ctx.lineTo(bubbleX + 5, bubbleY + bubbleHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillText(this.speechBubble.emoji, bubbleX + 6, bubbleY + 19);

        this.ctx.restore();
    }

    getMood() {
        if (this.isSick) return 'sick';
        if (this.hunger < 30) return 'hungry';
        if (this.happiness < 30) return 'bored';
        if (this.happiness > 70 && this.hunger > 70) return 'happy';
        return 'neutral';
    }

    drawColoredPixel(x, y, color, size = 4) {
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
                this.ctx.font = '12px Arial';
                this.ctx.fillText('Z', drawX + 12, cy - 8);
                this.ctx.fillText('z', drawX + 18, cy - 12);
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
                this.ctx.font = '14px Arial';
                this.ctx.fillText('Z', drawX + 14, cy - 10);
                this.ctx.fillText('z', drawX + 20, cy - 14);
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
                this.ctx.font = '16px Arial';
                this.ctx.fillText('Z', drawX + 16, cy - 12);
                this.ctx.fillText('z', drawX + 24, cy - 16);
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
        const cx = 60;
        const cy = 60;

        this.ctx.fillStyle = '#95a5a6';
        for (let dy = -10; dy <= 10; dy += 4) {
            for (let dx = -10; dx <= 10; dx += 4) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 14) {
                    this.drawColoredPixel(cx + dx, cy + dy, '#95a5a6');
                }
            }
        }

        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(cx - 6, cy - 2, 3, 3);
        this.ctx.fillRect(cx + 4, cy - 2, 3, 3);

        this.ctx.font = 'bold 14px "Courier New"';
        this.ctx.fillText('RIP', cx - 12, cy + 35);
    }

    drawPoop(x, y) {
        this.ctx.fillStyle = '#8b6914';
        this.drawColoredPixel(x - 3, y, '#6b5310', 4);
        this.drawColoredPixel(x + 2, y, '#6b5310', 4);
        this.drawColoredPixel(x - 1, y - 4, '#8b6914', 4);
        this.drawColoredPixel(x - 3, y + 4, '#5a4208', 4);
        this.drawColoredPixel(x + 2, y + 4, '#5a4208', 4);
    }

    drawSickIcon() {
        const cx = this.x;
        const cy = this.y - 20;

        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(cx - 2, cy - 6, 2, 8);
        this.ctx.fillRect(cx - 6, cy - 2, 8, 2);
        this.ctx.fillRect(cx, cy + 4, 2, 2);
    }

    drawParticle(p) {
        this.ctx.save();
        this.ctx.globalAlpha = p.life / 60;
        this.ctx.font = '12px Arial';
        this.ctx.fillText(p.emoji, p.x - 6, p.y);
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
