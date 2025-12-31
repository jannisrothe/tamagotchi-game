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
        this.lastUpdate = Date.now();
        this.birthTime = Date.now();

        this.canvas = document.getElementById('petCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.loadGame();
        this.init();
    }

    init() {
        this.updateUI();
        this.draw();

        setInterval(() => this.tick(), 1000);
        setInterval(() => this.updateAge(), 10000);
        setInterval(() => this.animate(), 500);

        document.getElementById('feed-btn').addEventListener('click', () => this.feed());
        document.getElementById('play-btn').addEventListener('click', () => this.play());
        document.getElementById('clean-btn').addEventListener('click', () => this.clean());
        document.getElementById('medicine-btn').addEventListener('click', () => this.heal());
    }

    tick() {
        if (!this.isAlive) return;

        this.hunger = Math.max(0, this.hunger - 1);
        this.happiness = Math.max(0, this.happiness - 0.5);

        if (this.isDirty) {
            this.health = Math.max(0, this.health - 2);
        }

        if (this.hunger < 30 || this.happiness < 30) {
            this.health = Math.max(0, this.health - 0.5);
        }

        if (this.health < 30 && !this.isSick) {
            this.isSick = true;
            this.showMessage('TAMA is sick!');
        }

        if (Math.random() < 0.05 && !this.isDirty) {
            this.isDirty = true;
        }

        if (this.hunger === 0 || this.health === 0) {
            this.die();
        }

        this.updateUI();
        this.draw();
        this.saveGame();
    }

    updateAge() {
        if (!this.isAlive) return;

        const ageInSeconds = Math.floor((Date.now() - this.birthTime) / 1000);
        this.age = Math.floor(ageInSeconds / 10);

        if (this.stage === 'egg' && this.age >= 5) {
            this.evolve('baby');
        } else if (this.stage === 'baby' && this.age >= 20) {
            this.evolve('child');
        } else if (this.stage === 'child' && this.age >= 40) {
            this.evolve('adult');
        }

        this.updateUI();
    }

    evolve(newStage) {
        this.stage = newStage;
        this.showMessage(`TAMA evolved to ${newStage.toUpperCase()}!`);
    }

    animate() {
        this.animationFrame = (this.animationFrame + 1) % 2;
        this.draw();
    }

    feed() {
        if (!this.isAlive) return;

        this.hunger = Math.min(100, this.hunger + 20);
        this.showMessage('Fed TAMA!');
        this.updateUI();
        this.saveGame();
    }

    play() {
        if (!this.isAlive) return;

        this.happiness = Math.min(100, this.happiness + 20);
        this.hunger = Math.max(0, this.hunger - 5);
        this.showMessage('Played with TAMA!');
        this.updateUI();
        this.saveGame();
    }

    clean() {
        if (!this.isAlive) return;

        if (this.isDirty) {
            this.isDirty = false;
            this.health = Math.min(100, this.health + 10);
            this.showMessage('Cleaned TAMA!');
        } else {
            this.showMessage('TAMA is already clean!');
        }
        this.updateUI();
        this.saveGame();
    }

    heal() {
        if (!this.isAlive) return;

        if (this.isSick) {
            this.isSick = false;
            this.health = Math.min(100, this.health + 30);
            this.showMessage('Healed TAMA!');
        } else {
            this.showMessage('TAMA is healthy!');
        }
        this.updateUI();
        this.saveGame();
    }

    die() {
        this.isAlive = false;
        this.showMessage('TAMA has died... Refresh to restart.');
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
        document.getElementById('pet-age').textContent = `Age: ${this.age}`;
        document.getElementById('pet-stage').textContent = this.stage.toUpperCase();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.isAlive) {
            this.drawDead();
            return;
        }

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

        if (this.isDirty) {
            this.drawDirt();
        }

        if (this.isSick) {
            this.drawSickIcon();
        }
    }

    drawPixel(x, y, size = 6) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x * size, y * size, size, size);
    }

    drawEgg() {
        const offset = this.animationFrame * 2;

        for (let y = 5; y <= 10; y++) {
            for (let x = 7; x <= 12; x++) {
                if (y === 5 && (x < 8 || x > 11)) continue;
                if (y === 10 && (x < 8 || x > 11)) continue;
                this.drawPixel(x, y + offset);
            }
        }
    }

    drawBaby() {
        const offset = this.animationFrame * 1;

        this.drawPixel(7, 6 + offset);
        this.drawPixel(8, 6 + offset);
        this.drawPixel(10, 6 + offset);
        this.drawPixel(11, 6 + offset);

        for (let x = 6; x <= 12; x++) {
            this.drawPixel(x, 8 + offset);
            this.drawPixel(x, 9 + offset);
        }

        this.drawPixel(7, 10 + offset);
        this.drawPixel(8, 10 + offset);
        this.drawPixel(10, 10 + offset);
        this.drawPixel(11, 10 + offset);

        this.drawPixel(7, 11 + offset);
        this.drawPixel(11, 11 + offset);
    }

    drawChild() {
        const offset = this.animationFrame * 1;

        for (let x = 7; x <= 11; x++) {
            this.drawPixel(x, 5 + offset);
        }

        this.drawPixel(6, 6 + offset);
        this.drawPixel(12, 6 + offset);

        this.drawPixel(7, 7 + offset);
        this.drawPixel(11, 7 + offset);

        for (let x = 6; x <= 12; x++) {
            this.drawPixel(x, 8 + offset);
            this.drawPixel(x, 9 + offset);
        }

        this.drawPixel(6, 10 + offset);
        this.drawPixel(8, 10 + offset);
        this.drawPixel(10, 10 + offset);
        this.drawPixel(12, 10 + offset);

        this.drawPixel(6, 11 + offset);
        this.drawPixel(12, 11 + offset);
    }

    drawAdult() {
        const offset = this.animationFrame * 1;

        this.drawPixel(7, 4 + offset);
        this.drawPixel(11, 4 + offset);

        for (let x = 6; x <= 12; x++) {
            this.drawPixel(x, 5 + offset);
        }

        this.drawPixel(5, 6 + offset);
        this.drawPixel(13, 6 + offset);

        this.drawPixel(6, 7 + offset);
        this.drawPixel(12, 7 + offset);

        this.drawPixel(7, 7 + offset);
        this.drawPixel(11, 7 + offset);

        for (let x = 5; x <= 13; x++) {
            this.drawPixel(x, 8 + offset);
            this.drawPixel(x, 9 + offset);
        }

        this.drawPixel(5, 10 + offset);
        this.drawPixel(7, 10 + offset);
        this.drawPixel(9, 10 + offset);
        this.drawPixel(11, 10 + offset);
        this.drawPixel(13, 10 + offset);

        this.drawPixel(5, 11 + offset);
        this.drawPixel(7, 11 + offset);
        this.drawPixel(11, 11 + offset);
        this.drawPixel(13, 11 + offset);
    }

    drawDead() {
        for (let x = 6; x <= 12; x++) {
            this.drawPixel(x, 9);
        }
        this.drawPixel(7, 8);
        this.drawPixel(11, 8);

        this.drawPixel(5, 10);
        this.drawPixel(13, 10);

        this.drawPixel(8, 6);
        this.drawPixel(10, 6);

        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px "Courier New"';
        this.ctx.fillText('RIP', 42, 80);
    }

    drawDirt() {
        this.drawPixel(14, 14, 4);
        this.drawPixel(15, 15, 4);
        this.drawPixel(16, 14, 4);
    }

    drawSickIcon() {
        this.drawPixel(1, 2, 4);
        this.drawPixel(2, 1, 4);
        this.drawPixel(2, 3, 4);
    }

    saveGame() {
        const data = {
            hunger: this.hunger,
            happiness: this.happiness,
            health: this.health,
            age: this.age,
            stage: this.stage,
            isDirty: this.isDirty,
            isSick: this.isSick,
            isAlive: this.isAlive,
            birthTime: this.birthTime,
            lastSave: Date.now()
        };
        localStorage.setItem('tamagotchi', JSON.stringify(data));
    }

    loadGame() {
        const saved = localStorage.getItem('tamagotchi');
        if (saved) {
            const data = JSON.parse(saved);
            const timePassed = Math.floor((Date.now() - data.lastSave) / 1000);

            this.hunger = Math.max(0, data.hunger - timePassed);
            this.happiness = Math.max(0, data.happiness - (timePassed * 0.5));
            this.health = Math.max(0, data.health - (timePassed * 0.5));
            this.age = data.age;
            this.stage = data.stage;
            this.isDirty = data.isDirty;
            this.isSick = data.isSick;
            this.isAlive = data.isAlive && this.hunger > 0 && this.health > 0;
            this.birthTime = data.birthTime;
        }
    }
}

const game = new Tamagotchi();
