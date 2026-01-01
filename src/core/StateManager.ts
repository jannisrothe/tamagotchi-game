/**
 * StateManager
 * Centralized state management with event-driven updates
 * Fixes: Prevents race conditions and provides single source of truth
 */

import { EventEmitter } from './EventEmitter';
import { EVENTS, EvolutionStage } from '../utils/Constants';

export interface GameData {
  // Stats
  hunger: number;
  happiness: number;
  health: number;

  // Pet info
  age: number; // in seconds
  stage: EvolutionStage;
  petName: string;

  // Status flags
  isSick: boolean;
  isAlive: boolean;
  isPaused: boolean;
  isSleeping: boolean;

  // Time tracking
  birthTime: number;
  pausedTime: number;
  lastSaveTime: number;

  // Poop tracking
  poopCount: number;
}

export class StateManager {
  private state: GameData;
  private events: EventEmitter;

  constructor(events: EventEmitter) {
    this.events = events;

    // Initialize with default state
    this.state = this.getDefaultState();
  }

  /**
   * Get default initial state
   */
  private getDefaultState(): GameData {
    return {
      hunger: 100,
      happiness: 100,
      health: 100,
      age: 0,
      stage: EvolutionStage.EGG,
      petName: 'TAMA',
      isSick: false,
      isAlive: true,
      isPaused: false,
      isSleeping: false,
      birthTime: Date.now(),
      pausedTime: 0,
      lastSaveTime: Date.now(),
      poopCount: 0,
    };
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<GameData> {
    return { ...this.state };
  }

  /**
   * Update stats and emit changes
   */
  updateStats(updates: Partial<Pick<GameData, 'hunger' | 'happiness' | 'health'>>): void {
    let changed = false;

    if (updates.hunger !== undefined) {
      this.state.hunger = Math.max(0, Math.min(100, updates.hunger));
      changed = true;
    }
    if (updates.happiness !== undefined) {
      this.state.happiness = Math.max(0, Math.min(100, updates.happiness));
      changed = true;
    }
    if (updates.health !== undefined) {
      this.state.health = Math.max(0, Math.min(100, updates.health));
      changed = true;
    }

    if (changed) {
      this.events.emit(EVENTS.STATS_CHANGED, {
        hunger: this.state.hunger,
        happiness: this.state.happiness,
        health: this.state.health,
      });
    }
  }

  /**
   * Set pet name
   */
  setPetName(name: string): void {
    this.state.petName = name.toUpperCase().substring(0, 12);
  }

  /**
   * Set evolution stage
   */
  setStage(stage: EvolutionStage): void {
    const oldStage = this.state.stage;
    this.state.stage = stage;

    if (oldStage !== stage) {
      this.events.emit(EVENTS.PET_EVOLVED, { from: oldStage, to: stage });
    }
  }

  /**
   * Update age
   */
  updateAge(ageInSeconds: number): void {
    this.state.age = ageInSeconds;
  }

  /**
   * Set sick status
   */
  setSick(isSick: boolean): void {
    this.state.isSick = isSick;
  }

  /**
   * Set pause state
   */
  setPaused(isPaused: boolean): void {
    this.state.isPaused = isPaused;
  }

  /**
   * Set sleeping state
   */
  setSleeping(isSleeping: boolean): void {
    this.state.isSleeping = isSleeping;
  }

  /**
   * Update poop count
   */
  updatePoopCount(count: number): void {
    this.state.poopCount = Math.max(0, count);
  }

  /**
   * Mark pet as dead
   */
  setDead(): void {
    if (!this.state.isAlive) return;

    this.state.isAlive = false;
    this.events.emit(EVENTS.PET_DIED, { age: this.state.age, stage: this.state.stage });
  }

  /**
   * Update paused time tracking
   */
  updatePausedTime(additionalTime: number): void {
    this.state.pausedTime += additionalTime;
  }

  /**
   * Get current stats as average (for mood calculation)
   */
  getAverageStats(): number {
    return (this.state.hunger + this.state.happiness + this.state.health) / 3;
  }

  /**
   * Load state from save data
   */
  loadState(saveData: Partial<GameData>): void {
    this.state = { ...this.state, ...saveData };
    this.events.emit(EVENTS.STATS_CHANGED, {
      hunger: this.state.hunger,
      happiness: this.state.happiness,
      health: this.state.health,
    });
  }

  /**
   * Reset to default state (new game)
   */
  reset(): void {
    this.state = this.getDefaultState();
    this.events.emit(EVENTS.STATS_CHANGED, {
      hunger: this.state.hunger,
      happiness: this.state.happiness,
      health: this.state.health,
    });
  }

  /**
   * Export state for saving
   */
  export(): GameData {
    return { ...this.state, lastSaveTime: Date.now() };
  }
}
