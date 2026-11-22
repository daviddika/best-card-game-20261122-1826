// ============================================================================
// Ember Court — random.js
// ONE JOB: deterministic, seedable randomness. The whole game draws its
// randomness from here, so a screenshot seed (?shot=...&seed=7) reproduces
// the same shuffle, the same draft and the same AI draw every time, and
// play-testing can replay an exact run by reusing its seed.
// ============================================================================

/** Mulberry32 — a small, fast, seedable PRNG with a good distribution. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A tiny wrapper around a PRNG function with the helpers the game needs. */
export class SeededRandom {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.next = mulberry32(this.seed);
  }

  /** Float in [0, 1). */
  float() { return this.next(); }

  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Pick one element of an array (uniform). */
  pick(array) {
    if (!array.length) return undefined;
    return array[Math.floor(this.next() * array.length)];
  }

  /** Pick `count` distinct elements (shuffled sample, no replacement). */
  sample(array, count) {
    const copy = array.slice();
    this.shuffle(copy);
    return copy.slice(0, Math.min(count, copy.length));
  }

  /** Weighted pick: entries are { value, weight }. */
  weighted(entries) {
    let total = 0;
    for (const e of entries) total += e.weight;
    let roll = this.next() * total;
    for (const e of entries) {
      roll -= e.weight;
      if (roll <= 0) return e.value;
    }
    return entries[entries.length - 1].value;
  }

  /** Fisher–Yates shuffle, in place, using this generator. */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = array[i]; array[i] = array[j]; array[j] = tmp;
    }
    return array;
  }

  /** Chance roll: true with probability p (0..1). */
  chance(p) { return this.next() < p; }
}

/** Parse a seed from the page URL (?seed=123). Falls back to a time-based
 *  seed so ordinary play is never the same run twice. */
export function seedFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('seed');
    if (raw !== null && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) return n >>> 0;
      // Hash a non-numeric seed string into a 32-bit integer.
      let h = 2166136261;
      for (let i = 0; i < raw.length; i++) {
        h ^= raw.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }
  } catch (e) { /* fall through to the time seed */ }
  return (Date.now() % 2147483647) >>> 0;
}

/** A process-wide default generator for casual (non-seeded) moments such as
 *  confetti drift — never used for gameplay decisions. */
export const casualRandom = new SeededRandom((Date.now() ^ 0x9e3779b9) >>> 0);
