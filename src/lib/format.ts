import { WAD, wadToNumber } from './units'

/**
 * Display formatting. Every function here takes an already-computed value and
 * returns a string — no arithmetic on economic quantities happens in this file.
 *
 * `null`/`undefined` always formats as the em-dash placeholder rather than "0",
 * so a missing number can never be mistaken for a real zero.
 */
export const NO_VALUE = '—'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const plain = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** Format a WAD fixed-point token price with adaptive precision. */
export function formatPriceWad(value: bigint | null | undefined, symbol?: string): string {
  if (value == null) return NO_VALUE
  const n = wadToNumber(value)
  if (!Number.isFinite(n)) return NO_VALUE
  let text: string
  if (n === 0) text = '0'
  else if (n < 0.000001) text = n.toExponential(2)
  else if (n < 1) text = n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  else if (n < 1000) text = n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  else text = plain.format(n)
  return symbol ? `${text} ${symbol}` : text
}

/** Format a WAD value in compact notation (1.2M) — for market cap, volume, liquidity. */
export function formatCompactWad(value: bigint | null | undefined, symbol?: string): string {
  if (value == null) return NO_VALUE
  const n = wadToNumber(value)
  if (!Number.isFinite(n)) return NO_VALUE
  const text = n < 1000 ? plain.format(n) : compact.format(n)
  return symbol ? `${text} ${symbol}` : text
}

/** Format a whole-number count. */
export function formatCount(value: number | bigint | null | undefined): string {
  if (value == null) return NO_VALUE
  const n = typeof value === 'bigint' ? Number(value) : value
  if (!Number.isFinite(n)) return NO_VALUE
  return integer.format(n)
}

/** Format a WAD percentage (1e18 == 1%) with an explicit sign. */
export function formatPercentWad(value: bigint | null | undefined): string {
  if (value == null) return NO_VALUE
  const n = wadToNumber(value)
  if (!Number.isFinite(n)) return NO_VALUE
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

/** Direction of a change, for colour + icon + screen-reader text. */
export function changeDirection(value: bigint | null | undefined): 'up' | 'down' | 'flat' | 'unknown' {
  if (value == null) return 'unknown'
  if (value > 0n) return 'up'
  if (value < 0n) return 'down'
  return 'flat'
}

/** Basis points (0..10000) as a percentage string. */
export function formatBps(bps: number | null | undefined): string {
  if (bps == null || !Number.isFinite(bps)) return NO_VALUE
  return `${(bps / 100).toFixed(1)}%`
}

/** Relative time, e.g. "12s ago". Returns NO_VALUE for missing timestamps. */
export function formatRelativeTime(timestampMs: number | null | undefined, nowMs = Date.now()): string {
  if (timestampMs == null || !Number.isFinite(timestampMs)) return NO_VALUE
  const deltaSeconds = Math.round((nowMs - timestampMs) / 1000)
  if (deltaSeconds < 0) return 'just now'
  if (deltaSeconds < 5) return 'just now'
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`
  const minutes = Math.floor(deltaSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Absolute UTC timestamp for the evidence board. */
export function formatUtc(timestampMs: number | null | undefined): string {
  if (timestampMs == null || !Number.isFinite(timestampMs)) return NO_VALUE
  return new Date(timestampMs)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, ' UTC')
}

/** Render a raw bigint with its decimals, for the "raw units" evidence rows. */
export function formatRawUnits(raw: bigint | null | undefined, decimals: number): string {
  if (raw == null) return NO_VALUE
  return `${raw.toString()} (${decimals} dp)`
}

/** Format an ERC-8056 multiplier for display, e.g. "1.000000 x". */
export function formatMultiplier(multiplierWad: bigint | null | undefined): string {
  if (multiplierWad == null) return NO_VALUE
  if (multiplierWad === WAD) return '1.000000 ×'
  return `${wadToNumber(multiplierWad).toFixed(6)} ×`
}
