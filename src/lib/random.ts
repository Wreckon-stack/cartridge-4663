/**
 * Deterministic pseudo-randomness.
 *
 * Decorative scatter (floating coins, glitch offsets, loading messages) must
 * look arbitrary but be identical on every render and every machine —
 * otherwise visual regression snapshots are useless and hydration would
 * disagree with itself. Nothing here uses Math.random.
 */

/** mulberry32 — small, fast, good enough for scatter. */
export function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable 32-bit hash of a string, for deriving a seed from an id. */
export function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Pick deterministically from a list using a string key. */
export function pickFrom<T>(items: readonly T[], key: string): T {
  if (items.length === 0) throw new RangeError('pickFrom: empty list')
  const index = hashString(key) % items.length
  return items[index] as T
}

/** `count` evenly-ish scattered values in [min, max), stable for a given seed. */
export function scatter(count: number, seed: number, min = 0, max = 1): number[] {
  const rng = makeRng(seed)
  return Array.from({ length: count }, () => min + rng() * (max - min))
}
