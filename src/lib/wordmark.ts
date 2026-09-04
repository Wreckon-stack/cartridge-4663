import type { CSSProperties } from 'react'

/**
 * Wordmark fitting.
 *
 * The hero and final-level wordmarks must never wrap — a dropped letter on a
 * second line is the single most obvious way for a logo to look broken. The CSS
 * caps the font size at `100cqw / (--wm-chars * 0.44)`, and this supplies the
 * character count.
 *
 * It is the LONGEST word that matters, not the total length: the name renders
 * as one word per line, so the widest single word decides how large the type
 * can be before it overflows the column.
 */
export function longestWordLength(name: string): number {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  return Math.max(...words.map((word) => word.length))
}

/** Split a brand name into its first word and the remainder. */
export function splitWordmark(name: string): { first: string; rest: string } {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return { first: words[0] ?? name, rest: words.slice(1).join(' ') }
}

/**
 * Inline style carrying the fit variable.
 *
 * Typed as CSSProperties because React's CSSProperties does not model custom
 * properties; the cast is confined to this one function rather than sprayed
 * across the components that use it.
 */
export function wordmarkStyle(name: string): CSSProperties {
  return { '--wm-chars': longestWordLength(name) } as CSSProperties
}
