// ============================================================================
// Ember Court — codex.js
// ONE JOB: the duelist's codex — strategy writing the player can actually
// use. Suit guides, boss reads, combo recipes and common mistakes, all as
// data the help overlay renders. Nothing here is rules text copied from
// another game: every tip is written for Ember Court's own systems
// (combos, intents, relics, drafts) and names the cards that teach it.
// ============================================================================

import { SUITS } from './config.js';

/** Per-suit strategy guide: how the suit wants to be played. */
export const SUIT_GUIDES = [
  {
    suit: 'ember', title: 'Playing Ember',
    lines: [
      'Ember wins fast or not at all. Spend your opening turns landing Burn (Fan the Flames, Brand of Cinders) and let it tick while you set up the big hit.',
      'Immolate is the payoff card: it deals +4 when the rival is already Burning, so always Burn first, burst second.',
      'The Wildfire combo (+4 damage) rewards playing two Ember cards in one turn — hold a cheap Ember Strike to pair with a bigger Ember card.',
      'Watch your own HP: Ember has almost no healing. Pair it with Tide cards or the Tide Charm relic if the run goes long.',
    ],
    keyCards: ['ember-fan', 'ember-immolate', 'ember-pyroclasm', 'ember-wildfire'],
  },
  {
    suit: 'tide', title: 'Playing Tide',
    lines: [
      'Tide wins by outlasting. Mending Tide and Sanctuary Pool buy turns; every turn you survive is a turn your Burn and Thorns are working.',
      'Draw is Tide\'s real weapon: Swift Current and Pearl Dive keep your hand full, which means more chances to hit your combo.',
      'The High Tide combo (heal 4, draw 1) fires often because Tide cards are cheap — two 1-cost Tide cards in one turn is a free heal.',
      'Undertow and Siren Song weaken the rival before its big turn. Check the intent: if it says "will attack for 12", Weaken first, attack second.',
    ],
    keyCards: ['tide-mend', 'tide-current', 'tide-sanctuary', 'tide-deluge'],
  },
  {
    suit: 'thorn', title: 'Playing Thorn',
    lines: [
      'Thorn is the patient suit. Barkskin and Living Hedge build Block and Thorns; the rival hurts itself attacking you.',
      'Weaken is worth more than damage against bosses: a boss that hits for 14 hits for 11 when Weakened, and 8 when Weakened twice.',
      'The Thornwall combo (+6 Block, Weaken the rival) is the best defensive turn in the game. Two Thorn cards when the intent is a big attack is a full answer.',
      'Ironwood Plate (18 Block) plus a Thorns stack turns a boss\'s best turn into your best turn.',
    ],
    keyCards: ['thorn-guard', 'thorn-bark', 'thorn-hedge', 'thorn-ironwood'],
  },
  {
    suit: 'gale', title: 'Playing Gale',
    lines: [
      'Gale is tempo: cheap cards, extra Ember, extra draws. A Gale turn plays three cards where other suits play one.',
      'Wind Dash costs 0 and draws a card — it is never a bad play. Use it to dig for the card you actually need.',
      'The Storm Surge combo (+2 Ember, draw 1) can chain: the Ember it refunds pays for the next Gale card, which can fire the combo again next turn.',
      'Gale\'s weakness is raw numbers: its biggest hits are smaller than Ember\'s. Draft one or two Ember finishers so Gale\'s engine has something to deliver.',
    ],
    keyCards: ['gale-dash', 'gale-gust', 'gale-tailwind', 'gale-tempest'],
  },
];

/** Boss reads: what each boss does and how to answer it. */
export const BOSS_GUIDES = [
  {
    boss: 'Warden of Embers', act: 1,
    read: 'Aggressive. He attacks hard and rarely shields, and his Ember deck Burns you. Bring Block (Thorn) or healing (Tide) and kill him before the Burn stacks up.',
    counter: 'Thorn Guard on the turns his intent reads 9 or more; save your burst for after his shield turns.',
  },
  {
    boss: 'Warden of Tides', act: 2,
    read: 'Cunning. She heals, weakens you, and draws into her best cards. Burst damage beats her: she cannot heal what is already dead.',
    counter: 'Do not trade chip damage — she heals it back. Save a 12+ damage turn and spend it all at once.',
  },
  {
    boss: 'The Ember Sovereign', act: 3,
    read: 'Sovereign. He reads your Block and picks the counter: if you are heavily shielded he Weakens and Burns instead of attacking into it. Keep your Block modest and your offence steady.',
    counter: 'Mix Block and damage every turn so no single counter-play answers you. Thorns punish his attacks; Burn punishes his patience.',
  },
];

/** Combo recipes: two-card (or three-card) plays that punch above their cost. */
export const COMBO_RECIPES = [
  { name: 'Kindle & Burst', cards: ['Fan the Flames', 'Immolate'], text: 'Burn first (2 Burn), then Immolate for 4 + 4 bonus damage. 3 Ember, 12+ damage.' },
  { name: 'The Wall That Bites', cards: ['Barkskin', 'Living Hedge'], text: 'Two Thorn cards: +19 Block, 2 Thorns, and the Thornwall combo adds 6 more Block and a Weaken.' },
  { name: 'Storm Engine', cards: ['Wind Dash', 'Tailwind', 'Squall Line'], text: 'Dash draws, Tailwind refunds 2 Ember, Squall hits for 8 and draws again. Three cards for the price of one turn.' },
  { name: 'High Tide Reset', cards: ['Mending Tide', 'Swift Current'], text: 'Heal 6, deal 3, draw 1, and the High Tide combo heals 4 more and draws again. A full reset for 2 Ember.' },
  { name: 'Phoenix Turn', cards: ['Phoenix Rise', 'Ember Strike'], text: 'Heal 6, gain Strength, then strike with the Strength already counting. The next turns all hit harder.' },
];

/** Common mistakes, stated plainly so a new player can dodge them. */
export const COMMON_MISTAKES = [
  'Spending all your Ember on damage the turn before a boss attacks for 12. Read the intent first; Block is also a play.',
  'Playing your only Burn card after your burst instead of before it. Order matters: Burn, then Immolate.',
  'Drafting a third suit\'s cards every act. Two suits combo reliably; four suits combo never.',
  'Skipping a relic choice. Relics are permanent — the weakest relic still beats no relic.',
  'Ending the turn with unspent Ember and a playable card in hand. Ember does not carry over; spend it or lose it.',
];

/** Render the whole codex as HTML for the help overlay. */
export function codexHtml() {
  let html = '<p><b>The Duelist\'s Codex.</b> Everything below is strategy for this game — no other game\'s rules, just what wins here.</p>';
  for (const g of SUIT_GUIDES) {
    const suit = SUITS[g.suit];
    html += '<h3 style="color:' + suit.colour + '">' + suit.glyph + ' ' + g.title + '</h3>';
    for (const line of g.lines) html += '<p>' + line + '</p>';
  }
  html += '<h3>👑 Reading the bosses</h3>';
  for (const b of BOSS_GUIDES) {
    html += '<p><b>' + b.boss + ' (Act ' + b.act + ').</b> ' + b.read + '<br><i>Counter: ' + b.counter + '</i></p>';
  }
  html += '<h3>🃏 Combo recipes</h3>';
  for (const r of COMBO_RECIPES) {
    html += '<p><b>' + r.name + ' — ' + r.cards.join(' + ') + '.</b> ' + r.text + '</p>';
  }
  html += '<h3>⚠️ Common mistakes</h3>';
  for (const m of COMMON_MISTAKES) html += '<p>• ' + m + '</p>';
  return html;
}
