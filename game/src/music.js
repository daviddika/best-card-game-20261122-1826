// ============================================================================
// Ember Court — music.js
// ONE JOB: generative ambient music, built from WebAudio oscillators in
// code — no audio files, no network. A slow minor-key pad (the court's
// theme) plus a sparse plucked melody that changes with the game state:
// the title theme is calm, battle adds a pulse, victory lifts to major.
// The music shares the mute toggle with the sound effects in audio.js.
// ============================================================================

import { ensureAudio, isMuted } from './audio.js';

// The court's theme: A minor, slow and stately. Frequencies in Hz.
const PAD_CHORDS = [
  [110.00, 130.81, 164.81],   // A minor
  [87.31, 110.00, 130.81],    // F major
  [98.00, 123.47, 146.83],     // G major
  [82.41, 98.00, 123.47],      // E minor
];
const MELODY_NOTES = [220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 329.63, 261.63];
const VICTORY_NOTES = [261.63, 329.63, 392.00, 523.25, 659.25, 784.00];

let musicTimer = null;
let chordIndex = 0;
let melodyIndex = 0;
let mode = 'title'; // 'title' | 'battle' | 'victory' | 'defeat'
let padNodes = [];

/** Start the generative music loop (called once, after a user gesture). */
export function startMusic() {
  if (musicTimer !== null) return;
  musicTimer = window.setInterval(musicTick, 1400);
}

/** Stop the music entirely (keeps sound effects working). */
export function stopMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  stopPad();
}

/** Change the musical mode; battle is tenser, victory lifts. */
export function setMusicMode(nextMode) {
  mode = nextMode;
  if (mode === 'victory') melodyIndex = 0;
}

/** One tick: hold the current pad chord, maybe pluck a melody note. */
function musicTick() {
  if (isMuted()) { stopPad(); return; }
  const ac = ensureAudio();
  if (!ac) return;
  const bar = Math.floor((chordIndex / 2) % PAD_CHORDS.length);
  const chord = PAD_CHORDS[bar];
  playPadChord(ac, chord);
  chordIndex++;
  // Melody: sparse on the title screen, busier in battle, bright on victory.
  const melodyChance = mode === 'battle' ? 0.75 : mode === 'victory' ? 0.9 : 0.4;
  if (Math.random() < melodyChance) {
    const notes = mode === 'victory' ? VICTORY_NOTES : MELODY_NOTES;
    const freq = notes[melodyIndex % notes.length];
    melodyIndex += mode === 'victory' ? 1 : (Math.random() < 0.5 ? 1 : 2);
    pluckNote(ac, freq, mode === 'battle' ? 0.05 : 0.07);
  }
}

/** Hold a soft pad chord for one tick, cross-fading from the last one. */
function playPadChord(ac, chord) {
  stopPad();
  const now = ac.currentTime;
  for (const freq of chord) {
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.6);
      gain.gain.setValueAtTime(0.035, now + 1.1);
      gain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 1.55);
      padNodes.push({ osc, gain });
    } catch (e) { /* music is cosmetic; never break the game */ }
  }
}

/** Fade out and drop the current pad voices. */
function stopPad() {
  for (const { osc } of padNodes) {
    try { osc.stop(); } catch (e) { /* already stopped */ }
  }
  padNodes = [];
}

/** A short plucked note: triangle wave, quick attack, gentle decay. */
function pluckNote(ac, freq, vol) {
  try {
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.95);
  } catch (e) { /* cosmetic */ }
}
