import { createContext } from 'react'
import type { SoundName } from '@/audio/audio-engine'
import type { FxLevel } from '@/lib/prefs'

export interface PrefsValue {
  soundOn: boolean
  /** Returns the resulting state; may be false if the browser refused audio. */
  toggleSound: () => Promise<boolean>
  fx: FxLevel
  toggleFx: () => void
  /** No-op when sound is off. Safe to call from anywhere. */
  play: (name: SoundName) => void
  /** True once the visitor has passed the boot dialog. */
  booted: boolean
  setBooted: (value: boolean) => void
}

/**
 * Kept in its own module so PrefsProvider.tsx exports only components — which
 * is what React Fast Refresh needs in order to hot-reload the provider.
 */
export const PrefsContext = createContext<PrefsValue | null>(null)
