import { describe, expect, it, vi } from 'vitest'
import {
  failed,
  isStale,
  isVeryStale,
  live,
  loading,
  noSignal,
  sanitiseError,
  STALE_AFTER_MS,
  statusLabel,
  VERY_STALE_AFTER_MS,
  withFreshness,
} from './data-health'

describe('reading constructors', () => {
  it('noSignal has no value and no timestamp', () => {
    expect(noSignal()).toEqual({ status: 'NO_SIGNAL', value: null, fetchedAt: null })
  })

  it('live carries the value and its fetch time', () => {
    const r = live(42, 1000)
    expect(r).toEqual({ status: 'LIVE', value: 42, fetchedAt: 1000 })
  })

  it('loading preserves a previous value rather than blanking the UI', () => {
    const previous = live(42, 1000)
    expect(loading(previous).value).toBe(42)
  })

  it('loading with no history has nothing to show', () => {
    expect(loading<number>().value).toBeNull()
  })
})

describe('failed', () => {
  it('keeps the last good value so a dropped feed degrades instead of vanishing', () => {
    const previous = live(42, 1000)
    const result = failed(new Error('boom'), previous)
    expect(result.status).toBe('ERROR')
    expect(result.value).toBe(42)
    expect(result.fetchedAt).toBe(1000)
  })

  it('has no value when there never was one', () => {
    const result = failed(new Error('boom'))
    expect(result.value).toBeNull()
    expect(result.fetchedAt).toBeNull()
  })
})

describe('sanitiseError', () => {
  it('strips URLs, which often carry API keys', () => {
    const message = sanitiseError(new Error('failed to fetch https://rpc.example.com/v2/SECRETKEY123'))
    expect(message).not.toContain('rpc.example.com')
    expect(message).toContain('[url]')
  })

  it('redacts long opaque tokens', () => {
    const message = sanitiseError(new Error('bad key abcdefghijklmnopqrstuvwxyz012345'))
    expect(message).toContain('[redacted]')
    expect(message).not.toContain('abcdefghijklmnopqrstuvwxyz012345')
  })

  it('truncates very long messages', () => {
    expect(sanitiseError(new Error('x'.repeat(1000))).length).toBeLessThanOrEqual(180)
  })

  it('handles non-Error input', () => {
    expect(sanitiseError('plain string')).toBe('plain string')
    expect(sanitiseError(undefined)).toContain('Unknown error')
  })
})

describe('freshness', () => {
  it('marks a reading STALE once past the threshold', () => {
    const now = 1_000_000
    const fresh = live(1, now - 1000)
    const old = live(1, now - STALE_AFTER_MS - 1)
    expect(withFreshness(fresh, now).status).toBe('LIVE')
    expect(withFreshness(old, now).status).toBe('STALE')
  })

  it('does not upgrade an ERROR reading to STALE', () => {
    const errored = failed(new Error('x'), live(1, 0))
    expect(withFreshness(errored, 999_999).status).toBe('ERROR')
  })

  it('isStale / isVeryStale use their own thresholds', () => {
    const now = 1_000_000
    expect(isStale(live(1, now - STALE_AFTER_MS), now)).toBe(true)
    expect(isStale(live(1, now - 1), now)).toBe(false)
    expect(isVeryStale(live(1, now - VERY_STALE_AFTER_MS), now)).toBe(true)
    expect(isVeryStale(live(1, now - STALE_AFTER_MS), now)).toBe(false)
  })

  it('a reading that never resolved is not stale — it is simply absent', () => {
    expect(isStale(noSignal())).toBe(false)
  })
})

describe('statusLabel', () => {
  it('maps every status to in-world copy', () => {
    expect(statusLabel('LIVE')).toBe('LIVE')
    expect(statusLabel('STALE')).toBe('STALE')
    expect(statusLabel('ERROR')).toBe('FEED LOST')
    expect(statusLabel('LOADING')).toBe('READING…')
    expect(statusLabel('NO_SIGNAL')).toBe('NO SIGNAL')
  })
})

describe('withFreshness uses the real clock by default', () => {
  it('does not throw without an explicit now', () => {
    vi.useFakeTimers()
    expect(() => withFreshness(live(1))).not.toThrow()
    vi.useRealTimers()
  })
})
