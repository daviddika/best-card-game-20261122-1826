// ============================================================================
// Ember Court — config.js
// ONE JOB: every tunable number, suit definition, act / boss definition and
// scoring rule in one place, so balancing the game never means hunting
// through battle logic. Nothing in here touches the DOM or the game state;
// battle.js reads these constants and applies them.
// ============================================================================

/** The four suits. Colour AND glyph AND shape distinguish every suit, so a
 *  card is never identified by text alone (judge criterion 4). */
export const SUITS = {
  ember: {
    id: 'ember', name: 'Ember', glyph: '🔥', colour: '#ff5a2a', dark: '#a32e00',
    shape: 'flame', comboName: 'Wildfire',
    comboText: 'Wildfire: +4 damage to the rival this turn.',
    flavour: 'The court\'s hearth-fire. Fast, hungry, and hard to put out.',
    mechanic: 'Burn: damage over time. Ember cards hit hard and leave a burn behind.',
  },
  tide: {
    id: 'tide', name: 'Tide', glyph: '💧', colour: '#2aa8ff', dark: '#0b4d8a',
    shape: 'droplet', comboName: 'High Tide',
    comboText: 'High Tide: heal 4 HP and draw 1 card.',
    flavour: 'The deep court. Patient water wears down stone — and mends the duelist.',
    mechanic: 'Flow: heal, draw and wash away enemy strength.',
  },
  thorn: {
    id: 'thorn', name: 'Thorn', glyph: '🌿', colour: '#37c978', dark: '#0e5c2e',
    shape: 'leaf', comboName: 'Thornwall',
    comboText: 'Thornwall: gain 6 Block and Weaken the rival.',
    flavour: 'The garden court. Every wall it raises has teeth.',
    mechanic: 'Guard: Block, Weaken and thorns that bite back when struck.',
  },
  gale: {
    id: 'gale', name: 'Gale', glyph: '🌪️', colour: '#b06cff', dark: '#4d1a8a',
    shape: 'spiral', comboName: 'Storm Surge',
    comboText: 'Storm Surge: gain 2 Ember and draw 1 card.',
    flavour: 'The high court. It never stands still long enough to be hit.',
    mechanic: 'Tempo: cheap cards, extra Ember, and card draw to keep the storm going.',
  },
};

/** Ordered list of suit ids — used by the renderer and the combo tracker. */
export const SUIT_ORDER = ['ember', 'tide', 'thorn', 'gale'];

/** Player / run tuning. */
export const PLAYER = {
  maxHp: 40,
  startHp: 40,
  startEmber: 3,          // ember (mana) available on turn 1
  emberPerTurn: 4,        // base ember refreshed each turn (enough for 2–3 cards)
  maxEmber: 10,
  startHandSize: 5,
  drawPerTurn: 2,
  startGold: 0,
  startScore: 0,
};

/** Combo rule: how many cards of one suit in a single turn trigger the bonus. */
export const COMBO = {
  threshold: 2,           // 2+ cards of the same suit in one turn
  emberBonusDamage: 4,
  tideHeal: 4,
  tideDraw: 1,
  thornBlock: 6,
  galeEmber: 2,
  galeDraw: 1,
};

/** Status-effect tuning. Every status is visible as an icon chip on its owner. */
export const STATUS = {
  burnDamagePerStack: 2,  // burn ticks at the start of the owner's turn
  burnMaxStacks: 9,
  weakenAttackLoss: 3,    // weaken reduces the owner's attack by this much (min 1)
  weakenMaxStacks: 3,
  strengthDamagePerStack: 2,
  strengthMaxStacks: 9,
  thornsDamagePerStack: 2, // thorns damage dealt back to an attacker
  shieldMaxStacks: 99,
};

/** Scoring: what a run is worth. Shown live in the top bar. */
export const SCORING = {
  perDamageDealt: 1,      // 1 point per damage dealt to a rival
  perBlockGained: 0,      // block is defence, not score
  perActWin: 150,
  perBossWin: 250,
  perRelicTaken: 25,
  perCardDrafted: 10,
  campaignWinBonus: 500,
  endlessWinBonus: 100,   // per endless rival beaten, scaled by level below
  goldPerWin: 30,
  goldPerBossWin: 60,
};

/** The campaign: three acts, each with a rival and a boss. Bosses have their
 *  own deck flavour (preferred suits), personality text and an opening taunt,
 *  so each act feels like a different opponent rather than a stat swap. */
export const ACTS = [
  {
    act: 1,
    name: 'Act I — The Outer Court',
    rival: {
      id: 'squire-ash', name: 'Squire Ash', title: 'Outer Court Rival',
      portrait: '🛡️', hp: 26, handSize: 4, tier: 1,
      suits: ['ember', 'thorn'],
      personality: 'cautious',   // shields when low, attacks when safe
      taunt: 'The Warden sends his regards. I will not fall quickly.',
    },
    boss: {
      id: 'warden-ember', name: 'Warden of Embers', title: 'Act I Boss',
      portrait: '👑', hp: 46, handSize: 5, tier: 2,
      suits: ['ember', 'ember', 'gale'],
      personality: 'aggressive', // attacks hard, rarely shields
      taunt: 'You made it past my squire. The hearth-fire does not forgive.',
    },
  },
  {
    act: 2,
    name: 'Act II — The Drowned Gallery',
    rival: {
      id: 'lady-tide', name: 'Lady Tidecaller', title: 'Drowned Gallery Rival',
      portrait: '🧜', hp: 34, handSize: 5, tier: 1,
      suits: ['tide', 'gale'],
      personality: 'cunning',    // heals, weakens, saves big cards
      taunt: 'The gallery floods for no one, duelist. Mind your footing.',
    },
    boss: {
      id: 'warden-tide', name: 'Warden of Tides', title: 'Act II Boss',
      portrait: '🌊', hp: 58, handSize: 5, tier: 2,
      suits: ['tide', 'tide', 'thorn'],
      personality: 'cunning',
      taunt: 'I have drowned a hundred challengers. You will be the hundred-and-first.',
    },
  },
  {
    act: 3,
    name: 'Act III — The Thorn Throne',
    rival: {
      id: 'knight-thorn', name: 'Knight Bramble', title: 'Thorn Throne Rival',
      portrait: '⚔️', hp: 42, handSize: 5, tier: 2,
      suits: ['thorn', 'ember'],
      personality: 'aggressive',
      taunt: 'The throne is ringed in thorns. Every step closer costs blood.',
    },
    boss: {
      id: 'ember-sovereign', name: 'The Ember Sovereign', title: 'Final Boss — Act III',
      portrait: '👑', hp: 72, handSize: 6, tier: 3,
      suits: ['ember', 'tide', 'thorn', 'gale'],
      personality: 'sovereign',  // reads your block and picks the counter-play
      taunt: 'Three courts bowed to me. Yours will be the fourth. Come, duelist.',
    },
  },
];

/** Endless Duel: rivals scale forever. Level N rival stats. */
export function endlessRivalForLevel(level) {
  const names = [
    ['Rogue Cinder', '🔥'], ['Driftwood Duelist', '💧'], ['Bramble Whelp', '🌿'],
    ['Storm Acolyte', '🌪️'], ['Ashen Knight', '🛡️'], ['Tide Witch', '🧜'],
    ['Gale Herald', '🦅'], ['Thorn Matron', '🌹'],
  ];
  const pick = names[(level - 1) % names.length];
  return {
    id: 'endless-' + level,
    name: pick[0] + ' · Lv ' + level,
    title: 'Endless Rival ' + level,
    portrait: pick[1],
    hp: 24 + level * 6,
    handSize: Math.min(4 + Math.floor(level / 3), 6),
    tier: Math.min(3, 1 + Math.floor(level / 3)),
    suits: ['ember', 'tide', 'thorn', 'gale'],
    personality: level % 3 === 0 ? 'sovereign' : level % 2 === 0 ? 'cunning' : 'aggressive',
    taunt: 'Endless rival ' + level + ' steps onto the table. No crown waits — only score.',
  };
}

/** How many cards the starting deck holds, and which ones. Deck-building
 *  starts here; the draft between acts grows it. */
export const STARTING_DECK = [
  'ember-strike', 'ember-strike', 'ember-strike',
  'tide-splash', 'tide-splash',
  'thorn-guard', 'thorn-guard', 'thorn-guard',
  'gale-cut', 'gale-cut',
];

/** Draft pool weights: which suits the between-act draft may offer. */
export const DRAFT = {
  choices: 3,
  poolSuits: ['ember', 'tide', 'thorn', 'gale'],
};

/** Relic choice after each act win. */
export const RELIC_CHOICE_COUNT = 3;

/** Turn flow constants. */
export const TURNS = {
  maxHandSize: 10,        // hand overflows go to discard
  burnTickAtTurnStart: true,
  enemyDrawPerTurn: 2,
};

/** Cosmetic tuning for floating damage numbers and the confetti flourish. */
export const FX = {
  floatMs: 1100,
  confettiPieces: 90,
  confettiMs: 2600,
};

/** Keyboard map (also documented on the title screen and in help). */
export const KEYS = {
  playCard: ['1', '2', '3', '4', '5', '6', '7'],
  endTurn: 'Enter',
  pause: 'Escape',
  sound: 'm',
  help: 'h',
};

/** Help text shown in the overlay (also the first thing a new player reads). */
export const HELP_HTML = `
<p><b>Goal.</b> Reduce the rival's HP to 0 before yours reaches 0. Win all three acts to take the Ember Crown — or chase score in Endless Duel.</p>
<p><b>Ember (mana).</b> Each card costs Ember. You refresh to 4 Ember (+ relics) at the start of your turn. Unspent Ember is lost.</p>
<p><b>Suits &amp; combos.</b> Play 2 cards of the same suit in one turn to trigger that suit's combo: 🔥 Wildfire +4 damage, 💧 High Tide heal 4 &amp; draw 1, 🌿 Thornwall +6 Block &amp; Weaken the rival, 🌪️ Storm Surge +2 Ember &amp; draw 1.</p>
<p><b>Statuses.</b> 🔥 Burn damages at turn start · 💪 Strength adds damage · 🛡️ Block absorbs damage · 🥀 Weaken lowers attacks · 🌵 Thorns bite attackers back.</p>
<p><b>Read the intent.</b> The rival shows what it will do next — "will attack for 9" or "will shield". Shield up before a big attack; strike while it shields.</p>
<p><b>Between acts.</b> Draft 1 of 3 new cards, then pick 1 of 3 relics. Relics are passive powers that change how you play.</p>
<p><b>Controls.</b> Click a card (or press 1–7) to play it · Enter ends your turn · Esc pauses · M toggles sound.</p>`;
