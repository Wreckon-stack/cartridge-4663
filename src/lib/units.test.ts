import { describe, expect, it } from 'vitest'
import {
  divideFixed,
  divWad,
  marketCap,
  mulWad,
  percentChangeWad,
  pow10,
  priceOf,
  progressBps,
  rawAmount,
  scaleToWad,
  toDisplayShares,
  wadToNumber,
  WAD,
} from './units'

describe('pow10', () => {
  it('produces exact bigint powers', () => {
    expect(pow10(0)).toBe(1n)
    expect(pow10(18)).toBe(1_000000000000000000n)
  })

  it('refuses negative exponents rather than silently returning a fraction', () => {
    expect(() => pow10(-1)).toThrow(RangeError)
  })
})

describe('divideFixed', () => {
  it('keeps full precision at 18dp', () => {
    // 1 / 3 to 18dp, rounded half up
    expect(divideFixed(1n, 3n, 18)).toBe(333333333333333333n)
  })

  it('rounds half up', () => {
    expect(divideFixed(1n, 2n, 0)).toBe(1n)
    expect(divideFixed(3n, 2n, 0)).toBe(2n)
  })

  it('handles negative numerators symmetrically', () => {
    expect(divideFixed(-1n, 2n, 0)).toBe(-1n)
    expect(divideFixed(1n, -2n, 0)).toBe(-1n)
    expect(divideFixed(-1n, -2n, 0)).toBe(1n)
  })

  it('throws on division by zero rather than returning Infinity', () => {
    expect(() => divideFixed(1n, 0n)).toThrow(RangeError)
  })
})

describe('scaleToWad', () => {
  it('is a no-op for 18-decimal tokens', () => {
    expect(scaleToWad(rawAmount(123n, 18))).toBe(123n)
  })

  it('scales up a 6-decimal token (e.g. USDG)', () => {
    // 1 USDG = 1_000000 raw -> 1e18 in WAD
    expect(scaleToWad(rawAmount(1_000000n, 6))).toBe(WAD)
  })

  it('scales down a 24-decimal token', () => {
    expect(scaleToWad(rawAmount(1_000000000000000000000000n, 24))).toBe(WAD)
  })
})

describe('priceOf', () => {
  it('prices a token in its quote asset', () => {
    // 1000 tokens against 100 GME -> 0.1 GME each
    const price = priceOf(rawAmount(1000n * WAD, 18), rawAmount(100n * WAD, 18))
    expect(price).toBe(100_000000000000000n) // 0.1e18
  })

  it('handles a quote asset with different decimals', () => {
    // 1000 tokens (18dp) against 100 USDG (6dp) -> still 0.1
    const price = priceOf(rawAmount(1000n * WAD, 18), rawAmount(100_000000n, 6))
    expect(price).toBe(100_000000000000000n)
  })

  it('returns null instead of dividing by zero supply', () => {
    expect(priceOf(rawAmount(0n, 18), rawAmount(100n * WAD, 18))).toBeNull()
  })
})

describe('marketCap', () => {
  it('multiplies supply by price', () => {
    // 1,000,000 tokens at 0.0369 GME
    const cap = marketCap(rawAmount(1_000_000n * WAD, 18), 36_900000000000000n)
    expect(cap).toBe(36_900n * WAD)
  })

  it('is exact for very large supplies — no float drift', () => {
    // 1e15 tokens at exactly 1 GME must be exactly 1e15 GME.
    const supply = 1_000_000_000_000_000n * WAD
    expect(marketCap(rawAmount(supply, 18), WAD)).toBe(supply)
  })
})

describe('mulWad / divWad', () => {
  it('round-trips', () => {
    const value = 123_456789012345678n
    expect(divWad(mulWad(value, 2n * WAD), 2n * WAD)).toBe(value)
  })

  it('throws rather than returning Infinity', () => {
    expect(() => divWad(WAD, 0n)).toThrow(RangeError)
  })
})

describe('toDisplayShares (ERC-8056)', () => {
  it('is identity when the multiplier is 1.0', () => {
    expect(toDisplayShares(rawAmount(5n * WAD, 18), WAD)).toBe(5n * WAD)
  })

  it('applies a 2:1 split multiplier to the displayed amount', () => {
    expect(toDisplayShares(rawAmount(5n * WAD, 18), 2n * WAD)).toBe(10n * WAD)
  })

  it('does NOT leak into price or market cap', () => {
    // The multiplier is a display concern. Pricing the same raw reserves must
    // give the same answer regardless of any corporate action.
    const supply = rawAmount(1000n * WAD, 18)
    const quote = rawAmount(100n * WAD, 18)
    const price = priceOf(supply, quote)
    expect(marketCap(supply, price!)).toBe(100n * WAD)
  })
})

describe('progressBps', () => {
  it('reports basis points toward a target', () => {
    expect(progressBps(50n, 100n)).toBe(5000)
    expect(progressBps(369n, 369n)).toBe(10_000)
  })

  it('clamps past the target instead of exceeding 100%', () => {
    expect(progressBps(1000n, 100n)).toBe(10_000)
  })

  it('returns 0 for a zero or negative target rather than dividing by zero', () => {
    expect(progressBps(50n, 0n)).toBe(0)
    expect(progressBps(0n, 100n)).toBe(0)
  })

  it('matches the real 369 GME graduation threshold', () => {
    // 214.5 of 369 GME
    expect(progressBps(214_500000000000000000n, 369_000000000000000000n)).toBe(5813)
  })
})

describe('percentChangeWad', () => {
  it('computes a positive change', () => {
    expect(percentChangeWad(100n * WAD, 112n * WAD)).toBe(12n * WAD)
  })

  it('computes a negative change', () => {
    expect(percentChangeWad(100n * WAD, 90n * WAD)).toBe(-10n * WAD)
  })

  it('returns null when there is no baseline', () => {
    expect(percentChangeWad(0n, 100n)).toBeNull()
  })
})

describe('wadToNumber', () => {
  it('converts for display', () => {
    expect(wadToNumber(WAD)).toBe(1)
    expect(wadToNumber(36_900000000000000n)).toBeCloseTo(0.0369, 10)
  })
})
