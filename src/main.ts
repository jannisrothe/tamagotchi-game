/**
 * Main Entry Point
 * Initializes Phaser game and starts the main scene
 */

import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { CANVAS_SIZE } from './utils/Constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CANVAS_SIZE.WIDTH,
  height: CANVAS_SIZE.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#c8e6c9',
  pixelArt: false,
  antialias: true,
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Create the game instance
const game = new Phaser.Game(config);

// Expose game to window for debugging
(window as any).phaserGame = game;

export default game;
