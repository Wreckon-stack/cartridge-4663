/**
 * User preferences: sound and motion.
 *
 * Two hard rules encoded here:
 *   1. Sound is OFF until a real user gesture turns it on. There is no code
 *      path that enables audio from a stored preference alone — the stored
 *      value is only ever used to decide what the toggle *shows* on return.
 *   2. `prefers-reduced-motion: reduce` wins unless the user has explicitly
 *      overridden it in this site's own control during this browser session.
 */

const SOUND_KEY = 'c4663:sound'
const FX_KEY = 'c4663:fx'

export type FxLevel = 'full' | 'reduced'

/** localStorage access that never throws (private mode, blocked cookies, SSR). */
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* preference simply will not persist; the session still works */
  }
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * What the sound toggle should display on load.
 * NOTE: this is the *remembered intent*, not permission to play. Audio is only
 * ever started from an event handler — see `src/audio/audio-engine.ts`.
 */
export function readSoundPreference(): boolean {
  return readStorage(SOUND_KEY) === 'on'
}

export function writeSoundPreference(enabled: boolean): void {
  writeStorage(SOUND_KEY, enabled ? 'on' : 'off')
}

/**
 * Effects level. Resolution order:
 *   explicit stored choice  ->  OS reduced-motion  ->  full
 */
export function readFxPreference(): FxLevel {
  const stored = readStorage(FX_KEY)
  if (stored === 'full' || stored === 'reduced') return stored
  return prefersReducedMotion() ? 'reduced' : 'full'
}

export function writeFxPreference(level: FxLevel): void {
  writeStorage(FX_KEY, level)
}

/** True when the OS asks for reduced motion and the user has not overridden it. */
export function fxIsSystemDriven(): boolean {
  const stored = readStorage(FX_KEY)
  return stored !== 'full' && stored !== 'reduced' && prefersReducedMotion()
}
