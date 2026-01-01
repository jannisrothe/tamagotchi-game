/**
 * Save Manager
 * Handles localStorage operations for game persistence
 */

import { GameData } from '../core/StateManager';
import { STORAGE_KEYS } from './Constants';

export interface Settings {
  soundVolume: number;
  musicVolume: number;
  difficulty: 'easy' | 'normal' | 'hard';
}

export class SaveManager {
  /**
   * Save game data to localStorage
   */
  static saveGame(data: GameData): boolean {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEYS.GAME_SAVE, json);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game data from localStorage
   */
  static loadGame(): GameData | null {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.GAME_SAVE);
      if (!json) return null;

      const data = JSON.parse(json) as GameData;

      // Handle time passed while game was closed
      const timePassed = Math.floor((Date.now() - data.lastSaveTime) / 1000);

      // Only degrade stats if not paused
      if (!data.isPaused) {
        data.hunger = Math.max(0, data.hunger - timePassed * 0.2);
        data.happiness = Math.max(0, data.happiness - timePassed * 0.1);
        data.health = Math.max(0, data.health - timePassed * 0.1);
      }

      return data;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Delete saved game
   */
  static deleteSave(): void {
    localStorage.removeItem(STORAGE_KEYS.GAME_SAVE);
  }

  /**
   * Check if save exists
   */
  static hasSave(): boolean {
    return localStorage.getItem(STORAGE_KEYS.GAME_SAVE) !== null;
  }

  /**
   * Save settings
   */
  static saveSettings(settings: Settings): boolean {
    try {
      const json = JSON.stringify(settings);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, json);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Load settings
   */
  static loadSettings(): Settings {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!json) {
        return SaveManager.getDefaultSettings();
      }

      return JSON.parse(json) as Settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return SaveManager.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  static getDefaultSettings(): Settings {
    return {
      soundVolume: 0.7,
      musicVolume: 0.5,
      difficulty: 'normal',
    };
  }
}
