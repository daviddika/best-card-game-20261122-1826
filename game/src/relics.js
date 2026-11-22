// ============================================================================
// Ember Court — relics.js
// ONE JOB: the relic pool. Relics are passive powers the player picks 1-of-3
// after each act win. Each relic is data + a hook name; battle.js applies
// the hooks at the right moment (turn start, on play, on win, on damage).
// A relic never needs its own code path — it is a named modifier the engine
// checks, so new relics are one record each.
// ============================================================================

export const RELICS = {
  'ember-heart': {
    id: 'ember-heart', name: 'Ember Heart', icon: '❤️‍🔥', rarity: 'rare',
    text: 'Start each battle with +10 max HP and heal 10 HP now.',
    flavour: 'A coal that never cools, worn over the heart.',
    hooks: { maxHpBonus: 10, healOnTake: 10 },
  },
  'gilded-coin': {
    id: 'gilded-coin', name: 'Gilded Coin', icon: '🪙', rarity: 'common',
    text: 'Gain +20 gold after every victory.',
    flavour: 'It always lands on its edge, and the edge pays.',
    hooks: { goldPerWinBonus: 20 },
  },
  'storm-lantern': {
    id: 'storm-lantern', name: 'Storm Lantern', icon: '🏮', rarity: 'common',
    text: 'Start every turn with +1 Ember.',
    flavour: 'It burns with bottled lightning. The court pretends not to notice.',
    hooks: { emberPerTurnBonus: 1 },
  },
  'thornmail': {
    id: 'thornmail', name: 'Thornmail Vest', icon: '🦔', rarity: 'uncommon',
    text: 'Start every battle with 3 Thorns.',
    flavour: 'Wear the garden. Let the garden answer.',
    hooks: { thornsAtBattleStart: 3 },
  },
  'tide-charm': {
    id: 'tide-charm', name: 'Tide Charm', icon: '🐚', rarity: 'common',
    text: 'Heal 3 HP at the start of every turn.',
    flavour: 'The sea sends its regards, every morning, on time.',
    hooks: { healPerTurn: 3 },
  },
  'whetstone': {
    id: 'whetstone', name: 'Whetstone of Dawn', icon: '🗡️', rarity: 'uncommon',
    text: 'Your attacks deal +2 damage.',
    flavour: 'Sharpened once, at dawn, on a stone that remembers.',
    hooks: { attackBonus: 2 },
  },
  'iron-bark': {
    id: 'iron-bark', name: 'Iron Bark', icon: '🛡️', rarity: 'common',
    text: 'Start every battle with 8 Block.',
    flavour: 'Bark, but make it armour.',
    hooks: { blockAtBattleStart: 8 },
  },
  'swift-boots': {
    id: 'swift-boots', name: 'Swift Boots', icon: '🥾', rarity: 'common',
    text: 'Draw 1 extra card at the start of every turn.',
    flavour: 'They have never once stood still. Neither will you.',
    hooks: { drawPerTurnBonus: 1 },
  },
  'cinder-crown': {
    id: 'cinder-crown', name: 'Cinder Crown', icon: '👑', rarity: 'rare',
    text: 'Your Ember suit combos trigger at 2 cards AND deal +4 more damage.',
    flavour: 'A smaller crown, but it burns just as bright.',
    hooks: { emberComboBonusDamage: 4 },
  },
  'frozen-flask': {
    id: 'frozen-flask', name: 'Frozen Flask', icon: '🧪', rarity: 'uncommon',
    text: 'Apply 1 Burn to the rival at the start of every turn.',
    flavour: 'Winter, corked. Shake well before duelling.',
    hooks: { burnPerTurn: 1 },
  },
  'lucky-die': {
    id: 'lucky-die', name: 'Lucky Die', icon: '🎲', rarity: 'uncommon',
    text: 'The first card you play each turn costs 1 less Ember.',
    flavour: 'It has no bad faces. Someone filed them off.',
    hooks: { firstCardDiscount: 1 },
  },
  'war-banner': {
    id: 'war-banner', name: 'War Banner', icon: '🚩', rarity: 'rare',
    text: 'Gain 2 Strength at the start of every battle.',
    flavour: 'Raise it, and the whole table stands a little taller.',
    hooks: { strengthAtBattleStart: 2 },
  },
  'mirror-shard': {
    id: 'mirror-shard', name: 'Mirror Shard', icon: '🪞', rarity: 'uncommon',
    text: 'When the rival attacks, reflect 3 damage back.',
    flavour: 'It shows the rival exactly what they deserve.',
    hooks: { reflectDamage: 3 },
  },
  'endless-quiver': {
    id: 'endless-quiver', name: 'Endless Quiver', icon: '🎯', rarity: 'common',
    text: 'Your hand size grows by 1 (draw 6 to start).',
    flavour: 'Reach in. There is always one more.',
    hooks: { handSizeBonus: 1 },
  },
  'phoenix-feather': {
    id: 'phoenix-feather', name: 'Phoenix Feather', icon: '🪶', rarity: 'rare',
    text: 'Once per run, when you would fall, survive at 1 HP instead and heal 10.',
    flavour: 'It has already burned once. It is not afraid of twice.',
    hooks: { secondWind: true },
  },
};

export const ALL_RELIC_IDS = Object.keys(RELICS);

export function getRelic(id) { return RELICS[id]; }

/** Sum a numeric hook across a list of owned relic ids. */
export function sumHook(relicIds, hook) {
  let total = 0;
  for (const id of relicIds) {
    const r = RELICS[id];
    if (r && r.hooks && typeof r.hooks[hook] === 'number') total += r.hooks[hook];
  }
  return total;
}

/** True when any owned relic carries a boolean hook. */
export function hasHook(relicIds, hook) {
  return relicIds.some((id) => RELICS[id] && RELICS[id].hooks && RELICS[id].hooks[hook]);
}

/** Offer `count` distinct relics the player does not own yet. */
export function offerRelics(ownedIds, count, rng) {
  const pool = ALL_RELIC_IDS.filter((id) => !ownedIds.includes(id));
  const shuffled = pool.slice();
  rng.shuffle(shuffled);
  return shuffled.slice(0, count).map((id) => RELICS[id]);
}

/** One-line summary of owned relics for the victory / defeat screen. */
export function relicSummary(relicIds) {
  if (!relicIds.length) return 'No relics claimed.';
  return relicIds.map((id) => {
    const r = RELICS[id];
    return r ? r.icon + ' ' + r.name : id;
  }).join(' · ');
}
