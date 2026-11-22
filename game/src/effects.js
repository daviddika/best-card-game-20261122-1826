// ============================================================================
// Ember Court — effects.js
// ONE JOB: juice. Floating damage numbers, the combo banner, screen shake,
// card-play snap animation and the victory confetti — everything that makes
// a dealt hand feel like it has weight and a win land with a flourish.
// No rules here: these functions only animate what battle.js already did.
// ============================================================================

import { FX } from './config.js';
import { casualRandom } from './random.js';

/** Float a number over a target element ("-9" over the enemy, "+6" over you).
 *  `kind` picks the colour: damage (red), heal (green), block (blue),
 *  combo (gold), ember (orange). Removes itself after the animation. */
export function floatNumber(targetEl, text, kind) {
  const layer = document.getElementById('float-layer');
  if (!layer || !targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const node = document.createElement('div');
  node.className = 'float-num float-' + (kind || 'damage');
  node.textContent = text;
  node.style.left = (rect.left - layerRect.left + rect.width / 2 + (casualRandom.float() * 30 - 15)) + 'px';
  node.style.top = (rect.top - layerRect.top + rect.height / 2) + 'px';
  layer.appendChild(node);
  window.setTimeout(() => node.remove(), FX.floatMs);
}

/** Turn a battle event list (from playPlayerCard) into floating numbers. */
export function showPlayEvents(events) {
  if (!events || !events.length) return;
  const enemyZone = document.getElementById('enemy-zone');
  const playerZone = document.getElementById('player-zone');
  for (const ev of events) {
    const target = ev.target === 'enemy' ? enemyZone : playerZone;
    if (ev.type === 'damage' || ev.type === 'thorns') {
      floatNumber(target, '-' + ev.value, 'damage');
    } else if (ev.type === 'heal') {
      floatNumber(target, '+' + ev.value, 'heal');
    } else if (ev.type === 'block') {
      floatNumber(target, '+' + ev.value + ' 🛡️', 'block');
    } else if (ev.type === 'combo') {
      floatNumber(target, 'COMBO ' + (ev.value > 0 ? '+' : '') + ev.value, 'combo');
    } else if (ev.type === 'burn') {
      floatNumber(target, '🔥 Burn ' + ev.value, 'burn');
    } else if (ev.type === 'weaken') {
      floatNumber(target, '🥀 Weaken', 'weaken');
    } else if (ev.type === 'strength') {
      floatNumber(target, '💪 +' + ev.value, 'strength');
    } else if (ev.type === 'ember') {
      floatNumber(target, '+' + ev.value + ' 🔥', 'ember');
    }
  }
}

/** Flash the combo banner across the table for a suit combo. */
export function showComboBanner(suitName, glyph, comboText) {
  const banner = document.getElementById('combo-banner');
  if (!banner) return;
  banner.textContent = glyph + ' ' + comboText;
  banner.classList.remove('hidden');
  banner.classList.remove('pop');
  // Force a reflow so the pop animation replays every time.
  void banner.offsetWidth;
  banner.classList.add('pop');
  window.setTimeout(() => banner.classList.add('hidden'), 1800);
}

/** A short shake of the table (big hits only). */
export function shakeTable(intensity) {
  const table = document.getElementById('table');
  if (!table) return;
  table.classList.remove('shake');
  void table.offsetWidth;
  table.style.setProperty('--shake', (intensity || 6) + 'px');
  table.classList.add('shake');
  window.setTimeout(() => table.classList.remove('shake'), 450);
}

/** Victory confetti: coloured pieces falling over the victory screen. */
export function launchConfetti() {
  const host = document.getElementById('confetti');
  if (!host) return;
  host.innerHTML = '';
  const colours = ['#ff5a2a', '#2aa8ff', '#37c978', '#b06cff', '#ffd23e', '#ff8fb3'];
  for (let i = 0; i < FX.confettiPieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = (casualRandom.float() * 100) + '%';
    piece.style.background = colours[i % colours.length];
    piece.style.animationDelay = (casualRandom.float() * 0.8) + 's';
    piece.style.animationDuration = (1.6 + casualRandom.float() * 1.4) + 's';
    piece.style.transform = 'rotate(' + Math.floor(casualRandom.float() * 360) + 'deg)';
    if (i % 3 === 0) piece.style.borderRadius = '50%';
    host.appendChild(piece);
  }
  window.setTimeout(() => { host.innerHTML = ''; }, FX.confettiMs + 1200);
}

/** Briefly highlight a just-played card slot (snap feedback). */
export function snapCard(cardEl) {
  if (!cardEl) return;
  cardEl.classList.add('just-played');
  window.setTimeout(() => cardEl.classList.remove('just-played'), 350);
}

/** Pulse the End Turn button when the player has no playable card left —
 *  a gentle nudge, not a demand. */
export function pulseEndTurn() {
  const btn = document.getElementById('btn-end-turn');
  if (!btn) return;
  btn.classList.add('pulse');
  window.setTimeout(() => btn.classList.remove('pulse'), 1200);
}

/** A one-line toast over the table (used for "Not enough Ember" etc.). */
export function toast(message) {
  let node = document.getElementById('game-toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'game-toast';
    document.getElementById('app').appendChild(node);
  }
  node.textContent = message;
  node.classList.add('show');
  window.clearTimeout(node._t);
  node._t = window.setTimeout(() => node.classList.remove('show'), 1600);
}
