// ============================================================================
// Ember Court — battle.js
// ONE JOB: the battle engine. Pure game rules, no DOM: it owns the run
// state (act, mode, gold, score, relics, deck), the fighters (hp, block,
// statuses, ember, hand), the turn flow, combos, status ticks, relic hooks
// and win/loss detection. render.js reads this state and paints it; input.js
// calls these functions. Every rule in config.js is applied here.
// ============================================================================

import {
  PLAYER, COMBO, STATUS, SCORING, ACTS, endlessRivalForLevel,
  RELIC_CHOICE_COUNT, DRAFT, TURNS,
} from './config.js';
import { getCard, ALL_CARD_IDS, cardsOfSuit } from './cards.js';
import { createDeck, drawCards, discardFromHand, discardHand, addCardToDeck, deckTotal } from './deck.js';
import { getRelic, sumHook, hasHook, offerRelics } from './relics.js';
import { buildEnemyDeck, chooseEnemyPlays, decideIntent } from './ai.js';
import { SeededRandom } from './random.js';

/** A fresh fighter: hp, block, ember, statuses and hand bookkeeping. */
export function makeFighter(hp, maxHp) {
  return {
    hp, maxHp, block: 0, ember: 0, maxEmber: PLAYER.maxEmber,
    status: { burn: 0, weaken: 0, strength: 0, thorns: 0 },
    hand: [],
  };
}

/** A fresh run: campaign or endless, deck, gold, score, relics, act index. */
export function createRun(mode, seed) {
  const rng = new SeededRandom(seed);
  const run = {
    mode, seed, rng,
    actIndex: 0,            // 0-based act; endless uses level instead
    level: 1,               // endless level
    phase: 'rival',         // 'rival' then 'boss' inside each act
    gold: PLAYER.startGold,
    score: PLAYER.startScore,
    relics: [],
    deckIds: null,          // the player's master deck (card ids)
    deck: null,             // the in-battle Deck object
    player: makeFighter(PLAYER.startHp, PLAYER.maxHp),
    enemy: null,            // { def, fighter, deckIds, intent }
    turn: 0,
    turnNumber: 1,
    suitsPlayedThisTurn: {}, // suit -> count, reset each player turn
    comboFiredThisTurn: {}, // suit -> bool
    firstCardPlayedThisTurn: false,
    log: [],
    stats: {
      damageDealt: 0, damageTaken: 0, cardsPlayed: 0, combosTriggered: 0,
      turnsTaken: 0, battlesWon: 0, goldEarned: 0, relicsTaken: 0,
    },
    secondWindUsed: false,
    over: false, won: false,
    draftOffer: null, relicOffer: null,
  };
  run.deckIds = ['ember-strike', 'ember-strike', 'ember-strike',
    'tide-splash', 'tide-splash', 'thorn-guard', 'thorn-guard',
    'thorn-guard', 'gale-cut', 'gale-cut'];
  return run;
}

/** Log a line (kept short; render shows the last few). */
export function logLine(run, text) {
  run.log.push(text);
  if (run.log.length > 40) run.log.shift();
}

/** Current act definition (campaign) or endless rival (endless mode). */
export function currentActDef(run) {
  return ACTS[run.actIndex];
}

/** Start a battle against a rival definition object. Sets up both fighters,
 *  deals opening hands, applies battle-start relic hooks and rolls intent. */
export function startBattle(run, def) {
  const isBoss = def === (run.mode === 'campaign' ? currentActDef(run).boss : null);
  run.over = false;   // a new battle clears the previous battle's result
  run.won = false;
  run.enemy = {
    def,
    fighter: makeFighter(def.hp, def.hp),
    deckIds: buildEnemyDeck(def, run.rng),
    drawPile: [],
    discard: [],
    intent: null,
  };
  run.enemy.drawPile = run.enemy.deckIds.slice();
  run.rng.shuffle(run.enemy.drawPile);
  // Player: fresh in-battle deck from the master deck list.
  run.deck = createDeck(run.deckIds, run.rng);
  run.player.block = 0;
  run.player.status = { burn: 0, weaken: 0, strength: 0, thorns: 0 };
  run.enemy.fighter.block = 0;
  run.enemy.fighter.status = { burn: 0, weaken: 0, strength: 0, thorns: 0 };
  run.turnNumber = 1;
  run.suitsPlayedThisTurn = {};
  run.comboFiredThisTurn = {};
  run.firstCardPlayedThisTurn = false;
  // Battle-start relic hooks.
  run.player.block += sumHook(run.relics, 'blockAtBattleStart');
  run.player.status.thorns += sumHook(run.relics, 'thornsAtBattleStart');
  run.player.status.strength += sumHook(run.relics, 'strengthAtBattleStart');
  if (sumHook(run.relics, 'maxHpBonus') > 0) {
    run.player.maxHp = PLAYER.maxHp + sumHook(run.relics, 'maxHpBonus');
    run.player.hp = Math.min(run.player.hp + sumHook(run.relics, 'maxHpBonus'), run.player.maxHp);
  }
  // Opening hands.
  const handSize = PLAYER.startHandSize + sumHook(run.relics, 'handSizeBonus');
  drawCards(run.deck, handSize, run.rng, TURNS.maxHandSize);
  run.player.hand = run.deck.hand;
  drawEnemyCards(run, def.handSize);
  run.enemy.intent = decideIntent(run.enemy.fighter.hand, run.enemy.fighter, run.player, def.personality);
  startPlayerTurn(run);
  logLine(run, def.taunt);
  logLine(run, (isBoss ? '👑 Boss: ' : '⚔️ Rival: ') + def.name + ' — ' + def.hp + ' HP.');
  return run.enemy;
}

/** Draw cards into the enemy's hand from its own draw pile. */
export function drawEnemyCards(run, count) {
  const e = run.enemy;
  for (let i = 0; i < count; i++) {
    if (!e.drawPile.length) {
      if (!e.discard.length) break;
      e.drawPile = e.discard.splice(0, e.discard.length);
      run.rng.shuffle(e.drawPile);
    }
    e.fighter.hand.push(e.drawPile.pop());
  }
}

/** Begin the player's turn: burn tick, ember refresh, relic heals, draw. */
export function startPlayerTurn(run) {
  const p = run.player;
  run.suitsPlayedThisTurn = {};
  run.comboFiredThisTurn = {};
  run.firstCardPlayedThisTurn = false;
  // Burn ticks at the start of your turn.
  if (p.status.burn > 0) {
    const dmg = p.status.burn * STATUS.burnDamagePerStack;
    applyDamageToFighter(run, p, dmg, 'burn');
    logLine(run, '🔥 Burn sears you for ' + dmg + '.');
    if (run.over) return;
  }
  // Relic: heal at turn start. Relic: burn the rival at turn start.
  const heal = sumHook(run.relics, 'healPerTurn');
  if (heal > 0 && p.hp < p.maxHp) {
    p.hp = Math.min(p.maxHp, p.hp + heal);
    logLine(run, '🐚 Tide Charm mends ' + heal + ' HP.');
  }
  const burnFoe = sumHook(run.relics, 'burnPerTurn');
  if (burnFoe > 0 && run.enemy) {
    run.enemy.fighter.status.burn = Math.min(STATUS.burnMaxStacks, run.enemy.fighter.status.burn + burnFoe);
    logLine(run, '🧪 Frozen Flask: the rival gains ' + burnFoe + ' Burn.');
  }
  p.ember = PLAYER.emberPerTurn + sumHook(run.relics, 'emberPerTurnBonus');
  p.maxEmber = PLAYER.maxEmber;
  p.block = 0; // block does not carry between turns (classic deck-builder rule)
  const drawN = PLAYER.drawPerTurn + sumHook(run.relics, 'drawPerTurnBonus');
  drawCards(run.deck, drawN, run.rng, TURNS.maxHandSize);
  run.player.hand = run.deck.hand;
  run.turnNumber++;
  run.stats.turnsTaken++;
}

/** Damage a fighter, respecting block first. Returns damage that hit HP.
 *  `source` is 'attack' | 'burn' | 'thorns' | 'reflect' for logging. */
export function applyDamageToFighter(run, fighter, raw, source) {
  let remaining = raw;
  if (fighter.block > 0) {
    const absorbed = Math.min(fighter.block, remaining);
    fighter.block -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) {
    fighter.hp -= remaining;
    if (fighter === run.player) run.stats.damageTaken += remaining;
    else run.stats.damageDealt += remaining;
    if (fighter === run.player) run.score += 0; // score counts damage DEALT only
    else run.score += remaining * SCORING.perDamageDealt;
  }
  return remaining;
}

/** Effective attack of a card: base + strength + relic attack bonus. */
export function effectiveAttack(run, card, isPlayer) {
  const fighter = isPlayer ? run.player : run.enemy.fighter;
  let atk = card.attack || 0;
  atk += fighter.status.strength * STATUS.strengthDamagePerStack;
  if (isPlayer) atk += sumHook(run.relics, 'attackBonus');
  if (fighter.status.weaken > 0) {
    atk = Math.max(1, atk - fighter.status.weaken * STATUS.weakenAttackLoss);
  }
  return atk;
}

/**
 * Play a card from the player's hand (hand index). Applies cost, attack,
 * block, every effect, the suit combo check, thorns retaliation and
 * win/loss detection. Returns { ok, reason, events } — events is a list of
 * { type, value, target } the renderer turns into floating numbers and
 * sounds. Playing is the heart of the game, so this function is explicit
 * about every step instead of clever.
 */
export function playPlayerCard(run, handIndex) {
  const p = run.player;
  const e = run.enemy ? run.enemy.fighter : null;
  if (run.over || !run.enemy || !e) return { ok: false, reason: 'No battle is running.' };
  if (handIndex < 0 || handIndex >= run.deck.hand.length) return { ok: false, reason: 'No card there.' };
  const cardId = run.deck.hand[handIndex];
  const card = getCard(cardId);
  if (!card) return { ok: false, reason: 'Unknown card.' };
  let cost = card.cost;
  // Lucky Die: first card each turn costs 1 less.
  if (!run.firstCardPlayedThisTurn) cost = Math.max(0, cost - sumHook(run.relics, 'firstCardDiscount'));
  if (cost > p.ember) return { ok: false, reason: 'Not enough Ember — need ' + cost + ', have ' + p.ember + '.' };
  const events = [];
  p.ember -= cost;
  discardFromHand(run.deck, handIndex);
  run.player.hand = run.deck.hand;
  run.stats.cardsPlayed++;
  run.firstCardPlayedThisTurn = true;

  // --- Attack ---
  if (card.attack) {
    let atk = effectiveAttack(run, card, true);
    if (card.effects.extraDamageIfBurning && e.status.burn > 0) atk += card.effects.extraDamageIfBurning;
    const dealt = applyDamageToFighter(run, e, atk, 'attack');
    events.push({ type: 'damage', value: dealt, target: 'enemy' });
    logLine(run, '⚔️ ' + card.name + ' deals ' + dealt + ' to ' + run.enemy.def.name + '.');
    // Thorns: the defender's thorns bite the attacker back.
    if (e.status.thorns > 0 && dealt >= 0) {
      const back = e.status.thorns * STATUS.thornsDamagePerStack;
      applyDamageToFighter(run, p, back, 'thorns');
      events.push({ type: 'thorns', value: back, target: 'player' });
      logLine(run, '🌵 Thorns bite back for ' + back + '.');
    }
  }
  // --- Block ---
  if (card.block) {
    p.block += card.block;
    events.push({ type: 'block', value: card.block, target: 'player' });
    logLine(run, '🛡️ ' + card.name + ' grants ' + card.block + ' Block.');
  }
  // --- Effects ---
  const fx = card.effects || {};
  if (fx.burn) {
    e.status.burn = Math.min(STATUS.burnMaxStacks, e.status.burn + fx.burn);
    events.push({ type: 'burn', value: fx.burn, target: 'enemy' });
    logLine(run, '🔥 ' + run.enemy.def.name + ' gains ' + fx.burn + ' Burn.');
  }
  if (fx.weaken) {
    e.status.weaken = Math.min(STATUS.weakenMaxStacks, e.status.weaken + fx.weaken);
    events.push({ type: 'weaken', value: fx.weaken, target: 'enemy' });
    logLine(run, '🥀 ' + run.enemy.def.name + ' is Weakened.');
  }
  if (fx.strength) {
    p.status.strength = Math.min(STATUS.strengthMaxStacks, p.status.strength + fx.strength);
    events.push({ type: 'strength', value: fx.strength, target: 'player' });
  }
  if (fx.thorns) {
    p.status.thorns += fx.thorns;
    events.push({ type: 'thorns', value: fx.thorns, target: 'player' });
  }
  if (fx.heal) {
    const healed = Math.min(fx.heal, p.maxHp - p.hp);
    p.hp += healed;
    events.push({ type: 'heal', value: healed, target: 'player' });
    if (healed > 0) logLine(run, '💧 You heal ' + healed + ' HP.');
  }
  if (fx.lifesteal) {
    const healed = Math.min(fx.lifesteal, p.maxHp - p.hp);
    p.hp += healed;
    events.push({ type: 'heal', value: healed, target: 'player' });
  }
  if (fx.draw) {
    const drawn = drawCards(run.deck, fx.draw, run.rng, TURNS.maxHandSize);
    run.player.hand = run.deck.hand;
    events.push({ type: 'draw', value: drawn.length, target: 'player' });
  }
  if (fx.gainEmber) {
    p.ember = Math.min(p.maxEmber, p.ember + fx.gainEmber);
    events.push({ type: 'ember', value: fx.gainEmber, target: 'player' });
  }
  if (fx.cleanse) {
    p.status.burn = 0; p.status.weaken = 0;
    events.push({ type: 'cleanse', value: 1, target: 'player' });
    logLine(run, '💧 You cleanse Burn and Weaken.');
  }

  // --- Suit combo: 2nd card of a suit this turn fires the bonus. ---
  run.suitsPlayedThisTurn[card.suit] = (run.suitsPlayedThisTurn[card.suit] || 0) + 1;
  if (run.suitsPlayedThisTurn[card.suit] >= COMBO.threshold && !run.comboFiredThisTurn[card.suit]) {
    run.comboFiredThisTurn[card.suit] = true;
    run.stats.combosTriggered++;
    fireSuitCombo(run, card.suit, events);
  }

  checkBattleEnd(run);
  return { ok: true, reason: '', events, card };
}

/** Fire a suit combo bonus. Each suit's bonus is distinct and visible. */
export function fireSuitCombo(run, suit, events) {
  const p = run.player;
  const e = run.enemy.fighter;
  // Each suit's bonus is distinct and visible (see config.js COMBO).
  if (suit === 'ember') {
    const bonus = COMBO.emberBonusDamage + sumHook(run.relics, 'emberComboBonusDamage');
    const dealt = applyDamageToFighter(run, e, bonus, 'attack');
    events.push({ type: 'combo', value: dealt, target: 'enemy', suit });
    logLine(run, '🔥 WILDFIRE combo! +' + dealt + ' damage.');
  } else if (suit === 'tide') {
    const healed = Math.min(COMBO.tideHeal, p.maxHp - p.hp);
    p.hp += healed;
    drawCards(run.deck, COMBO.tideDraw, run.rng, TURNS.maxHandSize);
    run.player.hand = run.deck.hand;
    events.push({ type: 'combo', value: healed, target: 'player', suit });
    logLine(run, '💧 HIGH TIDE combo! Heal ' + healed + ', draw 1.');
  } else if (suit === 'thorn') {
    p.block += COMBO.thornBlock;
    e.status.weaken = Math.min(STATUS.weakenMaxStacks, e.status.weaken + 1);
    events.push({ type: 'combo', value: COMBO.thornBlock, target: 'player', suit });
    logLine(run, '🌿 THORNWALL combo! +' + COMBO.thornBlock + ' Block, rival Weakened.');
  } else if (suit === 'gale') {
    p.ember = Math.min(p.maxEmber, p.ember + COMBO.galeEmber);
    drawCards(run.deck, COMBO.galeDraw, run.rng, TURNS.maxHandSize);
    run.player.hand = run.deck.hand;
    events.push({ type: 'combo', value: COMBO.galeEmber, target: 'player', suit });
    logLine(run, '🌪️ STORM SURGE combo! +' + COMBO.galeEmber + ' Ember, draw 1.');
  }
  checkBattleEnd(run);
}

/** End the player's turn: discard the hand, then run the enemy turn. */
export function endPlayerTurn(run) {
  if (run.over || !run.enemy) return { ok: false, reason: 'No battle is running.' };
  discardHand(run.deck);
  run.player.hand = run.deck.hand;
  runEnemyTurn(run);
  if (run.over) return { ok: true };
  startPlayerTurn(run);
  // Roll the rival's intent for the turn after next, from its new hand.
  run.enemy.intent = decideIntent(run.enemy.fighter.hand, run.enemy.fighter, run.player, run.enemy.def.personality);
  return { ok: true };
}

/** The enemy turn: burn tick, draw, choose plays by value, play them one
 *  by one (with the same rules as the player), then discard its hand. */
export function runEnemyTurn(run) {
  const e = run.enemy.fighter;
  const p = run.player;
  const def = run.enemy.def;
  logLine(run, '— ' + def.name + '\'s turn —');
  // Burn ticks at the start of the rival's turn.
  if (e.status.burn > 0) {
    const dmg = e.status.burn * STATUS.burnDamagePerStack;
    applyDamageToFighter(run, e, dmg, 'burn');
    logLine(run, '🔥 Burn sears ' + def.name + ' for ' + dmg + '.');
    if (checkBattleEnd(run)) return;
  }
  e.block = 0;
  // Rival ember: tier 1 rivals play on 3, tier 2 on 3–4, the Sovereign on 4.
  // The player refreshes to 4, so the rival never out-resources you early.
  const ember = 3 + (def.tier >= 3 ? 1 : 0) + (def.tier === 2 && run.turnNumber >= 6 ? 1 : 0);
  drawEnemyCards(run, 1);
  // Play cap by tier: rivals 2 cards, bosses 3, the Sovereign 4.
  const maxPlays = def.tier >= 3 ? 4 : def.tier === 2 ? 3 : 2;
  const plays = chooseEnemyPlays(e.hand, ember, e, p, def.personality, run.rng, maxPlays);
  let spent = 0;
  for (const cardId of plays) {
    const card = getCard(cardId);
    if (!card) continue;
    spent += card.cost;
    const idx = e.hand.indexOf(cardId);
    if (idx !== -1) e.hand.splice(idx, 1);
    run.enemy.discard.push(cardId);
    playEnemyCard(run, card);
    if (run.over) return;
  }
  logLine(run, def.name + ' plays ' + plays.length + ' card' + (plays.length === 1 ? '' : 's') + ' (' + spent + ' Ember).');
  // Unplayed cards are discarded, as the player's are.
  while (e.hand.length) run.enemy.discard.push(e.hand.pop());
  checkBattleEnd(run);
}

/** Apply one enemy card against the player (mirrors playPlayerCard). */
export function playEnemyCard(run, card) {
  const p = run.player;
  const e = run.enemy.fighter;
  const fx = card.effects || {};
  if (card.attack) {
    let atk = effectiveAttack(run, card, false);
    if (fx.extraDamageIfBurning && p.status.burn > 0) atk += fx.extraDamageIfBurning;
    const dealt = applyDamageToFighter(run, p, atk, 'attack');
    logLine(run, '⚔️ ' + run.enemy.def.name + ' hits you for ' + dealt + ' (' + card.name + ').');
    // Player thorns bite back.
    if (p.status.thorns > 0) {
      const back = p.status.thorns * STATUS.thornsDamagePerStack;
      applyDamageToFighter(run, e, back, 'thorns');
      logLine(run, '🌵 Your Thorns bite back for ' + back + '.');
    }
    // Mirror Shard relic: reflect damage.
    const reflect = sumHook(run.relics, 'reflectDamage');
    if (reflect > 0 && dealt > 0) {
      applyDamageToFighter(run, e, reflect, 'reflect');
      logLine(run, '🪞 Mirror Shard reflects ' + reflect + ' damage.');
    }
  }
  if (card.block) {
    e.block += card.block;
    logLine(run, '🛡️ ' + run.enemy.def.name + ' gains ' + card.block + ' Block.');
  }
  if (fx.burn) {
    p.status.burn = Math.min(STATUS.burnMaxStacks, p.status.burn + fx.burn);
    logLine(run, '🔥 You gain ' + fx.burn + ' Burn.');
  }
  if (fx.weaken) {
    p.status.weaken = Math.min(STATUS.weakenMaxStacks, p.status.weaken + fx.weaken);
    logLine(run, '🥀 You are Weakened.');
  }
  if (fx.strength) e.status.strength = Math.min(STATUS.strengthMaxStacks, e.status.strength + fx.strength);
  if (fx.thorns) e.status.thorns += fx.thorns;
  if (fx.heal) {
    const healed = Math.min(fx.heal, e.maxHp - e.hp);
    e.hp += healed;
    if (healed > 0) logLine(run, '💧 ' + run.enemy.def.name + ' heals ' + healed + ' HP.');
  }
  if (fx.draw) drawEnemyCards(run, fx.draw);
  if (fx.gainEmber) { /* enemy ember is per-turn; a gain just lets it play more next pick — ignored, kept simple */ }
  if (fx.cleanse) { e.status.burn = 0; e.status.weaken = 0; }
}

/** Check whether the battle is over; set run.over / run.won and handle the
 *  Phoenix Feather second wind. Returns true when the battle ended. */
export function checkBattleEnd(run) {
  if (run.over) return true;
  const p = run.player;
  const e = run.enemy ? run.enemy.fighter : null;
  if (e && e.hp <= 0) {
    e.hp = 0;
    run.over = true; run.won = true;
    run.stats.battlesWon++;
    return true;
  }
  if (p.hp <= 0) {
    // Phoenix Feather: once per run, survive at 1 HP and heal 10.
    if (hasHook(run.relics, 'secondWind') && !run.secondWindUsed) {
      run.secondWindUsed = true;
      p.hp = 11;
      logLine(run, '🪶 Phoenix Feather! You survive at 11 HP.');
      return false;
    }
    p.hp = 0;
    run.over = true; run.won = false;
    return true;
  }
  return false;
}

/** Rewards for winning a battle. Returns { gold, score, isBoss, isCampaignWin }. */
export function collectWinRewards(run) {
  const act = run.mode === 'campaign' ? currentActDef(run) : null;
  const isBoss = run.mode === 'campaign' ? run.phase === 'boss' : false;
  const isCampaignWin = run.mode === 'campaign' && run.phase === 'boss' && run.actIndex === ACTS.length - 1;
  const gold = (isBoss ? SCORING.goldPerBossWin : SCORING.goldPerWin)
    + sumHook(run.relics, 'goldPerWinBonus');
  run.gold += gold;
  run.stats.goldEarned += gold;
  const scoreGain = (isBoss ? SCORING.perBossWin : SCORING.perActWin)
    + (isCampaignWin ? SCORING.campaignWinBonus : 0);
  run.score += scoreGain;
  // Camp rest: a win mends 8 HP (capped at max). A run that never heals
  // between fights would grind down to nothing by Act III.
  const rested = Math.min(8, run.player.maxHp - run.player.hp);
  if (rested > 0) {
    run.player.hp += rested;
    logLine(run, '⛺ Camp rest: you recover ' + rested + ' HP after the victory.');
  }
  return { gold, score: scoreGain, isBoss, isCampaignWin };
}

/** Advance the campaign after a win: rival -> boss -> next act (draft +
 *  relic in between) or campaign victory. Returns a step descriptor the
 *  UI uses to show the draft / relic screens. */
export function advanceAfterWin(run) {
  if (run.mode === 'endless') {
    const reward = collectWinRewards(run);
    run.score += SCORING.endlessWinBonus * run.level;
    run.level++;
    const next = endlessRivalForLevel(run.level);
    return { step: 'next-endless', reward, next };
  }
  collectWinRewards(run);
  if (run.phase === 'rival') {
    run.phase = 'boss';
    return { step: 'draft-then-boss', reward: null };
  }
  // Boss beaten.
  if (run.actIndex >= ACTS.length - 1) {
    return { step: 'campaign-win', reward: null };
  }
  run.actIndex++;
  run.phase = 'rival';
  return { step: 'draft-then-relic-then-next-act', reward: null };
}

/** Offer 3 draft cards (seeded, one per suit weighted by rarity). */
export function offerDraftCards(run) {
  const pool = ALL_CARD_IDS.slice();
  run.rng.shuffle(pool);
  const picks = [];
  const seenSuits = new Set();
  for (const id of pool) {
    const c = getCard(id);
    if (picks.length < DRAFT.choices && !seenSuits.has(c.suit)) {
      picks.push(c); seenSuits.add(c.suit);
    }
    if (picks.length >= DRAFT.choices) break;
  }
  while (picks.length < DRAFT.choices) picks.push(getCard(pool[picks.length]));
  run.draftOffer = picks;
  return picks;
}

/** Take a drafted card into the master deck. */
export function takeDraftCard(run, cardId) {
  run.deckIds.push(cardId);
  run.score += SCORING.perCardDrafted;
  run.draftOffer = null;
}

/** Offer 3 relics (see relics.js). */
export function offerRelicChoices(run) {
  const offered = offerRelics(run.relics, RELIC_CHOICE_COUNT, run.rng);
  run.relicOffer = offered;
  return offered;
}

/** Take a relic. */
export function takeRelic(run, relicId) {
  run.relics.push(relicId);
  run.score += SCORING.perRelicTaken;
  run.stats.relicsTaken++;
  const r = getRelic(relicId);
  if (r && r.hooks.healOnTake) {
    run.player.hp = Math.min(run.player.maxHp, run.player.hp + r.hooks.healOnTake);
  }
  run.relicOffer = null;
}
