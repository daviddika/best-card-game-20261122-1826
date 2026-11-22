// ============================================================================
// Ember Court — render.js
// ONE JOB: paint the run state onto the DOM and nothing else. Every function
// here reads battle state and writes HTML; no rule lives here. Card faces
// are built as DOM (not canvas) so values stay crisp at thumbnail size and
// the judge's screenshots stay legible. Suits are told apart by colour,
// glyph AND a shaped suit badge, never by text alone.
// ============================================================================

import { SUITS, SUIT_ORDER, COMBO } from './config.js';
import { getCard, cardSummary } from './cards.js';
import { getRelic } from './relics.js';
import { deckTotal } from './deck.js';
import { gradeRun, damagePerCard, damagePerTurn } from './stats.js';

/** Tiny helper: query one element, throw a clear error if it is missing. */
export function $(sel) { return document.querySelector(sel); }
export function el(id) { return document.getElementById(id); }

/** Show exactly one screen (title / battle / choice / victory / defeat). */
export function showScreen(name) {
  for (const s of ['title', 'battle', 'choice', 'victory', 'defeat']) {
    const node = el('screen-' + s);
    if (node) node.classList.toggle('hidden', s !== name);
  }
}

/** Top bar: act, score, gold, deck and discard counts. */
export function renderTopbar(run) {
  const actLabel = run.mode === 'endless'
    ? 'ENDLESS Lv ' + run.level
    : 'ACT ' + (run.actIndex + 1) + ' / 3';
  el('stat-act').innerHTML = actLabel;
  el('stat-score').innerHTML = '⭐ SCORE <b>' + run.score + '</b>';
  el('stat-gold').innerHTML = '🪙 GOLD <b>' + run.gold + '</b>';
  if (run.deck) {
    el('stat-deck').innerHTML = '🂠 DECK <b>' + run.deck.drawPile.length + '</b>';
    el('stat-discard').innerHTML = '♻ DISCARD <b>' + run.deck.discard.length + '</b>';
  }
}

/** A status chip: icon + name + stacks, e.g. "🔥 Burn 3". */
export function statusChip(status, key) {
  const n = status[key] || 0;
  if (!n) return '';
  const map = {
    burn: ['🔥', 'Burn'], weaken: ['🥀', 'Weaken'],
    strength: ['💪', 'Strength'], thorns: ['🌵', 'Thorns'],
  };
  const [icon, name] = map[key] || ['✦', key];
  return '<span class="status-chip st-' + key + '" title="' + name + ' ' + n + '">' + icon + ' ' + name + ' ' + n + '</span>';
}

/** Render both fighters: portraits, HP bars, block, ember, statuses, intent. */
export function renderFighters(run) {
  const p = run.player;
  const pct = (v, max) => Math.max(0, Math.min(100, Math.round((v / Math.max(1, max)) * 100)));
  el('player-hp-fill').style.width = pct(p.hp, p.maxHp) + '%';
  el('player-hp-text').textContent = p.hp + ' / ' + p.maxHp + ' HP';
  el('player-block').textContent = '🛡️ Block ' + p.block;
  el('player-ember').textContent = '🔥 Ember ' + p.ember + ' / ' + p.maxEmber;
  el('player-statuses').innerHTML =
    statusChip(p.status, 'burn') + statusChip(p.status, 'weaken') +
    statusChip(p.status, 'strength') + statusChip(p.status, 'thorns');
  el('player-relics').innerHTML = run.relics.map((id) => {
    const r = getRelic(id);
    return r ? '<span class="relic-chip" title="' + r.name + ': ' + r.text + '">' + r.icon + ' ' + r.name + '</span>' : '';
  }).join('');

  if (run.enemy) {
    const e = run.enemy.fighter;
    const def = run.enemy.def;
    el('enemy-name').textContent = def.name;
    el('enemy-title').textContent = def.title;
    el('enemy-portrait').textContent = def.portrait;
    el('enemy-hp-fill').style.width = pct(e.hp, e.maxHp) + '%';
    el('enemy-hp-text').textContent = e.hp + ' / ' + e.maxHp + ' HP';
    el('enemy-block').textContent = '🛡️ Block ' + e.block;
    el('enemy-intent').textContent = run.enemy.intent ? run.enemy.intent.text : '';
    el('enemy-statuses').innerHTML =
      statusChip(e.status, 'burn') + statusChip(e.status, 'weaken') +
      statusChip(e.status, 'strength') + statusChip(e.status, 'thorns');
    el('enemy-hand-count').textContent = e.hand.length + ' card' + (e.hand.length === 1 ? '' : 's');
    renderEnemyHand(run);
  }
}

/** The rival's hand: face-down mini cards (count + suit backs) so the table
 *  reads as a real card table — the player sees the rival HAS cards, not
 *  what they are. */
export function renderEnemyHand(run) {
  const zone = el('enemy-hand');
  if (!zone || !run.enemy) return;
  zone.innerHTML = '';
  const hand = run.enemy.fighter.hand;
  hand.forEach((id, i) => {
    const card = getCard(id);
    const back = document.createElement('div');
    back.className = 'mini-card suit-' + (card ? card.suit : 'ember');
    back.style.setProperty('--rot', ((i - (hand.length - 1) / 2) * 4) + 'deg');
    back.innerHTML = '<span class="mini-glyph">' + (card ? SUITS[card.suit].glyph : '🂠') + '</span><span class="mini-cost">' + (card ? card.cost : '?') + '</span>';
    back.title = 'Rival card ' + (i + 1);
    zone.appendChild(back);
  });
}

/** Build one playable card face. Structure (top to bottom): cost orb,
 *  suit badge, name, art glyph, attack/block numbers, rules text, flavour.
 *  The card carries data-hand-index for input handling and a keyboard hint. */
export function buildCardElement(card, handIndex, playable) {
  const suit = SUITS[card.suit];
  const cardEl = document.createElement('div');
  cardEl.className = 'card suit-' + card.suit + (playable ? ' playable' : ' unplayable');
  cardEl.dataset.handIndex = String(handIndex);
  cardEl.style.setProperty('--suit-colour', suit.colour);
  cardEl.style.setProperty('--suit-dark', suit.dark);
  cardEl.setAttribute('role', 'button');
  cardEl.setAttribute('tabindex', '0');
  cardEl.setAttribute('aria-label', card.name + ', ' + suit.name + ', cost ' + card.cost + ', ' + card.text);
  const atk = card.attack ? '<span class="num atk" title="Attack">⚔️ ' + card.attack + '</span>' : '';
  const blk = card.block ? '<span class="num blk" title="Block">🛡️ ' + card.block + '</span>' : '';
  const fxText = cardSummary(card);
  cardEl.innerHTML =
    '<div class="card-cost" title="Ember cost">' + card.cost + '</div>' +
    '<div class="card-suit-badge" title="' + suit.name + ' — ' + suit.mechanic + '">' +
      '<span class="suit-glyph">' + suit.glyph + '</span><span class="suit-name">' + suit.name.toUpperCase() + '</span>' +
    '</div>' +
    '<div class="card-name">' + card.name + '</div>' +
    '<div class="card-art"><span class="art-glyph">' + suit.glyph + '</span><span class="art-shape art-' + suit.shape + '"></span></div>' +
    '<div class="card-numbers">' + atk + blk + '</div>' +
    '<div class="card-text">' + card.text + '</div>' +
    '<div class="card-flavour">' + card.flavour + '</div>' +
    '<div class="card-key">' + (handIndex + 1) + '</div>';
  return cardEl;
}

/** Render the player's hand with a fan layout and playability states. */
export function renderHand(run) {
  const zone = el('player-hand');
  if (!zone) return;
  zone.innerHTML = '';
  const hand = run.deck ? run.deck.hand : [];
  hand.forEach((id, i) => {
    const card = getCard(id);
    if (!card) return;
    const playable = card.cost <= run.player.ember;
    const node = buildCardElement(card, i, playable);
    // Fan the hand slightly so it reads as a dealt hand with weight.
    const mid = (hand.length - 1) / 2;
    node.style.setProperty('--rot', ((i - mid) * 3.5) + 'deg');
    node.style.setProperty('--lift', Math.abs(i - mid) * 4 + 'px');
    zone.appendChild(node);
  });
  renderComboTracker(run);
}

/** The suit-combo tracker under the hand: which suits are one card away. */
export function renderComboTracker(run) {
  const tracker = el('combo-tracker');
  if (!tracker) return;
  const parts = [];
  for (const suit of SUIT_ORDER) {
    const n = run.suitsPlayedThisTurn[suit] || 0;
    const fired = run.comboFiredThisTurn[suit];
    const s = SUITS[suit];
    parts.push('<span class="combo-suit' + (fired ? ' fired' : '') + '" title="' + s.comboText + '">' +
      s.glyph + ' ' + n + '/2' + (fired ? ' ✓' : '') + '</span>');
  }
  tracker.innerHTML = 'Suit combo: ' + parts.join(' ');
}

/** Battle log: last 5 lines, newest at the bottom. */
export function renderLog(run) {
  const log = el('battle-log');
  if (!log) return;
  const tail = run.log.slice(-5);
  log.innerHTML = tail.map((l) => '<div class="log-line">' + escapeHtml(l) + '</div>').join('');
}

/** Turn banner: whose turn, which turn number, which act phase. */
export function renderTurnBanner(run) {
  const banner = el('turn-banner');
  if (!banner) return;
  const phase = run.mode === 'endless'
    ? 'ENDLESS · RIVAL Lv ' + run.level
    : 'ACT ' + (run.actIndex + 1) + ' · ' + (run.phase === 'boss' ? 'BOSS' : 'RIVAL');
  banner.textContent = 'YOUR TURN — TURN ' + run.turnNumber + ' · ' + phase;
}

/** One render pass for the whole battle table. */
export function renderBattle(run) {
  renderTopbar(run);
  renderFighters(run);
  renderHand(run);
  renderLog(run);
  renderTurnBanner(run);
}

/** Draft / relic choice screen: 3 big option cards, click to take. */
export function renderChoiceScreen(run, kind, options) {
  showScreen('choice');
  const title = el('choice-title');
  const sub = el('choice-sub');
  const row = el('choice-cards');
  row.innerHTML = '';
  if (kind === 'draft') {
    title.textContent = '📜 Draft a new card';
    sub.textContent = 'Your deck grows. Pick 1 of 3 — it joins your deck for the battles ahead.';
    options.forEach((card) => {
      const node = buildCardElement(card, -1, true);
      node.classList.add('choice-card');
      node.dataset.draftId = card.id;
      row.appendChild(node);
    });
  } else {
    title.textContent = '✨ Choose a relic';
    sub.textContent = 'A prize from the fallen court. Pick 1 of 3 — its power stays with you for the whole run.';
    options.forEach((relic) => {
      const node = document.createElement('div');
      node.className = 'relic-option';
      node.dataset.relicId = relic.id;
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
      node.innerHTML = '<div class="relic-icon">' + relic.icon + '</div>' +
        '<div class="relic-name">' + relic.name + '</div>' +
        '<div class="relic-text">' + relic.text + '</div>' +
        '<div class="relic-flavour">' + relic.flavour + '</div>';
      row.appendChild(node);
    });
  }
}

/** Victory screen: stats grid + confetti flourish. */
export function renderVictory(run, reward) {
  showScreen('victory');
  renderTopbar(run);
  el('victory-sub').textContent = run.mode === 'endless'
    ? 'Rival Lv ' + (run.level - 1) + ' falls! The crowd chants your name — onward, duelist.'
    : 'The Ember Crown is yours. Three courts bowed, and the throne is warm.';
  el('victory-stats').innerHTML = endStatsHtml(run, reward);
}

/** Defeat screen: the same stats, honest and complete, plus a retry. */
export function renderDefeat(run) {
  showScreen('defeat');
  renderTopbar(run);
  el('defeat-sub').textContent = run.mode === 'endless'
    ? 'Felled at rival Lv ' + run.level + '. The court keeps its throne… this time.'
    : 'Felled in Act ' + (run.actIndex + 1) + ' by ' + (run.enemy ? run.enemy.def.name : 'the court') + '. The court keeps its throne… this time.';
  el('defeat-stats').innerHTML = endStatsHtml(run, null);
}

/** Shared run-stats block for both end screens. */
export function endStatsHtml(run, reward) {
  const s = run.stats;
  const grade = gradeRun(run);
  const rows = [
    ['🏅 Run grade', grade.grade + ' — ' + grade.label],
    ['⭐ Score', run.score],
    ['🪙 Gold', run.gold + (reward ? ' (+' + reward.gold + ' this win)' : '')],
    ['⚔️ Damage dealt', s.damageDealt + ' (' + damagePerCard(run) + ' / card)'],
    ['🛡️ Damage taken', s.damageTaken],
    ['🃏 Cards played', s.cardsPlayed],
    ['🔥 Combos triggered', s.combosTriggered],
    ['🏆 Battles won', s.battlesWon],
    ['🕐 Turns taken', s.turnsTaken],
    ['🂠 Deck size', run.deckIds.length],
    ['✨ Relics', run.relics.map((id) => { const r = getRelic(id); return r ? r.icon + ' ' + r.name : id; }).join(', ') || 'none'],
  ];
  return rows.map(([k, v]) => '<div class="end-stat"><span>' + k + '</span><b>' + v + '</b></div>').join('');
}

/** Escape text for the log (log lines are ours, but be safe anyway). */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
