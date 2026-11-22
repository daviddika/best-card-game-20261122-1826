// ============================================================================
// Ember Court — shots.js
// ONE JOB: deterministic screenshot states. The URL ?shot=title|battle|
// victory|defeat&seed=N puts the game into a fixed, attractive state with
// no user input, so the maker's screenshots are real renders of the game's
// own code and reproducible from the seed. Battle uses a fixed mid-fight
// table (both hands full, statuses on, a combo half-charged); victory and
// defeat build a finished run's stats and show the end screens.
// ============================================================================

import { createRun, startBattle, playPlayerCard, collectWinRewards } from './battle.js';
import { ACTS } from './config.js';
import { seedFromUrl } from './random.js';

/** Read the ?shot= parameter ('' when absent — normal play). */
export function shotFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get('shot') || '';
  } catch (e) { return ''; }
}

/**
 * Build the deterministic state for a shot. Returns a run object already
 * in the right screen state, or null for normal play. Callers render it
 * with render.js exactly as they would a live run.
 */
export function buildShotState(shot) {
  const seed = seedFromUrl() || 7;
  if (shot === 'title') {
    return { shot: 'title', run: null };
  }
  if (shot === 'battle') {
    const run = createRun('campaign', seed);
    // Act I boss, mid-fight: a varied hand (one strong card per suit plus a
    // second Ember card) so the cover shows the whole game at a glance.
    startBattle(run, ACTS[0].boss);
    const showcaseHand = ['ember-strike', 'ember-brand', 'tide-deluge', 'thorn-hedge', 'gale-squall'];
    // Return the cards currently in hand to the draw pile, then set the
    // showcase hand (the deck still counts the same total of cards).
    const current = run.deck.hand.splice(0, run.deck.hand.length);
    run.deck.drawPile.push(...current);
    run.deck.hand.push(...showcaseHand);
    run.player.hand = run.deck.hand;
    run.suitsPlayedThisTurn = { ember: 1 };
    run.player.ember = 2;
    // Force a rich, readable table for the screenshot: both fighters carry
    // statuses, the rival shows a meaty intent, and the player has ember left.
    run.player.hp = 31;
    run.player.block = 7;
    run.player.status.strength = 1;
    run.player.status.thorns = 1;
    run.player.ember = 2;
    run.enemy.fighter.hp = 29;
    run.enemy.fighter.block = 4;
    run.enemy.fighter.status.burn = 3;
    run.enemy.fighter.status.weaken = 1;
    run.enemy.intent = { kind: 'attack', value: 9, text: '⚔️ Will attack for 9' };
    run.score = 187;
    run.gold = 45;
    run.log.push('🔥 Wildfire is one card away — play a second Ember card!');
    return { shot: 'battle', run };
  }
  if (shot === 'victory') {
    const run = createRun('campaign', seed);
    startBattle(run, ACTS[2].boss);
    run.stats.damageDealt = 214;
    run.stats.damageTaken = 58;
    run.stats.cardsPlayed = 47;
    run.stats.combosTriggered = 9;
    run.stats.turnsTaken = 19;
    run.stats.battlesWon = 6;
    run.score = 1240;
    run.gold = 210;
    run.relics = ['ember-heart', 'storm-lantern', 'whetstone'];
    run.deckIds = run.deckIds.concat(['ember-pyroclasm', 'tide-deluge', 'thorn-ironwood', 'gale-tempest']);
    run.enemy.fighter.hp = 0;
    run.over = true; run.won = true;
    const reward = { gold: 60, score: 750, isBoss: true, isCampaignWin: true };
    return { shot: 'victory', run, reward };
  }
  if (shot === 'defeat') {
    const run = createRun('campaign', seed);
    run.actIndex = 1; // fell in Act II, against the Warden of Tides
    startBattle(run, ACTS[1].boss);
    run.stats.damageDealt = 96;
    run.stats.damageTaken = 41;
    run.stats.cardsPlayed = 23;
    run.stats.combosTriggered = 3;
    run.stats.turnsTaken = 11;
    run.stats.battlesWon = 3;
    run.score = 512;
    run.gold = 90;
    run.relics = ['tide-charm', 'iron-bark'];
    run.deckIds = run.deckIds.concat(['tide-deluge', 'thorn-hedge']);
    run.player.hp = 0;
    run.enemy.fighter.hp = 34;
    run.over = true; run.won = false;
    return { shot: 'defeat', run };
  }
  return null;
}

/** The shots.json mapping the repo ships (kept in sync with main.ts). */
export const SHOT_LIST = [
  { name: '1-battle.jpg', query: '?shot=battle&seed=7' },
  { name: '2-title.jpg', query: '?shot=title&seed=7' },
  { name: '3-victory.jpg', query: '?shot=victory&seed=7' },
  { name: '4-defeat.jpg', query: '?shot=defeat&seed=7' },
];
