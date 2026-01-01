/**
 * Stats System
 * Manages hunger, happiness, health degradation and updates
 * CRITICAL FIX: Properly cleans up timers to prevent memory leaks
 */

import { EventEmitter } from '../core/EventEmitter';
import { StateManager } from '../core/StateManager';
import { STAT_RATES, EVOLUTION_TIMES, EvolutionStage } from '../utils/Constants';

export class StatsSystem {
  private events: EventEmitter;
  private stateManager: StateManager;
  private updateInterval: number | null = null;
  private ageInterval: number | null = null;
  private poopInterval: number | null = null;

  constructor(events: EventEmitter, stateManager: StateManager) {
    this.events = events;
    this.stateManager = stateManager;
  }

  /**
   * Start the stats system
   * CRITICAL: Now properly tracks interval IDs for cleanup
   */
  start(): void {
    // Stats degradation loop (1 second intervals)
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 1000);

    // Age tracking loop (1 second intervals)
    this.ageInterval = window.setInterval(() => {
      this.updateAge();
    }, 1000);

    // Poop generation loop (15 second intervals)
    this.poopInterval = window.setInterval(() => {
      this.generatePoop();
    }, 15000);
  }

  /**
   * Stop the stats system and clean up all timers
   * CRITICAL FIX: Prevents memory leaks
   */
  stop(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.ageInterval !== null) {
      clearInterval(this.ageInterval);
      this.ageInterval = null;
    }
    if (this.poopInterval !== null) {
      clearInterval(this.poopInterval);
      this.poopInterval = null;
    }
  }

  /**
   * Main stats update loop
   */
  private update(): void {
    const state = this.stateManager.getState();

    // Don't update if paused, sleeping, or dead
    if (state.isPaused || state.isSleeping || !state.isAlive) {
      return;
    }

    // Degrade stats over time
    const newHunger = Math.max(0, state.hunger - STAT_RATES.HUNGER_DECAY);
    const newHappiness = Math.max(0, state.happiness - STAT_RATES.HAPPINESS_DECAY);

    let newHealth = state.health;

    // Health degrades faster with poop
    if (state.poopCount > 0) {
      newHealth = Math.max(0, newHealth - STAT_RATES.HEALTH_DECAY_DIRTY);
    }

    // Health degrades if hungry or unhappy
    if (state.hunger < 30 || state.happiness < 30) {
      newHealth = Math.max(0, newHealth - STAT_RATES.HEALTH_DECAY_SICK);
    }

    // Update stats
    this.stateManager.updateStats({
      hunger: newHunger,
      happiness: newHappiness,
      health: newHealth,
    });

    // Check if pet should become sick
    if (newHealth < 30 && !state.isSick) {
      this.stateManager.setSick(true);
    }

    // Check death conditions (only for child/adult stages)
    if (
      (newHunger === 0 || newHealth === 0) &&
      state.stage !== EvolutionStage.EGG &&
      state.stage !== EvolutionStage.BABY
    ) {
      this.stateManager.setDead();
    }
  }

  /**
   * Update pet age and handle evolution
   */
  private updateAge(): void {
    const state = this.stateManager.getState();

    if (state.isPaused || !state.isAlive) {
      return;
    }

    const ageInSeconds = Math.floor(
      (Date.now() - state.birthTime - state.pausedTime) / 1000
    );
    this.stateManager.updateAge(ageInSeconds);

    // Check evolution conditions
    this.checkEvolution(ageInSeconds, state.stage);
  }

  /**
   * Check if pet should evolve
   */
  private checkEvolution(age: number, currentStage: EvolutionStage): void {
    let newStage: EvolutionStage | null = null;

    if (currentStage === EvolutionStage.EGG && age >= EVOLUTION_TIMES.EGG_TO_BABY) {
      newStage = EvolutionStage.BABY;
    } else if (currentStage === EvolutionStage.BABY && age >= EVOLUTION_TIMES.BABY_TO_CHILD) {
      newStage = EvolutionStage.CHILD;
    } else if (currentStage === EvolutionStage.CHILD && age >= EVOLUTION_TIMES.CHILD_TO_ADULT) {
      newStage = EvolutionStage.ADULT;
    }

    if (newStage) {
      this.stateManager.setStage(newStage);
    }
  }

  /**
   * Generate random poop (max 3)
   */
  private generatePoop(): void {
    const state = this.stateManager.getState();

    if (
      state.isPaused ||
      state.stage === EvolutionStage.EGG ||
      state.poopCount >= 3
    ) {
      return;
    }

    // 40% chance to generate poop
    if (Math.random() < 0.4) {
      this.stateManager.updatePoopCount(state.poopCount + 1);
    }
  }

  /**
   * Clean up all poop
   */
  cleanPoop(): void {
    this.stateManager.updatePoopCount(0);
  }

  /**
   * Pause the system
   */
  pause(): void {
    this.stateManager.setPaused(true);
  }

  /**
   * Resume the system
   */
  resume(pauseDuration: number): void {
    this.stateManager.updatePausedTime(pauseDuration);
    this.stateManager.setPaused(false);
  }

  /**
   * Destroy the system and clean up
   * CRITICAL: Called on game reset/destroy
   */
  destroy(): void {
    this.stop();
  }
}
