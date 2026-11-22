// ============================================================================
// Ember Court — audio.js
// ONE JOB: tiny WebAudio bleeps generated in code. No audio files, no
// network: every sound is an oscillator envelope built at play time.
// A single AudioContext is created lazily on the first user gesture (the
// browser rule), and a mute toggle silences everything.
// ============================================================================

let ctx = null;
let muted = false;

/** Create (or reuse) the AudioContext. Must be called from a user gesture
 *  the first time, or the browser keeps it suspended. */
export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** True when sound is currently muted. */
export function isMuted() { return muted; }

/** Toggle mute; returns the new muted state (for the button label). */
export function toggleMute() {
  muted = !muted;
  return muted;
}

/**
 * Play one bleep: an oscillator at `freq` Hz, sliding to `slideTo` Hz,
 * lasting `dur` seconds, at `vol` volume, with a fast attack and a soft
 * release so nothing clicks. `type` is 'sine' | 'triangle' | 'square'.
 */
export function bleep(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  } catch (e) { /* sound is cosmetic; never break the game for it */ }
}

/** Named sound effects, each a tiny phrase of bleeps. */
export const sfx = {
  playCard() { bleep(520, 0.12, 'triangle', 0.12, 760); },
  unplayable() { bleep(140, 0.15, 'square', 0.06, 110); },
  hit() { bleep(220, 0.14, 'square', 0.10, 90); },
  bigHit() { bleep(180, 0.22, 'square', 0.14, 60); bleep(320, 0.18, 'triangle', 0.08, 140); },
  block() { bleep(340, 0.10, 'sine', 0.10, 420); },
  heal() { bleep(660, 0.18, 'sine', 0.09, 880); },
  combo() {
    bleep(523, 0.10, 'triangle', 0.12);
    window.setTimeout(() => bleep(659, 0.10, 'triangle', 0.12), 90);
    window.setTimeout(() => bleep(784, 0.16, 'triangle', 0.13), 180);
  },
  draw() { bleep(700, 0.07, 'sine', 0.07, 900); },
  endTurn() { bleep(440, 0.10, 'triangle', 0.10, 330); },
  enemyTurn() { bleep(330, 0.12, 'triangle', 0.09, 220); },
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => window.setTimeout(() => bleep(n, 0.22, 'triangle', 0.13), i * 130));
  },
  lose() {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => window.setTimeout(() => bleep(n, 0.25, 'sine', 0.11), i * 160));
  },
  click() { bleep(600, 0.05, 'sine', 0.06, 700); },
  relic() { bleep(880, 0.2, 'sine', 0.10, 1320); },
};
