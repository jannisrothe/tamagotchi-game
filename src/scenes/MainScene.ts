/**
 * Main Game Scene
 * Primary Phaser scene containing the Tamagotchi and game logic
 */

import Phaser from 'phaser';
import { Tamagotchi } from '../entities/Tamagotchi';
import { StateManager } from '../core/StateManager';
import { StatsSystem } from '../systems/StatsSystem';
import { PetStateMachine } from '../states/PetStateMachine';
import { EventEmitter, globalEvents } from '../core/EventEmitter';
import {
  CANVAS_SIZE,
  EVENTS,
  PetState,
  INTERACTION_VALUES,
  EvolutionStage,
} from '../utils/Constants';
import { SaveManager } from '../utils/SaveManager';

export class MainScene extends Phaser.Scene {
  private tamagotchi!: Tamagotchi;
  private stateManager!: StateManager;
  private statsSystem!: StatsSystem;
  private petStateMachine!: PetStateMachine;
  private poopSprites: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Load Tamagotchi sprite atlases
    this.load.atlas(
      'egg',
      'assets/sprites/tamagotchi/egg/egg-idle.png',
      'assets/sprites/tamagotchi/egg/egg.json'
    );
    this.load.atlas(
      'baby',
      'assets/sprites/tamagotchi/baby/baby-spritesheet.png',
      'assets/sprites/tamagotchi/baby/baby.json'
    );
    this.load.atlas(
      'child',
      'assets/sprites/tamagotchi/child/child-spritesheet.png',
      'assets/sprites/tamagotchi/child/child.json'
    );
    this.load.atlas(
      'adult',
      'assets/sprites/tamagotchi/adult/adult-spritesheet.png',
      'assets/sprites/tamagotchi/adult/adult.json'
    );

    // Load item sprites
    this.load.image('food', 'assets/sprites/items/food.png');
    this.load.image('ball', 'assets/sprites/items/ball.png');
    this.load.image('poop', 'assets/sprites/items/poop.png');
    this.load.image('heart', 'assets/sprites/items/heart.png');

    // Load effect sprites
    this.load.image('particle', 'assets/sprites/effects/particle-star.png');
  }

  create(): void {
    // Initialize systems
    this.stateManager = new StateManager(globalEvents);
    this.statsSystem = new StatsSystem(globalEvents, this.stateManager);
    this.petStateMachine = new PetStateMachine(globalEvents);

    // Load save data if exists
    const saveData = SaveManager.loadGame();
    if (saveData) {
      this.stateManager.loadState(saveData);
    }

    // Set up background
    this.cameras.main.setBackgroundColor(0xc8e6c9);

    // Create Tamagotchi
    this.tamagotchi = new Tamagotchi(
      this,
      CANVAS_SIZE.WIDTH / 2,
      CANVAS_SIZE.HEIGHT / 2,
      this.stateManager
    );

    // Start stats system
    this.statsSystem.start();

    // Set up event listeners
    this.setupEventListeners();

    // Set up auto-save
    this.time.addEvent({
      delay: 10000, // Save every 10 seconds
      callback: () => this.saveGame(),
      loop: true,
    });

    // Enable window events for interactions (bridged from UI)
    this.setupWindowBridge();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    globalEvents.on(EVENTS.STATS_CHANGED, (stats: any) => {
      this.tamagotchi.updateVisual();
      this.emitToUI('statsChanged', stats);
    });

    globalEvents.on(EVENTS.PET_EVOLVED, (data: any) => {
      this.tamagotchi.updateVisual();
      this.emitToUI('petEvolved', data);
      this.playEvolutionEffect();
    });

    globalEvents.on(EVENTS.PET_DIED, () => {
      this.emitToUI('petDied');
    });

    globalEvents.on(EVENTS.PET_STATE_CHANGED, (data: any) => {
      console.log(`Pet state: ${data.from} → ${data.to}`);
    });
  }

  /**
   * Bridge game functions to window for UI button calls
   */
  private setupWindowBridge(): void {
    (window as any).game = {
      feed: () => this.feedPet(),
      play: () => this.playWithPet(),
      clean: () => this.cleanPoops(),
      heal: () => this.healPet(),
      pause: () => this.pauseGame(),
      resume: () => this.resumeGame(),
      newGame: () => this.newGame(),
      setPetName: (name: string) => this.stateManager.setPetName(name),
    };
  }

  /**
   * Emit events to UI layer
   */
  private emitToUI(event: string, data?: any): void {
    window.dispatchEvent(
      new CustomEvent('game:' + event, { detail: data })
    );
  }

  /**
   * Feed the pet
   */
  private feedPet(): void {
    if (!this.petStateMachine.canInteract()) {
      console.log('Pet is busy');
      return;
    }

    this.petStateMachine.transition(PetState.EATING);

    // Create food
    const foodX = 100 + Math.random() * (CANVAS_SIZE.WIDTH - 200);
    const food = this.add.sprite(foodX, -20, 'food');
    food.setScale(2); // Scale up the 16x16 sprite

    // Animate food falling
    this.tweens.add({
      targets: food,
      y: 200,
      duration: 1000,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Pet moves to food
        this.tweens.add({
          targets: this.tamagotchi,
          x: foodX,
          duration: 500,
          onComplete: () => {
            // Eating animation
            food.destroy();
            this.eatAnimation();
          },
        });
      },
    });
  }

  /**
   * Eating animation sequence
   */
  private eatAnimation(): void {
    // First bite
    this.tamagotchi.setMouthOpen(true);
    this.tamagotchi.playSquishAnimation();

    this.time.delayedCall(300, () => {
      this.tamagotchi.setMouthOpen(false);
      const state = this.stateManager.getState();
      this.stateManager.updateStats({
        hunger: state.hunger + INTERACTION_VALUES.FEED_HUNGER_GAIN,
      });

      // Second bite
      this.time.delayedCall(400, () => {
        this.tamagotchi.setMouthOpen(true);
        this.tamagotchi.playSquishAnimation();

        this.time.delayedCall(300, () => {
          this.tamagotchi.setMouthOpen(false);
          const state2 = this.stateManager.getState();
          this.stateManager.updateStats({
            hunger: state2.hunger + INTERACTION_VALUES.FEED_HUNGER_GAIN,
          });

          // Show heart and return to idle
          this.time.delayedCall(500, () => {
            this.showHeart();
            this.petStateMachine.transition(PetState.IDLE);

            // Return pet to center
            this.tweens.add({
              targets: this.tamagotchi,
              x: CANVAS_SIZE.WIDTH / 2,
              duration: 500,
            });
          });
        });
      });
    });
  }

  /**
   * Play with pet
   */
  private playWithPet(): void {
    if (!this.petStateMachine.canInteract()) {
      console.log('Pet is busy');
      return;
    }

    this.petStateMachine.transition(PetState.PLAYING);

    // Create ball
    const ballX = 100 + Math.random() * (CANVAS_SIZE.WIDTH - 200);
    const ball = this.add.sprite(ballX, -20, 'ball');
    ball.setScale(2); // Scale up the 16x16 sprite

    // Animate ball falling
    this.tweens.add({
      targets: ball,
      y: 200,
      duration: 1000,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Pet moves to ball
        this.tweens.add({
          targets: this.tamagotchi,
          x: ballX,
          duration: 500,
          onComplete: () => {
            this.playAnimation(ball);
          },
        });
      },
    });
  }

  /**
   * Playing animation sequence
   */
  private playAnimation(ball: Phaser.GameObjects.Arc): void {
    let bounceCount = 0;

    // Ball bouncing
    const bounce = () => {
      this.tweens.add({
        targets: ball,
        y: ball.y - 50,
        duration: 300,
        ease: 'Quad.easeOut',
        yoyo: true,
        onComplete: () => {
          bounceCount++;
          this.tamagotchi.playSquishAnimation();

          if (bounceCount < 3) {
            bounce();
          } else {
            ball.destroy();

            // Update stats
            const state = this.stateManager.getState();
            this.stateManager.updateStats({
              happiness:
                state.happiness + INTERACTION_VALUES.PLAY_HAPPINESS_GAIN,
              hunger: state.hunger - INTERACTION_VALUES.PLAY_HUNGER_COST,
            });

            this.showHeart();
            this.petStateMachine.transition(PetState.IDLE);

            // Return to center
            this.tweens.add({
              targets: this.tamagotchi,
              x: CANVAS_SIZE.WIDTH / 2,
              duration: 500,
            });
          }
        },
      });
    };

    bounce();
  }

  /**
   * Clean poops
   */
  private cleanPoops(): void {
    const state = this.stateManager.getState();

    if (state.poopCount === 0) {
      this.emitToUI('message', 'Nothing to clean!');
      return;
    }

    // Remove poop sprites
    this.poopSprites.forEach((p) => p.destroy());
    this.poopSprites = [];

    // Update state
    this.statsSystem.cleanPoop();
    this.stateManager.updateStats({
      health: state.health + INTERACTION_VALUES.CLEAN_HEALTH_GAIN * 2,
    });

    this.showHeart();
    this.emitToUI('message', 'Cleaned up!');
  }

  /**
   * Heal pet
   */
  private healPet(): void {
    const state = this.stateManager.getState();

    if (!state.isSick) {
      this.emitToUI('message', `${state.petName} is healthy!`);
      return;
    }

    this.stateManager.setSick(false);
    this.stateManager.updateStats({
      health: state.health + INTERACTION_VALUES.HEAL_HEALTH_GAIN * 2,
    });

    this.showHeart();
    this.emitToUI('message', `Healed ${state.petName}!`);
  }

  /**
   * Show heart effect
   */
  private showHeart(): void {
    const heart = this.add.sprite(
      this.tamagotchi.x,
      this.tamagotchi.y - 80,
      'heart'
    );
    heart.setScale(2.5); // Scale up the 16x16 sprite

    this.tweens.add({
      targets: heart,
      y: heart.y - 30,
      alpha: 0,
      duration: 2000,
      onComplete: () => heart.destroy(),
    });
  }

  /**
   * Play evolution effect
   */
  private playEvolutionEffect(): void {
    // Flash effect
    this.cameras.main.flash(1000, 255, 255, 255);

    // Particle burst
    const particles = this.add.particles(
      this.tamagotchi.x,
      this.tamagotchi.y,
      'particle',
      {
        speed: { min: 50, max: 200 },
        scale: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 20,
      }
    );

    this.time.delayedCall(1000, () => particles.destroy());
  }

  /**
   * Pause game
   */
  private pauseGame(): void {
    this.statsSystem.pause();
    this.scene.pause();
    this.emitToUI('gamePaused');
  }

  /**
   * Resume game
   */
  private resumeGame(): void {
    // Calculate pause duration
    const pauseDuration = 0; // TODO: Track actual pause time
    this.statsSystem.resume(pauseDuration);
    this.scene.resume();
    this.emitToUI('gameResumed');
  }

  /**
   * New game
   */
  private newGame(): void {
    SaveManager.deleteSave();
    this.scene.restart();
  }

  /**
   * Save game
   */
  private saveGame(): void {
    const data = this.stateManager.export();
    SaveManager.saveGame(data);
  }

  /**
   * Update loop
   */
  update(): void {
    // Draw poops based on poop count
    const state = this.stateManager.getState();
    const targetPoopCount = state.poopCount;

    // Add poops if needed
    while (this.poopSprites.length < targetPoopCount) {
      const x = 80 + Math.random() * (CANVAS_SIZE.WIDTH - 160);
      const y = 220 + Math.random() * 40;
      const poop = this.add.sprite(x, y, 'poop');
      poop.setScale(2); // Scale up the 16x16 sprite
      this.poopSprites.push(poop);
    }

    // Remove poops if needed
    while (this.poopSprites.length > targetPoopCount) {
      const poop = this.poopSprites.pop();
      poop?.destroy();
    }
  }

  /**
   * Clean up on shutdown
   */
  shutdown(): void {
    this.statsSystem.destroy();
    globalEvents.destroy();
  }
}
