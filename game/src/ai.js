// ============================================================================
// Ember Court — ai.js
// ONE JOB: the rival's brain. The AI is NOT random: it scores every card in
// its hand against the current table, picks the best play, and declares an
// INTENT ("will attack for 9", "will shield") a full turn ahead so the
// player can read it and counter it. Four personalities shape the scoring:
//   aggressive — damage first, shield only when nearly dead.
//   cautious   — shields early, saves big cards, finishes when safe.
//   cunning    — weakens and heals, spends big cards only at value.
//   sovereign  — reads the player's block and picks the counter-play.
// The AI draws from the same card pool as the player, filtered to its
// preferred suits, so its hand is a real hand with real costs.
// ============================================================================

import { getCard, cardsOfSuit, ALL_CARD_IDS } from './cards.js';
import { SUITS } from './config.js';

/**
 * Build the rival's deck: `handSize` cards sampled from its preferred suits
 * (weighted by the suits list — a boss listing ['ember','ember','gale']
 * draws Ember twice as often), plus a couple of off-suit wildcards so its
 * hand is never a single note. Rarity is gated by the rival's tier so an
 * Act I rival fights with commons while the final boss may draw rares:
 *   tier 1 — commons only · tier 2 — commons + uncommons · tier 3 — all.
 */
export function buildEnemyDeck(rival, rng) {
  const allowed = rival.tier >= 3 ? ['common', 'uncommon', 'rare']
    : rival.tier === 2 ? ['common', 'uncommon'] : ['common'];
  const pool = [];
  for (const suit of rival.suits) {
    for (const c of cardsOfSuit(suit)) {
      if (allowed.includes(c.rarity)) pool.push(c.id);
    }
  }
  // A little off-suit spice: two cards from suits the rival does not favour.
  const otherSuits = ['ember', 'tide', 'thorn', 'gale'].filter((s) => !rival.suits.includes(s));
  for (const s of otherSuits) {
    const cards = cardsOfSuit(s).filter((c) => allowed.includes(c.rarity));
    if (cards.length) pool.push(rng.pick(cards).id);
  }
  const deck = [];
  const total = 22;
  for (let i = 0; i < total; i++) deck.push(rng.pick(pool));
  rng.shuffle(deck);
  return deck;
}

/** Value one card in the current situation. Higher = the AI wants it more.
 *  Damage is worth more when the player is low; block is worth more when
 *  the AI is low; healing is worthless at full HP; draw is worth more with
 *  an empty hand. This is what makes the AI's choices readable: it plays
 *  the card that helps it most right now. */
export function scoreEnemyCard(card, self, player, handSize) {
  const e = card.effects || {};
  let score = 0;
  const playerHpFrac = player.hp / player.maxHp;
  const selfHpFrac = self.hp / self.maxHp;

  // Damage: base value, boosted when it can finish the player.
  if (card.attack) {
    score += card.attack * 1.0;
    if (playerHpFrac < 0.25) score += card.attack * 0.6; // go for the kill
    if (e.burn) score += e.burn * 1.4;
    if (e.weaken) score += e.weaken * 1.2;
    if (e.extraDamageIfBurning && player.status.burn > 0) score += e.extraDamageIfBurning * 1.2;
  }
  // Block: worth more the lower the AI's HP, worthless at full HP with no threat.
  if (card.block) {
    score += card.block * (0.35 + (1 - selfHpFrac) * 0.9);
    if (player.intentAttack && player.intentAttack >= 10) score += card.block * 0.4;
  }
  // Healing: only when hurt, and more when badly hurt.
  if (e.heal) {
    const missing = self.maxHp - self.hp;
    score += Math.min(e.heal, missing) * (missing > self.maxHp * 0.4 ? 1.3 : 0.8);
  }
  // Strength / thorns: long-term value, cheap to play early.
  if (e.strength) score += e.strength * 4.5;
  if (e.thorns) score += e.thorns * 2.5;
  if (e.burn && !card.attack) score += e.burn * 1.8;
  if (e.weaken && !card.attack) score += e.weaken * 2.2;
  // Draw / ember: worth more with a small hand.
  if (e.draw) score += e.draw * (handSize <= 2 ? 3.5 : 2.0);
  if (e.gainEmber) score += e.gainEmber * 2.5;
  if (e.lifesteal) score += e.lifesteal * 0.8;
  if (e.cleanse && (self.status.burn > 0 || self.status.weaken > 0)) score += 4;
  // Cost efficiency: a 0-cost card is almost always worth playing.
  score -= card.cost * 1.6;
  if (card.cost === 0) score += 1.5;
  return score;
}

/** Personality multipliers applied on top of scoreEnemyCard. */
function personalityAdjust(score, card, personality, self, player) {
  const e = card.effects || {};
  if (personality === 'aggressive') {
    if (card.attack) score *= 1.35;
    if (card.block && self.hp / self.maxHp > 0.6) score *= 0.4; // too proud to shield
    if (e.heal) score *= 0.6;
  } else if (personality === 'cautious') {
    if (card.block) score *= 1.5;
    if (card.attack && card.cost >= 3) score *= 0.7; // saves the big hit
    if (e.heal) score *= 1.3;
  } else if (personality === 'cunning') {
    if (e.weaken) score *= 1.6;
    if (e.draw) score *= 1.3;
    if (e.heal) score *= 1.2;
  } else if (personality === 'sovereign') {
    // Reads the player's block: if the player is heavily shielded, prefer
    // weaken / burn / big single hits over chip damage that block eats.
    if (player.block >= 10) {
      if (e.weaken || e.burn) score *= 1.8;
      if (card.attack && card.attack < 8) score *= 0.5;
    }
    if (player.hp <= 12 && card.attack) score *= 1.5; // smells blood
  }
  return score;
}

/**
 * Choose the AI's plays for its turn. Greedy by adjusted score: repeatedly
 * take the best affordable card until ember runs out or nothing scores
 * above the play threshold. `maxPlays` caps how many cards the rival may
 * play in one turn (tier 1 rivals play at most 2 — a duel, not a flood).
 * Returns the ordered list of card ids to play.
 * The threshold stops the AI wasting ember on a 1-value card when saving
 * it changes nothing — it simply ends its turn instead.
 */
export function chooseEnemyPlays(handIds, ember, self, player, personality, rng, maxPlays) {
  const hand = handIds.slice();
  const plays = [];
  let remaining = ember;
  const PLAY_THRESHOLD = 1.0;
  const playCap = maxPlays || 3;
  // Safety: never loop forever; a hand is at most ~8 cards.
  for (let step = 0; step < playCap; step++) {
    let bestIdx = -1;
    let bestScore = PLAY_THRESHOLD;
    for (let i = 0; i < hand.length; i++) {
      const card = getCard(hand[i]);
      if (!card || card.cost > remaining) continue;
      let s = scoreEnemyCard(card, self, player, hand.length);
      s = personalityAdjust(s, card, personality, self, player);
      // A whisper of noise so two identical tables do not play identically.
      s += rng.float() * 0.6;
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
    if (bestIdx === -1) break;
    const card = getCard(hand[bestIdx]);
    plays.push(hand[bestIdx]);
    remaining -= card.cost;
    hand.splice(bestIdx, 1);
  }
  return plays;
}

/**
 * Decide next turn's INTENT from the hand the AI will hold. The intent is
 * computed from the single best card by raw damage, so the player can read
 * it: "will attack for 9" means the AI's best attack is 9, "will shield"
 * means its best card is defensive, "will strike & weaken" means a hybrid.
 * Returns { kind: 'attack'|'block'|'hybrid'|'buff', value, text }.
 */
export function decideIntent(handIds, self, player, personality) {
  if (!handIds.length) return { kind: 'block', value: 0, text: '🛡️ Will guard' };
  let bestAttack = null;
  let bestBlock = null;
  for (const id of handIds) {
    const c = getCard(id);
    if (!c) continue;
    if (c.attack && (!bestAttack || c.attack > bestAttack.attack)) bestAttack = c;
    if (c.block && (!bestBlock || c.block > bestBlock.block)) bestBlock = c;
  }
  const lowHp = self.hp / self.maxHp < 0.35;
  if (bestAttack && (!lowHp || !bestBlock || bestAttack.attack >= 10)) {
    const e = bestAttack.effects || {};
    if (e.weaken) return { kind: 'hybrid', value: bestAttack.attack, text: '⚔️ Will attack for ' + bestAttack.attack + ' & Weaken' };
    if (e.burn) return { kind: 'hybrid', value: bestAttack.attack, text: '🔥 Will attack for ' + bestAttack.attack + ' & Burn' };
    return { kind: 'attack', value: bestAttack.attack, text: '⚔️ Will attack for ' + bestAttack.attack };
  }
  if (bestBlock) return { kind: 'block', value: bestBlock.block, text: '🛡️ Will shield for ' + bestBlock.block };
  // Neither attack nor block on top: it will buff / draw.
  return { kind: 'buff', value: 0, text: '✨ Will gather power' };
}

/** A one-line personality blurb for the battle log when the rival acts. */
export function personalityLine(personality, name) {
  switch (personality) {
    case 'aggressive': return name + ' presses the attack, heedless of defence.';
    case 'cautious': return name + ' fights carefully, shield raised.';
    case 'cunning': return name + ' smiles — something is being set up.';
    case 'sovereign': return name + ' studies your stance, then moves.';
    default: return name + ' takes the table.';
  }
}

/** All card ids the AI may ever draw (sanity export for tests). */
export function aiPoolSize() { return ALL_CARD_IDS.length; }
