// ============================================================================
// Ember Court — cards.js
// ONE JOB: the card database. 60 distinct cards, 15 per suit, each with a
// cost, attack / block values and an effect object the battle engine reads.
// No other file defines a card; battle.js, deck.js and ai.js all look cards
// up here by id. Effects understood by the engine:
//   damage, block, heal, draw, gainEmber, burn, weaken, strength, thorns,
//   shield (gain block that persists), lifesteal, discardEnemy, cleanse.
// A card's `text` is what the player reads on the card face; `flavour` is
// the one-line story under it. Costs are balanced so a 3-ember turn can
// usually play 1–2 cards, and a Gale turn can play 3.
// ============================================================================

import { SUITS } from './config.js';

/**
 * Card record shape:
 *   id, name, suit, cost, attack, block,
 *   effects: { burn, weaken, strength, thorns, heal, draw, gainEmber,
 *              lifesteal, cleanse, shield, extraDamageIfBurning, ... }
 *   text: rules text shown on the card
 *   flavour: one line of story
 *   rarity: 'common' | 'uncommon' | 'rare'
 */
export const CARDS = {
  // ---------------------------------------------------------------- EMBER 🔥
  // Mechanic: burst damage + Burn (damage over time). Ember cards are the
  // court's hammer: expensive, loud, and they leave a fire behind.
  'ember-strike': {
    id: 'ember-strike', name: 'Ember Strike', suit: 'ember', cost: 1,
    attack: 6, block: 0, effects: {}, rarity: 'common',
    text: 'Deal 6 damage.',
    flavour: 'The first lesson of the hearth: hit first.',
  },
  'ember-fan': {
    id: 'ember-fan', name: 'Fan the Flames', suit: 'ember', cost: 1,
    attack: 3, block: 0, effects: { burn: 2 }, rarity: 'common',
    text: 'Deal 3 damage. Apply 2 Burn.',
    flavour: 'A spark is a promise the fire intends to keep.',
  },
  'ember-brand': {
    id: 'ember-brand', name: 'Brand of Cinders', suit: 'ember', cost: 2,
    attack: 5, block: 0, effects: { burn: 3 }, rarity: 'common',
    text: 'Deal 5 damage. Apply 3 Burn.',
    flavour: 'The mark stays long after the blade is gone.',
  },
  'ember-burst': {
    id: 'ember-burst', name: 'Cinder Burst', suit: 'ember', cost: 2,
    attack: 9, block: 0, effects: {}, rarity: 'common',
    text: 'Deal 9 damage.',
    flavour: 'Sometimes the whole argument is one explosion.',
  },
  'ember-rage': {
    id: 'ember-rage', name: 'Kindled Rage', suit: 'ember', cost: 0,
    attack: 2, block: 0, effects: { strength: 1 }, rarity: 'common',
    text: 'Deal 2 damage. Gain 1 Strength.',
    flavour: 'Anger, banked properly, burns all night.',
  },
  'ember-immolate': {
    id: 'ember-immolate', name: 'Immolate', suit: 'ember', cost: 2,
    attack: 4, block: 0, effects: { burn: 4, extraDamageIfBurning: 4 }, rarity: 'uncommon',
    text: 'Deal 4 damage. Apply 4 Burn. If the rival is Burning, deal 4 more.',
    flavour: 'Oil meets open flame. The court looks away.',
  },
  'ember-pyroclasm': {
    id: 'ember-pyroclasm', name: 'Pyroclasm', suit: 'ember', cost: 3,
    attack: 14, block: 0, effects: { burn: 2 }, rarity: 'uncommon',
    text: 'Deal 14 damage. Apply 2 Burn.',
    flavour: 'The mountain cleared its throat once. Once was enough.',
  },
  'ember-emberlash': {
    id: 'ember-emberlash', name: 'Emberlash', suit: 'ember', cost: 1,
    attack: 4, block: 0, effects: { lifesteal: 4 }, rarity: 'uncommon',
    text: 'Deal 4 damage. Heal for the damage dealt (max 4).',
    flavour: 'The fire gives back what it takes — politely, in embers.',
  },
  'ember-wildfire': {
    id: 'ember-wildfire', name: 'Wildfire', suit: 'ember', cost: 3,
    attack: 8, block: 0, effects: { burn: 5 }, rarity: 'rare',
    text: 'Deal 8 damage. Apply 5 Burn.',
    flavour: 'Nobody schedules a wildfire. It schedules you.',
  },
  'ember-phoenix': {
    id: 'ember-phoenix', name: 'Phoenix Rise', suit: 'ember', cost: 2,
    attack: 0, block: 0, effects: { heal: 6, strength: 1 }, rarity: 'rare',
    text: 'Heal 6 HP. Gain 1 Strength.',
    flavour: 'From ash, wings. From wings, a second chance.',
  },
  'ember-meteor': {
    id: 'ember-meteor', name: 'Meteor Call', suit: 'ember', cost: 4,
    attack: 20, block: 0, effects: { burn: 3 }, rarity: 'rare',
    text: 'Deal 20 damage. Apply 3 Burn.',
    flavour: 'The sky keeps one stone in reserve for rude guests.',
  },
  'ember-sparkstorm': {
    id: 'ember-sparkstorm', name: 'Sparkstorm', suit: 'ember', cost: 2,
    attack: 3, block: 0, effects: { draw: 1, burn: 2 }, rarity: 'uncommon',
    text: 'Deal 3 damage. Apply 2 Burn. Draw 1 card.',
    flavour: 'Every spark lands somewhere. Most of them land on the rival.',
  },
  'ember-coalheart': {
    id: 'ember-coalheart', name: 'Coalheart', suit: 'ember', cost: 1,
    attack: 0, block: 7, effects: { burn: 1 }, rarity: 'common',
    text: 'Gain 7 Block. Apply 1 Burn.',
    flavour: 'A heart of coal is warm, heavy, and very hard to break.',
  },
  'ember-backdraft': {
    id: 'ember-backdraft', name: 'Backdraft', suit: 'ember', cost: 1,
    attack: 0, block: 0, effects: { burn: 3, thorns: 2 }, rarity: 'uncommon',
    text: 'Apply 3 Burn. Gain 2 Thorns.',
    flavour: 'Open the wrong door in this court and the fire answers.',
  },
  'ember-inferno': {
    id: 'ember-inferno', name: 'Inferno Crown', suit: 'ember', cost: 5,
    attack: 24, block: 0, effects: { burn: 6, strength: 1 }, rarity: 'rare',
    text: 'Deal 24 damage. Apply 6 Burn. Gain 1 Strength.',
    flavour: 'The crown the Sovereign wears is not made of gold.',
  },

  // ------------------------------------------------------------------ TIDE 💧
  // Mechanic: heal, draw, and flow. Tide cards keep you alive, keep your
  // hand full, and wash the rival's strength away.
  'tide-splash': {
    id: 'tide-splash', name: 'Tide Splash', suit: 'tide', cost: 1,
    attack: 4, block: 0, effects: { heal: 2 }, rarity: 'common',
    text: 'Deal 4 damage. Heal 2 HP.',
    flavour: 'Cold water, warm hands, steady heart.',
  },
  'tide-current': {
    id: 'tide-current', name: 'Swift Current', suit: 'tide', cost: 1,
    attack: 3, block: 0, effects: { draw: 1 }, rarity: 'common',
    text: 'Deal 3 damage. Draw 1 card.',
    flavour: 'The river never argues. It simply arrives.',
  },
  'tide-mend': {
    id: 'tide-mend', name: 'Mending Tide', suit: 'tide', cost: 1,
    attack: 0, block: 0, effects: { heal: 6 }, rarity: 'common',
    text: 'Heal 6 HP.',
    flavour: 'Salt water closes what swords open.',
  },
  'tide-wall': {
    id: 'tide-wall', name: 'Tidewall', suit: 'tide', cost: 2,
    attack: 0, block: 11, effects: { heal: 2 }, rarity: 'common',
    text: 'Gain 11 Block. Heal 2 HP.',
    flavour: 'A wall of water holds — and then it gives back.',
  },
  'tide-undertow': {
    id: 'tide-undertow', name: 'Undertow', suit: 'tide', cost: 2,
    attack: 6, block: 0, effects: { weaken: 1 }, rarity: 'common',
    text: 'Deal 6 damage. Apply 1 Weaken.',
    flavour: 'The pull you do not see is the one that takes you.',
  },
  'tide-deluge': {
    id: 'tide-deluge', name: 'Deluge', suit: 'tide', cost: 3,
    attack: 10, block: 0, effects: { draw: 1, weaken: 1 }, rarity: 'uncommon',
    text: 'Deal 10 damage. Draw 1 card. Apply 1 Weaken.',
    flavour: 'When the gallery floods, it floods all at once.',
  },
  'tide-siren': {
    id: 'tide-siren', name: 'Siren Song', suit: 'tide', cost: 2,
    attack: 0, block: 0, effects: { weaken: 2, draw: 1 }, rarity: 'uncommon',
    text: 'Apply 2 Weaken. Draw 1 card.',
    flavour: 'The song is lovely. The rocks are not.',
  },
  'tide-pearl': {
    id: 'tide-pearl', name: 'Pearl Dive', suit: 'tide', cost: 0,
    attack: 0, block: 0, effects: { draw: 2, heal: 2 }, rarity: 'uncommon',
    text: 'Draw 2 cards. Heal 2 HP.',
    flavour: 'Down where the light turns green, the good things hide.',
  },
  'tide-maelstrom': {
    id: 'tide-maelstrom', name: 'Maelstrom', suit: 'tide', cost: 3,
    attack: 12, block: 0, effects: { weaken: 1, draw: 1 }, rarity: 'rare',
    text: 'Deal 12 damage. Apply 1 Weaken. Draw 1 card.',
    flavour: 'The sea does not pick a side. It picks a winner.',
  },
  'tide-sanctuary': {
    id: 'tide-sanctuary', name: 'Sanctuary Pool', suit: 'tide', cost: 2,
    attack: 0, block: 8, effects: { heal: 5, cleanse: 1 }, rarity: 'rare',
    text: 'Gain 8 Block. Heal 5 HP. Cleanse your Burn and Weaken.',
    flavour: 'Still water, clear mind, mended wounds.',
  },
  'tide-tsunami': {
    id: 'tide-tsunami', name: 'Tsunami', suit: 'tide', cost: 4,
    attack: 18, block: 0, effects: { weaken: 2 }, rarity: 'rare',
    text: 'Deal 18 damage. Apply 2 Weaken.',
    flavour: 'The horizon stands up, walks over, and sits down on you.',
  },
  'tide-ebb': {
    id: 'tide-ebb', name: 'Ebb and Flow', suit: 'tide', cost: 1,
    attack: 2, block: 5, effects: { draw: 1 }, rarity: 'common',
    text: 'Deal 2 damage. Gain 5 Block. Draw 1 card.',
    flavour: 'Out, in, out, in — the tide keeps its own tempo.',
  },
  'tide-mist': {
    id: 'tide-mist', name: 'Harbour Mist', suit: 'tide', cost: 1,
    attack: 0, block: 6, effects: { weaken: 1 }, rarity: 'common',
    text: 'Gain 6 Block. Apply 1 Weaken.',
    flavour: 'You cannot hit what you cannot quite see.',
  },
  'tide-kraken': {
    id: 'tide-kraken', name: 'Kraken Grasp', suit: 'tide', cost: 3,
    attack: 8, block: 0, effects: { weaken: 2, burn: 0 }, rarity: 'rare',
    text: 'Deal 8 damage. Apply 2 Weaken.',
    flavour: 'Eight arms, one opinion: stay down.',
  },
  'tide-moonpool': {
    id: 'tide-moonpool', name: 'Moonpool', suit: 'tide', cost: 2,
    attack: 0, block: 0, effects: { heal: 8, gainEmber: 1 }, rarity: 'uncommon',
    text: 'Heal 8 HP. Gain 1 Ember.',
    flavour: 'The moon lends the pool its light, and the pool lends it back.',
  },

  // ----------------------------------------------------------------- THORN 🌿
  // Mechanic: Block, Weaken and Thorns. Thorn cards win slowly: they build
  // a wall, weaken the rival's arm, and let the wall bite back.
  'thorn-guard': {
    id: 'thorn-guard', name: 'Thorn Guard', suit: 'thorn', cost: 1,
    attack: 0, block: 8, effects: {}, rarity: 'common',
    text: 'Gain 8 Block.',
    flavour: 'The garden does not hurry. It grows over you.',
  },
  'thorn-lash': {
    id: 'thorn-lash', name: 'Briar Lash', suit: 'thorn', cost: 1,
    attack: 5, block: 0, effects: { weaken: 1 }, rarity: 'common',
    text: 'Deal 5 damage. Apply 1 Weaken.',
    flavour: 'A whip of green, a lesson in red.',
  },
  'thorn-bark': {
    id: 'thorn-bark', name: 'Barkskin', suit: 'thorn', cost: 1,
    attack: 0, block: 6, effects: { thorns: 1 }, rarity: 'common',
    text: 'Gain 6 Block. Gain 1 Thorns.',
    flavour: 'Hit the tree, and the tree files a complaint.',
  },
  'thorn-root': {
    id: 'thorn-root', name: 'Root Hold', suit: 'thorn', cost: 2,
    attack: 4, block: 7, effects: { weaken: 1 }, rarity: 'common',
    text: 'Deal 4 damage. Gain 7 Block. Apply 1 Weaken.',
    flavour: 'Roots do not chase you. They wait for you to run.',
  },
  'thorn-snare': {
    id: 'thorn-snare', name: 'Snarevine', suit: 'thorn', cost: 1,
    attack: 2, block: 0, effects: { weaken: 2 }, rarity: 'common',
    text: 'Deal 2 damage. Apply 2 Weaken.',
    flavour: 'One ankle is enough. The vine is patient.',
  },
  'thorn-hedge': {
    id: 'thorn-hedge', name: 'Living Hedge', suit: 'thorn', cost: 2,
    attack: 0, block: 13, effects: { thorns: 1 }, rarity: 'uncommon',
    text: 'Gain 13 Block. Gain 1 Thorns.',
    flavour: 'The hedge trims itself — on visitors.',
  },
  'thorn-thicket': {
    id: 'thorn-thicket', name: 'Thicket Ambush', suit: 'thorn', cost: 2,
    attack: 8, block: 4, effects: {}, rarity: 'uncommon',
    text: 'Deal 8 damage. Gain 4 Block.',
    flavour: 'The bushes were never just bushes.',
  },
  'thorn-seed': {
    id: 'thorn-seed', name: 'Seed of Spite', suit: 'thorn', cost: 0,
    attack: 0, block: 0, effects: { thorns: 2, weaken: 1 }, rarity: 'uncommon',
    text: 'Gain 2 Thorns. Apply 1 Weaken.',
    flavour: 'Plant it in the rival and watch it grow opinions.',
  },
  'thorn-ironwood': {
    id: 'thorn-ironwood', name: 'Ironwood Plate', suit: 'thorn', cost: 3,
    attack: 0, block: 18, effects: { strength: 1 }, rarity: 'rare',
    text: 'Gain 18 Block. Gain 1 Strength.',
    flavour: 'Wood that learned from iron, iron that learned from wood.',
  },
  'thorn-strangle': {
    id: 'thorn-strangle', name: 'Stranglethorn', suit: 'thorn', cost: 3,
    attack: 12, block: 0, effects: { weaken: 2 }, rarity: 'rare',
    text: 'Deal 12 damage. Apply 2 Weaken.',
    flavour: 'The garden keeps its promises, tightly.',
  },
  'thorn-ancient': {
    id: 'thorn-ancient', name: 'Ancient Grove', suit: 'thorn', cost: 2,
    attack: 0, block: 9, effects: { heal: 4, thorns: 1 }, rarity: 'rare',
    text: 'Gain 9 Block. Heal 4 HP. Gain 1 Thorns.',
    flavour: 'Old trees remember every duelist who ever bled here.',
  },
  'thorn-spore': {
    id: 'thorn-spore', name: 'Spore Cloud', suit: 'thorn', cost: 1,
    attack: 3, block: 3, effects: { weaken: 1 }, rarity: 'common',
    text: 'Deal 3 damage. Gain 3 Block. Apply 1 Weaken.',
    flavour: 'Breathe deep. Regret at your leisure.',
  },
  'thorn-nettle': {
    id: 'thorn-nettle', name: 'Nettle Swarm', suit: 'thorn', cost: 2,
    attack: 7, block: 0, effects: { thorns: 2 }, rarity: 'uncommon',
    text: 'Deal 7 damage. Gain 2 Thorns.',
    flavour: 'A thousand tiny stings, one large point.',
  },
  'thorn-crown': {
    id: 'thorn-crown', name: 'Crown of Thorns', suit: 'thorn', cost: 4,
    attack: 16, block: 10, effects: { thorns: 2 }, rarity: 'rare',
    text: 'Deal 16 damage. Gain 10 Block. Gain 2 Thorns.',
    flavour: 'It fits whoever bleeds for it. It fits everyone, eventually.',
  },
  'thorn-regrow': {
    id: 'thorn-regrow', name: 'Regrowth', suit: 'thorn', cost: 1,
    attack: 0, block: 5, effects: { heal: 5 }, rarity: 'uncommon',
    text: 'Gain 5 Block. Heal 5 HP.',
    flavour: 'Cut it down and it comes back greener, and crosser.',
  },

  // ------------------------------------------------------------------- GALE 🌪️
  // Mechanic: tempo. Gale cards are cheap, draw more cards, refund Ember,
  // and keep the turn going long after other suits have run dry.
  'gale-cut': {
    id: 'gale-cut', name: 'Gale Cut', suit: 'gale', cost: 1,
    attack: 5, block: 0, effects: { draw: 0 }, rarity: 'common',
    text: 'Deal 5 damage.',
    flavour: 'The wind does not ask. It arrives sideways.',
  },
  'gale-dash': {
    id: 'gale-dash', name: 'Wind Dash', suit: 'gale', cost: 0,
    attack: 3, block: 0, effects: { draw: 1 }, rarity: 'common',
    text: 'Deal 3 damage. Draw 1 card.',
    flavour: 'Be somewhere else before the blow lands.',
  },
  'gale-gust': {
    id: 'gale-gust', name: 'Sharp Gust', suit: 'gale', cost: 1,
    attack: 4, block: 0, effects: { gainEmber: 1 }, rarity: 'common',
    text: 'Deal 4 damage. Gain 1 Ember.',
    flavour: 'The storm pays for its own passage.',
  },
  'gale-feather': {
    id: 'gale-feather', name: 'Feather Step', suit: 'gale', cost: 0,
    attack: 0, block: 5, effects: { draw: 1 }, rarity: 'common',
    text: 'Gain 5 Block. Draw 1 card.',
    flavour: 'Light feet, lighter worries.',
  },
  'gale-squall': {
    id: 'gale-squall', name: 'Squall Line', suit: 'gale', cost: 2,
    attack: 8, block: 0, effects: { draw: 1 }, rarity: 'common',
    text: 'Deal 8 damage. Draw 1 card.',
    flavour: 'Rain sideways, wind backwards, rival down.',
  },
  'gale-cyclone': {
    id: 'gale-cyclone', name: 'Cyclone', suit: 'gale', cost: 2,
    attack: 7, block: 0, effects: { weaken: 1, gainEmber: 1 }, rarity: 'uncommon',
    text: 'Deal 7 damage. Apply 1 Weaken. Gain 1 Ember.',
    flavour: 'It spins, it takes, it leaves — in that order.',
  },
  'gale-tailwind': {
    id: 'gale-tailwind', name: 'Tailwind', suit: 'gale', cost: 1,
    attack: 0, block: 0, effects: { gainEmber: 2, draw: 1 }, rarity: 'uncommon',
    text: 'Gain 2 Ember. Draw 1 card.',
    flavour: 'Sail with the wind and the wind does the work.',
  },
  'gale-stormeye': {
    id: 'gale-stormeye', name: 'Eye of the Storm', suit: 'gale', cost: 1,
    attack: 0, block: 10, effects: { draw: 1 }, rarity: 'uncommon',
    text: 'Gain 10 Block. Draw 1 card.',
    flavour: 'In the middle of everything, one quiet circle.',
  },
  'gale-tempest': {
    id: 'gale-tempest', name: 'Tempest', suit: 'gale', cost: 3,
    attack: 13, block: 0, effects: { draw: 2 }, rarity: 'rare',
    text: 'Deal 13 damage. Draw 2 cards.',
    flavour: 'The sky files its complaint in lightning.',
  },
  'gale-hurricane': {
    id: 'gale-hurricane', name: 'Hurricane', suit: 'gale', cost: 4,
    attack: 17, block: 0, effects: { gainEmber: 2, draw: 1 }, rarity: 'rare',
    text: 'Deal 17 damage. Gain 2 Ember. Draw 1 card.',
    flavour: 'Named storms are the polite ones. This one is not named.',
  },
  'gale-zephyr': {
    id: 'gale-zephyr', name: 'Zephyr Kiss', suit: 'gale', cost: 0,
    attack: 2, block: 0, effects: { heal: 3 }, rarity: 'common',
    text: 'Deal 2 damage. Heal 3 HP.',
    flavour: 'A soft wind, a softer landing.',
  },
  'gale-shear': {
    id: 'gale-shear', name: 'Wind Shear', suit: 'gale', cost: 2,
    attack: 10, block: 0, effects: { burn: 0, weaken: 1 }, rarity: 'uncommon',
    text: 'Deal 10 damage. Apply 1 Weaken.',
    flavour: 'Two winds, opposite directions, one rival in the middle.',
  },
  'gale-soar': {
    id: 'gale-soar', name: 'Soar', suit: 'gale', cost: 1,
    attack: 6, block: 4, effects: {}, rarity: 'common',
    text: 'Deal 6 damage. Gain 4 Block.',
    flavour: 'Up is a direction. Use it.',
  },
  'gale-monsoon': {
    id: 'gale-monsoon', name: 'Monsoon', suit: 'gale', cost: 3,
    attack: 9, block: 6, effects: { draw: 1, heal: 3 }, rarity: 'rare',
    text: 'Deal 9 damage. Gain 6 Block. Draw 1 card. Heal 3 HP.',
    flavour: 'The season arrives, and the court rearranges itself around it.',
  },
  'gale-skyfall': {
    id: 'gale-skyfall', name: 'Skyfall', suit: 'gale', cost: 5,
    attack: 22, block: 0, effects: { draw: 2, gainEmber: 1 }, rarity: 'rare',
    text: 'Deal 22 damage. Draw 2 cards. Gain 1 Ember.',
    flavour: 'When the sky falls, it falls on the rival first.',
  },

  // ------------------------------------------------- EMBER, second wave 🔥
  // Draft-only Ember cards: the finishers and tricks you find between acts.
  'ember-cinderstep': {
    id: 'ember-cinderstep', name: 'Cinderstep', suit: 'ember', cost: 1,
    attack: 4, block: 0, effects: { burn: 1, draw: 1 }, rarity: 'uncommon',
    text: 'Deal 4 damage. Apply 1 Burn. Draw 1 card.',
    flavour: 'Every step leaves a little fire behind.',
  },
  'ember-magma': {
    id: 'ember-magma', name: 'Magma Vein', suit: 'ember', cost: 2,
    attack: 0, block: 0, effects: { burn: 6 }, rarity: 'uncommon',
    text: 'Apply 6 Burn.',
    flavour: 'The floor is lava. The floor has always been lava.',
  },
  'ember-flare': {
    id: 'ember-flare', name: 'Flare Up', suit: 'ember', cost: 0,
    attack: 5, block: 0, effects: { burn: 1 }, rarity: 'common',
    text: 'Deal 5 damage. Apply 1 Burn.',
    flavour: 'Small, bright, and exactly on time.',
  },
  'ember-ashen': {
    id: 'ember-ashen', name: 'Ashen Verdict', suit: 'ember', cost: 3,
    attack: 11, block: 0, effects: { weaken: 1, burn: 2 }, rarity: 'rare',
    text: 'Deal 11 damage. Apply 1 Weaken. Apply 2 Burn.',
    flavour: 'The court has deliberated. The court finds you flammable.',
  },
  'ember-hellkite': {
    id: 'ember-hellkite', name: 'Hellkite Dive', suit: 'ember', cost: 4,
    attack: 19, block: 0, effects: { burn: 4 }, rarity: 'rare',
    text: 'Deal 19 damage. Apply 4 Burn.',
    flavour: 'Something large, winged, and in a hurry passes overhead.',
  },

  // --------------------------------------------------- TIDE, second wave 💧
  'tide-rain': {
    id: 'tide-rain', name: 'Gentle Rain', suit: 'tide', cost: 1,
    attack: 0, block: 0, effects: { heal: 4, draw: 1 }, rarity: 'common',
    text: 'Heal 4 HP. Draw 1 card.',
    flavour: 'The kind of rain that fixes things.',
  },
  'tide-abyss': {
    id: 'tide-abyss', name: 'Abyssal Pull', suit: 'tide', cost: 2,
    attack: 7, block: 0, effects: { weaken: 1, draw: 1 }, rarity: 'uncommon',
    text: 'Deal 7 damage. Apply 1 Weaken. Draw 1 card.',
    flavour: 'The deep does not hurry. It does not need to.',
  },
  'tide-corral': {
    id: 'tide-corral', name: 'Coral Bastion', suit: 'tide', cost: 2,
    attack: 0, block: 12, effects: { heal: 3 }, rarity: 'uncommon',
    text: 'Gain 12 Block. Heal 3 HP.',
    flavour: 'Built by small hands, over a very long time.',
  },
  'tide-leviathan': {
    id: 'tide-leviathan', name: 'Leviathan Wake', suit: 'tide', cost: 4,
    attack: 16, block: 8, effects: { weaken: 1 }, rarity: 'rare',
    text: 'Deal 16 damage. Gain 8 Block. Apply 1 Weaken.',
    flavour: 'You do not fight the leviathan. You survive its passing.',
  },
  'tide-salt': {
    id: 'tide-salt', name: 'Salt in the Wound', suit: 'tide', cost: 1,
    attack: 6, block: 0, effects: { extraDamageIfBurning: 5 }, rarity: 'uncommon',
    text: 'Deal 6 damage. If the rival is Burning, deal 5 more.',
    flavour: 'The sea is not cruel. It is thorough.',
  },

  // -------------------------------------------------- THORN, second wave 🌿
  'thorn-vinewhip': {
    id: 'thorn-vinewhip', name: 'Vinewhip', suit: 'thorn', cost: 1,
    attack: 6, block: 2, effects: {}, rarity: 'common',
    text: 'Deal 6 damage. Gain 2 Block.',
    flavour: 'Green, fast, and deeply personal.',
  },
  'thorn-grove': {
    id: 'thorn-grove', name: 'Grove Shield', suit: 'thorn', cost: 2,
    attack: 0, block: 10, effects: { thorns: 2 }, rarity: 'uncommon',
    text: 'Gain 10 Block. Gain 2 Thorns.',
    flavour: 'The grove defends itself. You just live in it.',
  },
  'thorn-pollen': {
    id: 'thorn-pollen', name: 'Sleep Pollen', suit: 'thorn', cost: 1,
    attack: 0, block: 4, effects: { weaken: 2 }, rarity: 'uncommon',
    text: 'Gain 4 Block. Apply 2 Weaken.',
    flavour: 'One breath, and the rival forgets why it was angry.',
  },
  'thorn-worldtree': {
    id: 'thorn-worldtree', name: 'Worldtree Root', suit: 'thorn', cost: 4,
    attack: 14, block: 14, effects: { heal: 4 }, rarity: 'rare',
    text: 'Deal 14 damage. Gain 14 Block. Heal 4 HP.',
    flavour: 'The oldest root in the court, and it is on your side.',
  },
  'thorn-briarstorm': {
    id: 'thorn-briarstorm', name: 'Briarstorm', suit: 'thorn', cost: 3,
    attack: 9, block: 0, effects: { thorns: 3, weaken: 1 }, rarity: 'rare',
    text: 'Deal 9 damage. Gain 3 Thorns. Apply 1 Weaken.',
    flavour: 'A storm made of teeth, arriving sideways.',
  },

  // --------------------------------------------------- GALE, second wave 🌪️
  'gale-featherfall': {
    id: 'gale-featherfall', name: 'Featherfall', suit: 'gale', cost: 0,
    attack: 0, block: 7, effects: { gainEmber: 1 }, rarity: 'common',
    text: 'Gain 7 Block. Gain 1 Ember.',
    flavour: 'Down is also a direction. A slow one.',
  },
  'gale-crosswind': {
    id: 'gale-crosswind', name: 'Crosswind', suit: 'gale', cost: 1,
    attack: 5, block: 0, effects: { draw: 1, weaken: 1 }, rarity: 'uncommon',
    text: 'Deal 5 damage. Draw 1 card. Apply 1 Weaken.',
    flavour: 'Two winds meet, and the rival is the meeting point.',
  },
  'gale-skyhook': {
    id: 'gale-skyhook', name: 'Skyhook', suit: 'gale', cost: 2,
    attack: 8, block: 6, effects: { draw: 1 }, rarity: 'uncommon',
    text: 'Deal 8 damage. Gain 6 Block. Draw 1 card.',
    flavour: 'Up, over, and down on the other side.',
  },
  'gale-thunderhead': {
    id: 'gale-thunderhead', name: 'Thunderhead', suit: 'gale', cost: 3,
    attack: 15, block: 0, effects: { gainEmber: 2 }, rarity: 'rare',
    text: 'Deal 15 damage. Gain 2 Ember.',
    flavour: 'The cloud does not ask permission. It announces.',
  },
  'gale-jetstream': {
    id: 'gale-jetstream', name: 'Jetstream', suit: 'gale', cost: 2,
    attack: 0, block: 0, effects: { draw: 3, gainEmber: 1 }, rarity: 'rare',
    text: 'Draw 3 cards. Gain 1 Ember.',
    flavour: 'Ride it right and the whole table comes to you.',
  },
};

// ---------------------------------------------------------------------------
// Lookups and helpers. Everything below is derived from CARDS above.
// ---------------------------------------------------------------------------

/** All card ids, in database order (grouped by suit). */
export const ALL_CARD_IDS = Object.keys(CARDS);

/** Cards of one suit, in database order. */
export function cardsOfSuit(suit) {
  return ALL_CARD_IDS.map((id) => CARDS[id]).filter((c) => c.suit === suit);
}

/** Cards of one rarity. */
export function cardsOfRarity(rarity) {
  return ALL_CARD_IDS.map((id) => CARDS[id]).filter((c) => c.rarity === rarity);
}

/** Look a card up by id. Returns undefined for unknown ids (callers guard). */
export function getCard(id) { return CARDS[id]; }

/** The suit metadata for a card id (colour, glyph, combo). */
export function suitOf(card) { return SUITS[card.suit]; }

/** Human-readable one-line summary of a card's numbers, for logs and AI. */
export function cardSummary(card) {
  const parts = [];
  if (card.attack) parts.push(card.attack + ' ATK');
  if (card.block) parts.push(card.block + ' BLK');
  const e = card.effects || {};
  if (e.burn) parts.push(e.burn + ' Burn');
  if (e.weaken) parts.push(e.weaken + ' Weaken');
  if (e.strength) parts.push(e.strength + ' Str');
  if (e.thorns) parts.push(e.thorns + ' Thorns');
  if (e.heal) parts.push('Heal ' + e.heal);
  if (e.draw) parts.push('Draw ' + e.draw);
  if (e.gainEmber) parts.push('+' + e.gainEmber + ' Ember');
  return parts.join(' · ') || '—';
}

/** Validate the database at load time in development: every card must have
 *  a known suit, a non-negative cost, and at least one number or effect. */
export function validateCardDatabase() {
  const problems = [];
  for (const id of ALL_CARD_IDS) {
    const c = CARDS[id];
    if (c.id !== id) problems.push(id + ': id mismatch');
    if (!SUITS[c.suit]) problems.push(id + ': unknown suit ' + c.suit);
    if (c.cost < 0 || c.cost > 5) problems.push(id + ': cost out of range');
    if (!c.attack && !c.block && Object.keys(c.effects || {}).length === 0) {
      problems.push(id + ': card does nothing');
    }
    if (!c.text || !c.flavour) problems.push(id + ': missing text/flavour');
  }
  return problems;
}
