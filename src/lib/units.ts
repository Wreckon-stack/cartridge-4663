/**
 * Fixed-point maths for on-chain values.
 *
 * THE RULE: raw token balances are `bigint` and stay `bigint` through every
 * calculation. `number` appears only at the very last step, for display or for
 * a chart axis, and anything derived from a `number` is typed as such so it can
 * never be mistaken for an accounting value.
 *
 * Robinhood stock tokens are 18-decimal ERC-20s with an ERC-8056 `uiMultiplier()`
 * that scales *displayed shares* for splits and dividends. The multiplier is a
 * presentation concern: it is applied in `toDisplayShares`, never inside a price
 * or market-cap computation, because the pool trades raw units.
 */

/** A raw, unscaled on-chain integer amount together with its token decimals. */
export interface RawAmount {
  readonly raw: bigint
  readonly decimals: number
}

/** A price expressed as a ratio of two raw amounts, kept exact. */
export interface Ratio {
  readonly numerator: bigint
  readonly denominator: bigint
}

export const WAD = 1_000000000000000000n // 1e18

export function pow10(exponent: number): bigint {
  if (exponent < 0) throw new RangeError(`pow10 requires a non-negative exponent, got ${exponent}`)
  return 10n ** BigInt(exponent)
}

export function rawAmount(raw: bigint, decimals: number): RawAmount {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new RangeError(`Unsupported token decimals: ${decimals}`)
  }
  return { raw, decimals }
}

/**
 * Divide two bigints, keeping `precision` fractional digits, with round-half-up.
 * Returns a fixed-point bigint scaled by 10**precision.
 */
export function divideFixed(numerator: bigint, denominator: bigint, precision = 18): bigint {
  if (denominator === 0n) throw new RangeError('divideFixed: division by zero')
  const scale = pow10(precision)
  const negative = numerator < 0n !== denominator < 0n
  const n = numerator < 0n ? -numerator : numerator
  const d = denominator < 0n ? -denominator : denominator
  const scaled = n * scale
  const quotient = scaled / d
  const remainder = scaled % d
  // round half up on the absolute value, then reapply the sign
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient
  return negative ? -rounded : rounded
}

/**
 * Price of `base` denominated in `quote`, as a WAD-scaled bigint.
 * e.g. 2.5 GME per token -> 2_500000000000000000n
 */
export function priceOf(base: RawAmount, quote: RawAmount): bigint | null {
  if (base.raw === 0n) return null
  // Normalise both sides to WAD before dividing so differing decimals cancel.
  const baseWad = scaleToWad(base)
  const quoteWad = scaleToWad(quote)
  if (baseWad === 0n) return null
  return divideFixed(quoteWad, baseWad, 18)
}

/** Re-scale a raw amount from its own decimals to 18 decimals. */
export function scaleToWad({ raw, decimals }: RawAmount): bigint {
  if (decimals === 18) return raw
  if (decimals < 18) return raw * pow10(18 - decimals)
  return raw / pow10(decimals - 18)
}

/** Multiply two WAD-scaled fixed-point numbers. */
export function mulWad(a: bigint, b: bigint): bigint {
  return (a * b) / WAD
}

/** Divide two WAD-scaled fixed-point numbers. */
export function divWad(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new RangeError('divWad: division by zero')
  return (a * WAD) / b
}

/**
 * Market cap = circulating supply x price, all in WAD.
 * Supply is a raw amount; price is WAD-scaled quote-per-token.
 */
export function marketCap(supply: RawAmount, priceWad: bigint): bigint {
  return mulWad(scaleToWad(supply), priceWad)
}

/**
 * ERC-8056 scaled UI amount. `multiplier` is WAD-scaled (1e18 == 1.0).
 *
 * This is DISPLAY ONLY. Passing a multiplier-adjusted figure into `priceOf` or
 * `marketCap` would double-count the corporate action, so those functions
 * deliberately take raw amounts and there is no overload that accepts shares.
 */
export function toDisplayShares(amount: RawAmount, multiplierWad: bigint): bigint {
  return mulWad(scaleToWad(amount), multiplierWad)
}

/** Progress of `current` toward `target`, as basis points (0..10000), clamped. */
export function progressBps(current: bigint, target: bigint): number {
  if (target <= 0n) return 0
  if (current <= 0n) return 0
  const bps = (current * 10_000n) / target
  return Number(bps > 10_000n ? 10_000n : bps)
}

/**
 * Convert a WAD fixed-point value to a JS number.
 * Lossy by definition — the return type is `number` precisely so that reviewers
 * can see the boundary. Never feed the result back into an accounting path.
 */
export function wadToNumber(value: bigint): number {
  const whole = value / WAD
  const frac = value % WAD
  return Number(whole) + Number(frac) / 1e18
}

/** Percentage change from `previous` to `current`, in WAD (1e18 == 1%). */
export function percentChangeWad(previous: bigint, current: bigint): bigint | null {
  if (previous === 0n) return null
  return divideFixed((current - previous) * 100n, previous, 18)
}
