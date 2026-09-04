/**
 * Data freshness and source health.
 *
 * The market arcade renders whatever this module reports. The important
 * property is that "stale" and "error" are first-class states carrying the last
 * known good value, so a dropped feed degrades to a labelled old number instead
 * of either vanishing or silently pretending to be current.
 */

export type FeedStatus =
  /** Fresh data from the configured source. */
  | 'LIVE'
  /** We have a value, but it is older than the staleness threshold. */
  | 'STALE'
  /** The fetch failed. `value` may still hold the last good reading. */
  | 'ERROR'
  /** First load in flight, nothing to show yet. */
  | 'LOADING'
  /** No source is configured. Not an error — the honest default. */
  | 'NO_SIGNAL'

/** How old a reading may be before it is labelled STALE. */
export const STALE_AFTER_MS = 60_000
/** Past this, we stop calling it merely stale. */
export const VERY_STALE_AFTER_MS = 10 * 60_000

export interface Reading<T> {
  readonly status: FeedStatus
  readonly value: T | null
  /** When `value` was fetched. Null when there has never been a value. */
  readonly fetchedAt: number | null
  /** Present when status is ERROR. Already sanitised for display. */
  readonly error?: string
}

export function noSignal<T>(): Reading<T> {
  return { status: 'NO_SIGNAL', value: null, fetchedAt: null }
}

export function loading<T>(previous?: Reading<T>): Reading<T> {
  if (previous?.value != null) return { ...previous, status: previous.status }
  return { status: 'LOADING', value: null, fetchedAt: null }
}

export function live<T>(value: T, fetchedAt = Date.now()): Reading<T> {
  return { status: 'LIVE', value, fetchedAt }
}

/**
 * Fold a failure into a reading, preserving the last good value.
 * The error string is truncated because provider errors sometimes embed an
 * entire request body, including a URL with a key in it.
 */
export function failed<T>(error: unknown, previous?: Reading<T>): Reading<T> {
  const message = sanitiseError(error)
  if (previous?.value != null) {
    return { status: 'ERROR', value: previous.value, fetchedAt: previous.fetchedAt, error: message }
  }
  return { status: 'ERROR', value: null, fetchedAt: null, error: message }
}

/** Re-evaluate a reading's status against the clock. */
export function withFreshness<T>(reading: Reading<T>, nowMs = Date.now()): Reading<T> {
  if (reading.status !== 'LIVE') return reading
  if (reading.fetchedAt == null) return reading
  const age = nowMs - reading.fetchedAt
  if (age >= STALE_AFTER_MS) return { ...reading, status: 'STALE' }
  return reading
}

export function isStale(reading: Reading<unknown>, nowMs = Date.now()): boolean {
  if (reading.fetchedAt == null) return false
  return nowMs - reading.fetchedAt >= STALE_AFTER_MS
}

export function isVeryStale(reading: Reading<unknown>, nowMs = Date.now()): boolean {
  if (reading.fetchedAt == null) return false
  return nowMs - reading.fetchedAt >= VERY_STALE_AFTER_MS
}

/**
 * Strip anything that looks like a credential out of an error before it can be
 * rendered or logged. Provider SDKs are careless about this.
 */
export function sanitiseError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown error while contacting the data source.'
  return raw
    .replace(/https?:\/\/[^\s"']+/g, '[url]')
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g, '[redacted]')
    .slice(0, 180)
}

/** Copy for the status badge. Deliberately in-world but never misleading. */
export function statusLabel(status: FeedStatus): string {
  switch (status) {
    case 'LIVE':
      return 'LIVE'
    case 'STALE':
      return 'STALE'
    case 'ERROR':
      return 'FEED LOST'
    case 'LOADING':
      return 'READING…'
    case 'NO_SIGNAL':
      return 'NO SIGNAL'
  }
}

export function statusDescription(reading: Reading<unknown>): string {
  switch (reading.status) {
    case 'LIVE':
      return 'Value read from the configured source and current.'
    case 'STALE':
      return 'The feed has not refreshed recently. Showing the last confirmed reading.'
    case 'ERROR':
      return reading.value != null
        ? `Market feed lost — retrying. Showing the last confirmed reading. (${reading.error ?? 'unknown error'})`
        : `Market feed lost — retrying. (${reading.error ?? 'unknown error'})`
    case 'LOADING':
      return 'Reading the market feed.'
    case 'NO_SIGNAL':
      return 'No market data source is configured, so there is no value to show.'
  }
}
