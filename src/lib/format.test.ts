import { describe, expect, it } from 'vitest'
import {
  changeDirection,
  formatBps,
  formatCompactWad,
  formatCount,
  formatMultiplier,
  formatPercentWad,
  formatPriceWad,
  formatRelativeTime,
  formatUtc,
  NO_VALUE,
} from './format'
import { WAD } from './units'

describe('missing values', () => {
  it('every formatter renders a dash rather than a zero', () => {
    expect(formatPriceWad(null)).toBe(NO_VALUE)
    expect(formatCompactWad(null)).toBe(NO_VALUE)
    expect(formatCount(null)).toBe(NO_VALUE)
    expect(formatPercentWad(null)).toBe(NO_VALUE)
    expect(formatBps(null)).toBe(NO_VALUE)
    expect(formatRelativeTime(null)).toBe(NO_VALUE)
    expect(formatUtc(null)).toBe(NO_VALUE)
    expect(formatMultiplier(null)).toBe(NO_VALUE)
  })

  it('a real zero is still rendered as zero, not as missing', () => {
    expect(formatPriceWad(0n)).toBe('0')
    expect(formatCount(0)).toBe('0')
  })
})

describe('formatPriceWad', () => {
  it('shows small prices with enough precision to be useful', () => {
    expect(formatPriceWad(36_900000000000000n)).toBe('0.0369')
  })

  it('falls back to exponential for dust prices', () => {
    expect(formatPriceWad(1000n)).toContain('e-')
  })

  it('appends the quote symbol when given', () => {
    expect(formatPriceWad(WAD, 'GME')).toBe('1 GME')
  })
})

describe('formatCompactWad', () => {
  it('compacts large values', () => {
    expect(formatCompactWad(1_200_000n * WAD)).toBe('1.2M')
  })

  it('leaves small values plain', () => {
    expect(formatCompactWad(369n * WAD, 'GME')).toBe('369 GME')
  })
})

describe('formatPercentWad', () => {
  it('signs positive changes', () => {
    expect(formatPercentWad(12_340000000000000000n)).toBe('+12.34%')
  })

  it('signs negative changes', () => {
    expect(formatPercentWad(-5n * WAD)).toBe('-5.00%')
  })
})

describe('changeDirection', () => {
  it('distinguishes unknown from flat', () => {
    expect(changeDirection(null)).toBe('unknown')
    expect(changeDirection(0n)).toBe('flat')
    expect(changeDirection(1n)).toBe('up')
    expect(changeDirection(-1n)).toBe('down')
  })
})

describe('formatRelativeTime', () => {
  const now = Date.UTC(2026, 8, 4, 12, 0, 0)
  it('reads naturally at each scale', () => {
    expect(formatRelativeTime(now - 1000, now)).toBe('just now')
    expect(formatRelativeTime(now - 30_000, now)).toBe('30s ago')
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m ago')
    expect(formatRelativeTime(now - 3 * 3600_000, now)).toBe('3h ago')
    expect(formatRelativeTime(now - 2 * 86400_000, now)).toBe('2d ago')
  })

  it('does not show a negative age for clock skew', () => {
    expect(formatRelativeTime(now + 10_000, now)).toBe('just now')
  })
})

describe('formatUtc', () => {
  it('renders an unambiguous absolute timestamp', () => {
    expect(formatUtc(Date.UTC(2026, 8, 4, 12, 34, 56))).toBe('2026-09-04 12:34:56 UTC')
  })
})

describe('formatMultiplier', () => {
  it('renders an unadjusted multiplier as exactly 1', () => {
    expect(formatMultiplier(WAD)).toBe('1.000000 ×')
  })

  it('renders an adjusted multiplier', () => {
    expect(formatMultiplier(2n * WAD)).toBe('2.000000 ×')
  })
})

describe('formatBps', () => {
  it('converts basis points to a percentage', () => {
    expect(formatBps(5813)).toBe('58.1%')
    expect(formatBps(10_000)).toBe('100.0%')
  })
})
