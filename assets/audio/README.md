# Audio Assets

This directory contains audio files for the Tamagotchi game.

## Structure

- `effects/` - Sound effect files (optional, currently using jsfxr generated sounds)
- `music/` - Background music files (optional, currently using jsfxr generated music)

## Current Implementation

Audio is currently generated procedurally using jsfxr library loaded via CDN. This approach:

- ✅ Keeps the game lightweight with no external audio files
- ✅ Maintains authentic 8-bit retro aesthetic  
- ✅ Allows for easy customization of sound parameters

## Future Enhancement

To add custom audio files:
1. Place WAV/MP3/OGG files in appropriate subdirectories
2. Update AudioManager.ts to load files instead of generating procedurally
3. Update file paths in generateSoundEffects() and generateBackgroundMusic() methods