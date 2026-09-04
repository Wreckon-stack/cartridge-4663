import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { audioEngine, type SoundName } from '@/audio/audio-engine'
import { readFxPreference, writeFxPreference, writeSoundPreference } from '@/lib/prefs'
import type { FxLevel } from '@/lib/prefs'
import { PrefsContext, type PrefsValue } from './prefs-context'

export function PrefsProvider({ children }: { children: ReactNode }) {
  // Sound ALWAYS starts false regardless of what is stored. A stored
  // preference can never start playback — only a user gesture can.
  const [soundOn, setSoundOn] = useState(false)

  // Read from storage / matchMedia in a lazy initialiser rather than in an
  // effect, so the first paint already has the correct level and there is no
  // flash of full-motion for someone who asked for reduced motion.
  const [fx, setFx] = useState<FxLevel>(() => readFxPreference())

  const [booted, setBooted] = useState(false)

  // Drive the CSS switch from React so there is a single source of truth.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('fx-reduced', fx === 'reduced')
    root.classList.toggle('fx-full', fx === 'full')
  }, [fx])

  useEffect(() => () => audioEngine.dispose(), [])

  const toggleSound = useCallback(async () => {
    if (soundOn) {
      audioEngine.mute()
      setSoundOn(false)
      writeSoundPreference(false)
      return false
    }
    // unlock() runs inside the click handler's task, which is what the
    // autoplay policy actually requires.
    const ok = await audioEngine.unlock()
    setSoundOn(ok)
    writeSoundPreference(ok)
    if (ok) audioEngine.play('coin')
    return ok
  }, [soundOn])

  const toggleFx = useCallback(() => {
    setFx((current) => {
      const next: FxLevel = current === 'full' ? 'reduced' : 'full'
      writeFxPreference(next)
      return next
    })
  }, [])

  const play = useCallback(
    (name: SoundName) => {
      if (!soundOn) return
      audioEngine.play(name)
    },
    [soundOn],
  )

  const value = useMemo<PrefsValue>(
    () => ({ soundOn, toggleSound, fx, toggleFx, play, booted, setBooted }),
    [soundOn, toggleSound, fx, toggleFx, play, booted],
  )

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}
