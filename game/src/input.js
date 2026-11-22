// ============================================================================
// Ember Court — input.js
// ONE JOB: mouse + keyboard input. Click a card (or press 1–7) to play it,
// Enter ends the turn, Esc pauses, M toggles sound, H opens help. Input
// handlers call battle.js and hand the results to render.js / effects.js;
// they never contain rules themselves. Every handler is also callable from
// the play-test harness (window.__emberTest) so headless Chrome can drive
// the game with scripted clicks and keys.
// ============================================================================

import { KEYS, HELP_HTML } from './config.js';
import { playPlayerCard, endPlayerTurn } from './battle.js';
import { renderBattle, showScreen } from './render.js';
import { showPlayEvents, showComboBanner, shakeTable, toast, pulseEndTurn } from './effects.js';
import { sfx, toggleMute, ensureAudio } from './audio.js';
import { SUITS } from './config.js';
import { codexHtml } from './codex.js';

/** The live game object main.js hands us: { run, onBattleEnd, refresh }. */
let game = null;

/** Register the live game (called once by main.js). */
export function bindInput(liveGame) { game = liveGame; }

/** Play the card at hand index `i` (from a click or a number key). */
export function playCardAt(i) {
  if (!game || !game.run || game.run.over) return;
  const cardEl = document.querySelector('.card[data-hand-index="' + i + '"]');
  ensureAudio();
  const before = game.run.enemy ? game.run.enemy.fighter.hp : 0;
  const res = playPlayerCard(game.run, i);
  if (!res.ok) {
    toast(res.reason || 'That card cannot be played.');
    sfx.unplayable();
    return;
  }
  sfx.playCard();
  if (cardEl) {
    cardEl.classList.add('just-played');
  }
  showPlayEvents(res.events);
  // Combo banner: the last event of a combo play carries the suit.
  const comboEv = (res.events || []).find((e) => e.type === 'combo');
  if (comboEv) {
    const suit = SUITS[comboEv.suit];
    showComboBanner(suit.name, suit.glyph, suit.comboText);
    sfx.combo();
  }
  const after = game.run.enemy ? game.run.enemy.fighter.hp : 0;
  if (before - after >= 10) { shakeTable(7); sfx.bigHit(); }
  else if (before - after > 0) { sfx.hit(); }
  game.refresh();
  game.afterPlayerAction();
}

/** End the turn (button or Enter key). */
export function endTurn() {
  if (!game || !game.run || game.run.over) return;
  ensureAudio();
  sfx.endTurn();
  const res = endPlayerTurn(game.run);
  if (!res.ok) { toast(res.reason || 'Cannot end the turn yet.'); return; }
  game.refresh();
  game.afterPlayerAction();
}

/** Open the help overlay. */
export function openHelp() {
  const overlay = document.getElementById('overlay');
  document.getElementById('overlay-title').textContent = 'How to play — Ember Court';
  document.getElementById('overlay-body').innerHTML = HELP_HTML;
  overlay.classList.remove('hidden');
  sfx.click();
}

/** Open the duelist's codex (strategy guide) in the overlay. */
export function openCodex() {
  const overlay = document.getElementById('overlay');
  document.getElementById('overlay-title').textContent = "The Duelist's Codex";
  document.getElementById('overlay-body').innerHTML = codexHtml();
  overlay.classList.remove('hidden');
  sfx.click();
}

/** Open the pause overlay (Esc). */
export function openPause() {
  const overlay = document.getElementById('overlay');
  document.getElementById('overlay-title').textContent = 'Paused';
  document.getElementById('overlay-body').innerHTML =
    '<p>The court waits. Your run is exactly where you left it.</p>' +
    '<p>Press Esc or Close to resume. M toggles sound, H opens the full rules.</p>';
  overlay.classList.remove('hidden');
}

/** Close any overlay. */
export function closeOverlay() {
  document.getElementById('overlay').classList.add('hidden');
  sfx.click();
}

/** Is an overlay currently open? */
export function overlayOpen() {
  return !document.getElementById('overlay').classList.contains('hidden');
}

/** Wire up every button and key once the DOM is ready. */
export function wireInput() {
  // Click a card in the hand (event delegation — the hand re-renders often).
  document.getElementById('player-hand').addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card');
    if (!cardEl || cardEl.dataset.handIndex === undefined) return;
    const idx = Number(cardEl.dataset.handIndex);
    if (Number.isInteger(idx) && idx >= 0) playCardAt(idx);
  });
  // Keyboard on a card (Enter / Space when focused).
  document.getElementById('player-hand').addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const cardEl = ev.target.closest('.card');
    if (!cardEl) return;
    ev.preventDefault();
    playCardAt(Number(cardEl.dataset.handIndex));
  });
  // End Turn button.
  document.getElementById('btn-end-turn').addEventListener('click', endTurn);
  // Draft / relic choice clicks (delegation on the choice row).
  document.getElementById('choice-cards').addEventListener('click', (ev) => {
    const draft = ev.target.closest('[data-draft-id]');
    if (draft) { game.chooseDraft(draft.dataset.draftId); return; }
    const relic = ev.target.closest('[data-relic-id]');
    if (relic) { game.chooseRelic(relic.dataset.relicId); }
  });
  // Top bar buttons.
  document.getElementById('btn-sound').addEventListener('click', () => {
    const nowMuted = toggleMute();
    document.getElementById('btn-sound').textContent = nowMuted ? '🔇 MUTED' : '🔊 SOUND';
    if (!nowMuted) sfx.click();
  });
  document.getElementById('btn-help').addEventListener('click', openHelp);
  document.getElementById('btn-pause').addEventListener('click', openPause);
  document.getElementById('btn-close-overlay').addEventListener('click', closeOverlay);
  document.getElementById('btn-skip-choice').addEventListener('click', () => { if (game) game.skipChoice(); });
  // Title screen buttons.
  document.getElementById('btn-campaign').addEventListener('click', () => { if (game) game.startCampaign(); });
  document.getElementById('btn-endless').addEventListener('click', () => { if (game) game.startEndless(); });
  document.getElementById('btn-codex').addEventListener('click', openCodex);
  // End screens.
  document.getElementById('btn-again-win').addEventListener('click', () => { if (game) game.restartSameMode(); });
  document.getElementById('btn-title-win').addEventListener('click', () => { if (game) game.toTitle(); });
  document.getElementById('btn-again-lose').addEventListener('click', () => { if (game) game.restartSameMode(); });
  document.getElementById('btn-title-lose').addEventListener('click', () => { if (game) game.toTitle(); });

  // Keyboard: number keys play cards, Enter ends the turn, Esc pauses /
  // closes, M mutes, H helps. Ignored while an overlay is open (except Esc).
  document.addEventListener('keydown', (ev) => {
    if (overlayOpen()) {
      if (ev.key === KEYS.pause) { closeOverlay(); }
      return;
    }
    if (KEYS.playCard.includes(ev.key)) {
      const idx = Number(ev.key) - 1;
      playCardAt(idx);
      ev.preventDefault();
      return;
    }
    if (ev.key === KEYS.endTurn) { endTurn(); ev.preventDefault(); return; }
    if (ev.key === KEYS.pause) { openPause(); return; }
    if (ev.key.toLowerCase() === KEYS.sound) {
      const nowMuted = toggleMute();
      document.getElementById('btn-sound').textContent = nowMuted ? '🔇 MUTED' : '🔊 SOUND';
      return;
    }
    if (ev.key.toLowerCase() === KEYS.help) { openHelp(); }
  });
}

/** Nudge: when nothing in hand is playable, pulse the End Turn button. */
export function maybePulseEndTurn(run) {
  if (!run || !run.deck) return;
  const { getCard } = { getCard: null };
  void getCard;
  const playable = run.deck.hand.some((id) => {
    // Import-free check: cost is read from the card database via window hook.
    const card = window.__emberCards ? window.__emberCards[id] : null;
    return card && card.cost <= run.player.ember;
  });
  if (!playable) pulseEndTurn();
}
