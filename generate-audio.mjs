import fs from 'fs';

// Generate a simple WAV file with a beep sound
function generateWAV(frequency, duration, filename) {
    const sampleRate = 44100;
    const numSamples = sampleRate * duration;
    const amplitude = 0.3;

    // Create WAV header
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Chunk size
    buffer.writeUInt16LE(1, 20); // Audio format (1 = PCM)
    buffer.writeUInt16LE(1, 22); // Number of channels (1 = mono)
    buffer.writeUInt32LE(sampleRate, 24); // Sample rate
    buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
    buffer.writeUInt16LE(2, 32); // Block align
    buffer.writeUInt16LE(16, 34); // Bits per sample

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Generate sine wave samples
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const value = Math.sin(2 * Math.PI * frequency * t) * amplitude * 32767;
        buffer.writeInt16LE(Math.floor(value), 44 + i * 2);
    }

    fs.writeFileSync(filename, buffer);
    console.log(`✓ Generated ${filename}`);
}

// Generate sound effects
console.log('Generating placeholder audio files...');

// Eat sound - short medium beep
generateWAV(800, 0.15, 'assets/audio/eat.wav');
fs.copyFileSync('assets/audio/eat.wav', 'public/assets/audio/eat.wav');

// Play sound - higher playful beep
generateWAV(1200, 0.2, 'assets/audio/play.wav');
fs.copyFileSync('assets/audio/play.wav', 'public/assets/audio/play.wav');

// Clean sound - sweeping sound (lower frequency)
generateWAV(600, 0.25, 'assets/audio/clean.wav');
fs.copyFileSync('assets/audio/clean.wav', 'public/assets/audio/clean.wav');

// Heal sound - pleasant chime (higher frequency)
generateWAV(1500, 0.3, 'assets/audio/heal.wav');
fs.copyFileSync('assets/audio/heal.wav', 'public/assets/audio/heal.wav');

// Evolve sound - longer triumphant sound
generateWAV(1000, 0.5, 'assets/audio/evolve.wav');
fs.copyFileSync('assets/audio/evolve.wav', 'public/assets/audio/evolve.wav');

// Click sound - very short beep
generateWAV(900, 0.08, 'assets/audio/click.wav');
fs.copyFileSync('assets/audio/click.wav', 'public/assets/audio/click.wav');

// Background music - longer looping melody (simple tone)
generateWAV(440, 2.0, 'assets/audio/background.wav');
fs.copyFileSync('assets/audio/background.wav', 'public/assets/audio/background.wav');

console.log('✓ All audio files generated!');
console.log('Note: These are simple placeholder beeps.');
console.log('Replace with better audio later for production.');
