/**
 * Tamagotchi Entity
 * Main pet character with Phaser graphics and animations
 */

import Phaser from 'phaser';
import { EvolutionStage, STAGE_COLORS } from '../utils/Constants';
import { StateManager } from '../core/StateManager';

export class Tamagotchi extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private stateManager: StateManager;

  private currentStage: EvolutionStage = EvolutionStage.EGG;
  private currentMood: 'happy' | 'neutral' | 'sad' = 'neutral';
  private animationsCreated: boolean = false;
  private isBlinking: boolean = false;
  private mouthOpen: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    stateManager: StateManager
  ) {
    super(scene, x, y);

    this.stateManager = stateManager;

    // Create animations once for the scene
    if (!this.animationsCreated) {
      this.createAnimations();
      this.animationsCreated = true;
    }

    // Create sprite based on initial stage
    const initialStage = stateManager.getState().stage;
    const textureKey = initialStage === EvolutionStage.EGG ? 'egg' : 'baby';
    const frameKey = initialStage === EvolutionStage.EGG ? 'egg-idle' : 'idle-1';

    this.sprite = scene.add.sprite(0, 0, textureKey, frameKey);
    this.sprite.setScale(2.5); // Scale up the 32x32 sprites

    // Add sprite to container
    this.add(this.sprite);

    // Add to scene
    scene.add.existing(this);

    // Update sprite based on current state
    this.updateSprite();

    // Start idle animations
    this.startIdleAnimations();
  }

  /**
   * Create sprite animations for all evolution stages
   */
  private createAnimations(): void {
    const stages = ['baby', 'child', 'adult'];

    stages.forEach((stage) => {
      // Idle animation
      if (!this.scene.anims.exists(`${stage}-idle`)) {
        this.scene.anims.create({
          key: `${stage}-idle`,
          frames: this.scene.anims.generateFrameNames(stage, {
            prefix: 'idle-',
            start: 1,
            end: 4,
          }),
          frameRate: 6,
          repeat: -1,
        });
      }

      // Blink animation
      if (!this.scene.anims.exists(`${stage}-blink`)) {
        this.scene.anims.create({
          key: `${stage}-blink`,
          frames: this.scene.anims.generateFrameNames(stage, {
            prefix: 'blink-',
            start: 1,
            end: 3,
          }),
          frameRate: 10,
          repeat: 0,
        });
      }

      // Eat animation
      if (!this.scene.anims.exists(`${stage}-eat`)) {
        this.scene.anims.create({
          key: `${stage}-eat`,
          frames: this.scene.anims.generateFrameNames(stage, {
            prefix: 'eat-',
            start: 1,
            end: 4,
          }),
          frameRate: 8,
          repeat: 0,
        });
      }
    });
  }

  /**
   * Update sprite based on current stage and mood
   */
  private updateSprite(): void {
    const avgStats = this.stateManager.getAverageStats();
    const stage = this.stateManager.getState().stage;

    // Determine mood based on average stats
    let mood: 'happy' | 'neutral' | 'sad' = 'neutral';
    if (avgStats >= 70) {
      mood = 'happy';
    } else if (avgStats < 40) {
      mood = 'sad';
    }

    this.currentMood = mood;

    // Handle egg stage separately (no animations)
    if (stage === EvolutionStage.EGG) {
      this.sprite.setTexture('egg', 'egg-idle');
      this.sprite.stop();
      return;
    }

    // Map evolution stage to texture key
    const stageKey =
      stage === EvolutionStage.BABY
        ? 'baby'
        : stage === EvolutionStage.CHILD
        ? 'child'
        : 'adult';

    // If eating or blinking, animations are handled separately
    // Otherwise, show mood-based sprite or play idle animation
    if (!this.mouthOpen && !this.isBlinking) {
      // Try to use mood frame if available, otherwise play idle animation
      const moodFrame = `${mood}`;
      if (this.scene.textures.get(stageKey).has(moodFrame)) {
        this.sprite.setTexture(stageKey, moodFrame);
        this.sprite.stop();
      } else {
        // Play idle animation
        if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== `${stageKey}-idle`) {
          this.sprite.play(`${stageKey}-idle`, true);
        }
      }
    }
  }


  /**
   * Start idle animations
   */
  private startIdleAnimations(): void {
    // Blink animation timer
    this.scene.time.addEvent({
      delay: 3000,
      callback: () => {
        if (this.stateManager.getState().stage !== EvolutionStage.EGG && !this.mouthOpen) {
          this.blink();
        }
      },
      loop: true,
    });
  }

  /**
   * Blink animation
   */
  private blink(): void {
    const stage = this.stateManager.getState().stage;

    if (stage === EvolutionStage.EGG) return;

    this.isBlinking = true;

    const stageKey =
      stage === EvolutionStage.BABY
        ? 'baby'
        : stage === EvolutionStage.CHILD
        ? 'child'
        : 'adult';

    // Play blink animation
    this.sprite.play(`${stageKey}-blink`);

    // When blink finishes, return to idle or mood sprite
    this.sprite.once('animationcomplete', () => {
      this.isBlinking = false;
      this.updateSprite();
    });
  }

  /**
   * Set mouth open state (for eating animation)
   */
  setMouthOpen(open: boolean): void {
    this.mouthOpen = open;
    const stage = this.stateManager.getState().stage;

    if (stage === EvolutionStage.EGG) return;

    const stageKey =
      stage === EvolutionStage.BABY
        ? 'baby'
        : stage === EvolutionStage.CHILD
        ? 'child'
        : 'adult';

    if (open) {
      // Play eat animation
      this.sprite.play(`${stageKey}-eat`);
    } else {
      // Return to idle or mood sprite
      this.updateSprite();
    }
  }

  /**
   * Update visual based on state changes (evolution, stats)
   */
  updateVisual(): void {
    const newStage = this.stateManager.getState().stage;
    if (newStage !== this.currentStage) {
      this.currentStage = newStage;
    }
    this.updateSprite();
  }

  /**
   * Play squish animation (for eating/playing)
   */
  playSquishAnimation(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.9,
      scaleY: 1.1,
      duration: 150,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    this.scene.tweens.killTweensOf(this);
    super.destroy(fromScene);
  }
}
