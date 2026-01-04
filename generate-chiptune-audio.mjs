import fs from 'fs';

// ==========================================
// CHIPTUNE AUDIO GENERATOR
// ==========================================
// Generates retro/chiptune style sound effects
// using classic waveforms (square, triangle, sawtooth)

// Helper: Create WAV file header
function createWAVHeader(dataSize, sampleRate = 44100, numChannels = 1, bitsPerSample = 16) {
    const buffer = Buffer.alloc(44);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28);
    buffer.writeUInt16LE(numChannels * bitsPerSample / 8, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    return buffer;
}

// Waveform generators (classic chiptune)
const waveforms = {
    square: (t, freq) => Math.sign(Math.sin(2 * Math.PI * freq * t)),
    triangle: (t, freq) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t)),
    sawtooth: (t, freq) => 2 * (t * freq - Math.floor(0.5 + t * freq)),
    sine: (t, freq) => Math.sin(2 * Math.PI * freq * t)
};

// ADSR envelope generator
function adsr(t, duration, attack, decay, sustain, release) {
    if (t < attack) {
        return t / attack; // Attack: 0 -> 1
    } else if (t < attack + decay) {
        return 1 - ((1 - sustain) * (t - attack) / decay); // Decay: 1 -> sustain
    } else if (t < duration - release) {
        return sustain; // Sustain
    } else {
        return sustain * (duration - t) / release; // Release: sustain -> 0
    }
}

// Generate chiptune sound with parameters
function generateChiptuneSound(config) {
    const {
        duration,
        startFreq,
        endFreq = startFreq,
        waveform = 'square',
        volume = 0.3,
        attack = 0.01,
        decay = 0.05,
        sustain = 0.7,
        release = 0.1,
        dutyCycle = 0.5
    } = config;

    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const samples = Buffer.alloc(numSamples * 2);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;

        // Frequency sweep (for pitch bending)
        const freq = startFreq + (endFreq - startFreq) * (t / duration);

        // Generate waveform
        let value = waveforms[waveform](t, freq);

        // Apply envelope
        const envelope = adsr(t, duration, attack, decay, sustain, release);

        // Apply volume and convert to 16-bit PCM
        const sample = Math.floor(value * envelope * volume * 32767);
        samples.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), i * 2);
    }

    return samples;
}

// Save WAV file
function saveWAV(filename, samples) {
    const header = createWAVHeader(samples.length);
    const wav = Buffer.concat([header, samples]);
    fs.writeFileSync(filename, wav);
}

console.log('🎮 Generating chiptune sound effects...\n');

// ==========================================
// SOUND EFFECT 1: EAT (satisfying pickup sound)
// ==========================================
console.log('Generating eat.wav...');
const eatSamples = generateChiptuneSound({
    duration: 0.15,
    startFreq: 600,
    endFreq: 800,
    waveform: 'square',
    volume: 0.35,
    attack: 0.005,
    decay: 0.03,
    sustain: 0.6,
    release: 0.05
});
saveWAV('assets/audio/eat.wav', eatSamples);
fs.copyFileSync('assets/audio/eat.wav', 'public/assets/audio/eat.wav');
console.log('✓ eat.wav (satisfying "nom" sound)');

// ==========================================
// SOUND EFFECT 2: PLAY (bouncy, playful jump)
// ==========================================
console.log('Generating play.wav...');
const playSamples = generateChiptuneSound({
    duration: 0.25,
    startFreq: 800,
    endFreq: 1200,
    waveform: 'square',
    volume: 0.3,
    attack: 0.01,
    decay: 0.08,
    sustain: 0.5,
    release: 0.1
});
saveWAV('assets/audio/play.wav', playSamples);
fs.copyFileSync('assets/audio/play.wav', 'public/assets/audio/play.wav');
console.log('✓ play.wav (bouncy jump sound)');

// ==========================================
// SOUND EFFECT 3: CLEAN (sweeping powerup)
// ==========================================
console.log('Generating clean.wav...');
const cleanSamples = generateChiptuneSound({
    duration: 0.3,
    startFreq: 400,
    endFreq: 1400,
    waveform: 'triangle',
    volume: 0.3,
    attack: 0.02,
    decay: 0.05,
    sustain: 0.7,
    release: 0.15
});
saveWAV('assets/audio/clean.wav', cleanSamples);
fs.copyFileSync('assets/audio/clean.wav', 'public/assets/audio/clean.wav');
console.log('✓ clean.wav (sweeping clean sound)');

// ==========================================
// SOUND EFFECT 4: HEAL (pleasant chime)
// ==========================================
console.log('Generating heal.wav...');
// Generate two-tone heal sound (harmony)
const sampleRate = 44100;
const healDuration = 0.4;
const healSamples1 = generateChiptuneSound({
    duration: healDuration,
    startFreq: 1200,
    waveform: 'triangle',
    volume: 0.2,
    attack: 0.02,
    decay: 0.1,
    sustain: 0.5,
    release: 0.2
});
const healSamples2 = generateChiptuneSound({
    duration: healDuration,
    startFreq: 1600,
    waveform: 'triangle',
    volume: 0.2,
    attack: 0.02,
    decay: 0.1,
    sustain: 0.5,
    release: 0.2
});
// Mix the two tones
const healSamples = Buffer.alloc(healSamples1.length);
for (let i = 0; i < healSamples1.length; i += 2) {
    const sample1 = healSamples1.readInt16LE(i);
    const sample2 = healSamples2.readInt16LE(i);
    const mixed = Math.floor((sample1 + sample2) / 2);
    healSamples.writeInt16LE(mixed, i);
}
saveWAV('assets/audio/heal.wav', healSamples);
fs.copyFileSync('assets/audio/heal.wav', 'public/assets/audio/heal.wav');
console.log('✓ heal.wav (pleasant healing chime)');

// ==========================================
// SOUND EFFECT 5: EVOLVE (triumphant fanfare)
// ==========================================
console.log('Generating evolve.wav...');
// Generate ascending 3-note fanfare
const evolveDuration = 0.8;
const evolveNumSamples = Math.floor(sampleRate * evolveDuration);
const evolveSamples = Buffer.alloc(evolveNumSamples * 2);

const notes = [
    { freq: 800, start: 0, duration: 0.25 },
    { freq: 1000, start: 0.25, duration: 0.25 },
    { freq: 1200, start: 0.5, duration: 0.3 }
];

for (let i = 0; i < evolveNumSamples; i++) {
    const t = i / sampleRate;
    let value = 0;

    for (const note of notes) {
        if (t >= note.start && t < note.start + note.duration) {
            const noteT = t - note.start;
            const noteValue = waveforms.square(noteT, note.freq);
            const envelope = adsr(noteT, note.duration, 0.02, 0.05, 0.7, 0.15);
            value += noteValue * envelope;
        }
    }

    const sample = Math.floor(value * 0.25 * 32767);
    evolveSamples.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), i * 2);
}
saveWAV('assets/audio/evolve.wav', evolveSamples);
fs.copyFileSync('assets/audio/evolve.wav', 'public/assets/audio/evolve.wav');
console.log('✓ evolve.wav (triumphant evolution fanfare)');

// ==========================================
// SOUND EFFECT 6: CLICK (crisp UI blip)
// ==========================================
console.log('Generating click.wav...');
const clickSamples = generateChiptuneSound({
    duration: 0.08,
    startFreq: 1000,
    waveform: 'square',
    volume: 0.25,
    attack: 0.002,
    decay: 0.02,
    sustain: 0.3,
    release: 0.03
});
saveWAV('assets/audio/click.wav', clickSamples);
fs.copyFileSync('assets/audio/click.wav', 'public/assets/audio/click.wav');
console.log('✓ click.wav (crisp UI click)');

// ==========================================
// BACKGROUND MUSIC (simple looping chiptune melody)
// ==========================================
console.log('\n🎵 Generating background music...');

// Simple 8-bar chiptune melody (C major scale)
const bpm = 140;
const beatDuration = 60 / bpm;
const musicDuration = beatDuration * 32; // 32 beats = 8 bars

const musicNumSamples = Math.floor(sampleRate * musicDuration);
const musicSamples = Buffer.alloc(musicNumSamples * 2);

// Melody notes (frequency, beat, duration in beats)
const melody = [
    // Bar 1-2
    { freq: 523, beat: 0, duration: 1 },    // C
    { freq: 659, beat: 1, duration: 1 },    // E
    { freq: 784, beat: 2, duration: 1 },    // G
    { freq: 659, beat: 3, duration: 1 },    // E
    { freq: 523, beat: 4, duration: 1 },    // C
    { freq: 659, beat: 5, duration: 1 },    // E
    { freq: 784, beat: 6, duration: 2 },    // G (longer)

    // Bar 3-4
    { freq: 587, beat: 8, duration: 1 },    // D
    { freq: 698, beat: 9, duration: 1 },    // F
    { freq: 880, beat: 10, duration: 1 },   // A
    { freq: 698, beat: 11, duration: 1 },   // F
    { freq: 587, beat: 12, duration: 1 },   // D
    { freq: 698, beat: 13, duration: 1 },   // F
    { freq: 880, beat: 14, duration: 2 },   // A (longer)

    // Bar 5-6 (repeat bar 1-2)
    { freq: 523, beat: 16, duration: 1 },
    { freq: 659, beat: 17, duration: 1 },
    { freq: 784, beat: 18, duration: 1 },
    { freq: 659, beat: 19, duration: 1 },
    { freq: 523, beat: 20, duration: 1 },
    { freq: 659, beat: 21, duration: 1 },
    { freq: 784, beat: 22, duration: 2 },

    // Bar 7-8 (ending)
    { freq: 784, beat: 24, duration: 1 },
    { freq: 659, beat: 25, duration: 1 },
    { freq: 587, beat: 26, duration: 1 },
    { freq: 523, beat: 27, duration: 1 },
    { freq: 523, beat: 28, duration: 4 }    // Final C (long)
];

// Bass line (plays with melody)
const bass = [
    { freq: 262, beat: 0, duration: 4 },    // C
    { freq: 294, beat: 4, duration: 4 },    // D
    { freq: 262, beat: 8, duration: 4 },    // C
    { freq: 349, beat: 12, duration: 4 },   // F
    { freq: 262, beat: 16, duration: 4 },   // C
    { freq: 294, beat: 20, duration: 4 },   // D
    { freq: 392, beat: 24, duration: 4 },   // G
    { freq: 262, beat: 28, duration: 4 }    // C
];

for (let i = 0; i < musicNumSamples; i++) {
    const t = i / sampleRate;
    let value = 0;

    // Play melody
    for (const note of melody) {
        const noteStart = note.beat * beatDuration;
        const noteDuration = note.duration * beatDuration;
        if (t >= noteStart && t < noteStart + noteDuration) {
            const noteT = t - noteStart;
            const noteValue = waveforms.square(noteT, note.freq);
            const envelope = adsr(noteT, noteDuration, 0.01, 0.05, 0.7, 0.1);
            value += noteValue * envelope * 0.15;
        }
    }

    // Play bass
    for (const note of bass) {
        const noteStart = note.beat * beatDuration;
        const noteDuration = note.duration * beatDuration;
        if (t >= noteStart && t < noteStart + noteDuration) {
            const noteT = t - noteStart;
            const noteValue = waveforms.triangle(noteT, note.freq);
            const envelope = adsr(noteT, noteDuration, 0.02, 0.1, 0.8, 0.15);
            value += noteValue * envelope * 0.12;
        }
    }

    const sample = Math.floor(value * 32767);
    musicSamples.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), i * 2);
}

saveWAV('assets/audio/background.wav', musicSamples);
fs.copyFileSync('assets/audio/background.wav', 'public/assets/audio/background.wav');
console.log(`✓ background.wav (${Math.round(musicDuration)}s chiptune loop)`);

console.log('\n✅ All chiptune audio files generated!');
console.log('📊 File summary:');
console.log(`   - 6 sound effects (eat, play, clean, heal, evolve, click)`);
console.log(`   - 1 background music (${Math.round(musicDuration)}s loop)`);
console.log('   - Classic chiptune style with square/triangle waves');
console.log('   - Ready for deployment!');
