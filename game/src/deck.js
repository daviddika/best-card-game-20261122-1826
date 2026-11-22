// ============================================================================
// Ember Court — deck.js
// ONE JOB: the deck, the hand, the discard pile and the draw pile. A Deck
// is a plain object { drawPile, hand, discard } holding card ids; every
// operation (shuffle, draw, discard, reshuffle) lives here so battle.js
// never manipulates piles by hand and the counts in the top bar stay true.
// ============================================================================

import { getCard } from './cards.js';
import { SeededRandom } from './random.js';

/** Build a fresh deck from a list of card ids. The draw pile is shuffled. */
export function createDeck(cardIds, rng) {
  const deck = { drawPile: cardIds.slice(), hand: [], discard: [] };
  shuffleDrawPile(deck, rng);
  return deck;
}

/** Shuffle only the draw pile, in place. */
export function shuffleDrawPile(deck, rng) {
  const r = rng || new SeededRandom(Date.now() % 2147483647);
  r.shuffle(deck.drawPile);
  return deck;
}

/** Move the whole discard pile back into the draw pile and shuffle it.
 *  Called automatically when a draw would empty the pile. */
export function reshuffleDiscardIntoDraw(deck, rng) {
  if (!deck.discard.length) return false;
  deck.drawPile = deck.discard.splice(0, deck.discard.length);
  shuffleDrawPile(deck, rng);
  return true;
}

/**
 * Draw `count` cards into the hand. Reshuffles the discard when the draw
 * pile runs out. Returns the ids actually drawn (fewer when the deck is
 * truly empty). Hands cap at `maxHand` — overflow cards go to discard.
 */
export function drawCards(deck, count, rng, maxHand) {
  const drawn = [];
  const cap = maxHand || 10;
  for (let i = 0; i < count; i++) {
    if (!deck.drawPile.length) {
      if (!reshuffleDiscardIntoDraw(deck, rng)) break;
    }
    const id = deck.drawPile.pop();
    if (deck.hand.length >= cap) {
      deck.discard.push(id); // hand full: the card is lost to discard
    } else {
      deck.hand.push(id);
      drawn.push(id);
    }
  }
  return drawn;
}

/** Discard a card from the hand by its hand index. Returns the id or null. */
export function discardFromHand(deck, handIndex) {
  if (handIndex < 0 || handIndex >= deck.hand.length) return null;
  const [id] = deck.hand.splice(handIndex, 1);
  deck.discard.push(id);
  return id;
}

/** Discard a specific card id from the hand (first occurrence). */
export function discardCardId(deck, cardId) {
  const idx = deck.hand.indexOf(cardId);
  if (idx === -1) return false;
  discardFromHand(deck, idx);
  return true;
}

/** Discard the whole hand (end of turn). */
export function discardHand(deck) {
  while (deck.hand.length) deck.discard.push(deck.hand.pop());
}

/** Remove a card id from anywhere in the deck (used by exile-style effects). */
export function removeCardEverywhere(deck, cardId) {
  let removed = 0;
  for (const pile of ['drawPile', 'hand', 'discard']) {
    let i = deck[pile].indexOf(cardId);
    while (i !== -1) { deck[pile].splice(i, 1); removed++; i = deck[pile].indexOf(cardId); }
  }
  return removed;
}

/** Add a card id to the discard pile (drafted cards enter here, then shuffle
 *  in on the next reshuffle — the classic deck-builder rhythm). */
export function addCardToDeck(deck, cardId) {
  deck.discard.push(cardId);
  return deck;
}

/** Total cards across all three piles. */
export function deckTotal(deck) {
  return deck.drawPile.length + deck.hand.length + deck.discard.length;
}

/** Count cards of one suit across the whole deck (for run statistics). */
export function countSuitInDeck(deck, suit) {
  let n = 0;
  for (const pile of ['drawPile', 'hand', 'discard']) {
    for (const id of deck[pile]) {
      const c = getCard(id);
      if (c && c.suit === suit) n++;
    }
  }
  return n;
}

/** A readable breakdown of the deck by suit, for the run-stats screen. */
export function deckBreakdown(deck) {
  const out = { ember: 0, tide: 0, thorn: 0, gale: 0 };
  for (const pile of ['drawPile', 'hand', 'discard']) {
    for (const id of deck[pile]) {
      const c = getCard(id);
      if (c && out[c.suit] !== undefined) out[c.suit]++;
    }
  }
  return out;
}

/** Snapshot the deck for save/debug display: ids grouped by pile. */
export function deckSnapshot(deck) {
  return {
    draw: deck.drawPile.slice(),
    hand: deck.hand.slice(),
    discard: deck.discard.slice(),
    total: deckTotal(deck),
  };
}
