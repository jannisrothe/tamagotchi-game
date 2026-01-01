/**
 * Game Constants
 * Centralized configuration for game mechanics and timings
 */

export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  BACKGROUND_COLOR: '#c8e6c9',
  TITLE: 'TAMAGOTCHI',
} as const;

export const CANVAS_SIZE = {
  WIDTH: 300,
  HEIGHT: 300,
} as const;

// Evolution timings (in seconds) - fast for testing
export const EVOLUTION_TIMES = {
  EGG_TO_BABY: 10,    // 10 seconds
  BABY_TO_CHILD: 30,  // 30 seconds
  CHILD_TO_ADULT: 60, // 60 seconds
} as const;

// Stats degradation rates (per second)
export const STAT_RATES = {
  HUNGER_DECAY: 0.2,
  HAPPINESS_DECAY: 0.1,
  HEALTH_DECAY_DIRTY: 0.5,
  HEALTH_DECAY_SICK: 0.1,
} as const;

// Interaction values
export const INTERACTION_VALUES = {
  FEED_HUNGER_GAIN: 20,
  PLAY_HAPPINESS_GAIN: 20,
  PLAY_HUNGER_COST: 2.5,
  CLEAN_HEALTH_GAIN: 15,
  HEAL_HEALTH_GAIN: 25,
} as const;

// Pet states
export enum PetState {
  IDLE = 'IDLE',
  EATING = 'EATING',
  PLAYING = 'PLAYING',
  SLEEPING = 'SLEEPING',
  SICK = 'SICK',
  EVOLVING = 'EVOLVING',
  DEAD = 'DEAD',
}

// Game states
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

// Evolution stages
export enum EvolutionStage {
  EGG = 'egg',
  BABY = 'baby',
  CHILD = 'child',
  ADULT = 'adult',
}

// Color palettes for different stages
export const STAGE_COLORS = {
  [EvolutionStage.EGG]: {
    primary: 0xa8d8ea,
    secondary: 0xaa96da,
    accent: 0xfcbad3,
  },
  [EvolutionStage.BABY]: {
    primary: 0xffb6b9,
    secondary: 0xfae3d9,
    accent: 0xff6b9d,
  },
  [EvolutionStage.CHILD]: {
    primary: 0x92e3a9,
    secondary: 0x7ec4cf,
    accent: 0x4ecdc4,
  },
  [EvolutionStage.ADULT]: {
    primary: 0xff9a56,
    secondary: 0xffcd38,
    accent: 0xff5e5b,
  },
} as const;

// UI colors
export const UI_COLORS = {
  HUNGER_BAR: 0xff6b6b,
  HAPPINESS_BAR: 0xffd93d,
  HEALTH_BAR: 0x4ecdc4,
  TEXT_PRIMARY: 0x2d3748,
  TEXT_SECONDARY: 0x718096,
} as const;

// Save/load keys
export const STORAGE_KEYS = {
  GAME_SAVE: 'tamagotchi_save_v2',
  SETTINGS: 'tamagotchi_settings',
} as const;

// Event names
export const EVENTS = {
  STATS_CHANGED: 'stats:changed',
  PET_EVOLVED: 'pet:evolved',
  PET_DIED: 'pet:died',
  INTERACTION_STARTED: 'interaction:started',
  INTERACTION_ENDED: 'interaction:ended',
  GAME_STATE_CHANGED: 'game:state:changed',
  PET_STATE_CHANGED: 'pet:state:changed',
} as const;

export default {
  GAME_CONFIG,
  CANVAS_SIZE,
  EVOLUTION_TIMES,
  STAT_RATES,
  INTERACTION_VALUES,
  PetState,
  GameState,
  EvolutionStage,
  STAGE_COLORS,
  UI_COLORS,
  STORAGE_KEYS,
  EVENTS,
};
