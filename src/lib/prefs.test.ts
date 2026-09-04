import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fxIsSystemDriven,
  prefersReducedMotion,
  readFxPreference,
  readSoundPreference,
  writeFxPreference,
  writeSoundPreference,
} from './prefs'

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('reduce') ? matches : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    })),
  )
}

beforeEach(() => {
  window.localStorage.clear()
  mockReducedMotion(false)
})

describe('sound preference', () => {
  it('defaults to off when nothing is stored', () => {
    expect(readSoundPreference()).toBe(false)
  })

  it('round-trips', () => {
    writeSoundPreference(true)
    expect(readSoundPreference()).toBe(true)
    writeSoundPreference(false)
    expect(readSoundPreference()).toBe(false)
  })

  it('treats any unexpected stored value as off', () => {
    window.localStorage.setItem('c4663:sound', 'maybe')
    expect(readSoundPreference()).toBe(false)
  })

  it('survives localStorage throwing (private mode / blocked cookies)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => readSoundPreference()).not.toThrow()
    expect(readSoundPreference()).toBe(false)
    spy.mockRestore()
  })

  it('does not throw when writing is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => writeSoundPreference(true)).not.toThrow()
    spy.mockRestore()
  })
})

describe('fx preference', () => {
  it('defaults to full when the OS has no preference', () => {
    expect(readFxPreference()).toBe('full')
  })

  it('defaults to reduced when the OS asks for reduced motion', () => {
    mockReducedMotion(true)
    expect(readFxPreference()).toBe('reduced')
  })

  it('lets an explicit choice override the OS preference', () => {
    mockReducedMotion(true)
    writeFxPreference('full')
    expect(readFxPreference()).toBe('full')
  })

  it('respects an explicit reduced choice even when the OS says nothing', () => {
    writeFxPreference('reduced')
    expect(readFxPreference()).toBe('reduced')
  })

  it('reports whether the current level came from the system', () => {
    mockReducedMotion(true)
    expect(fxIsSystemDriven()).toBe(true)
    writeFxPreference('full')
    expect(fxIsSystemDriven()).toBe(false)
  })
})

describe('prefersReducedMotion', () => {
  it('returns false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})
