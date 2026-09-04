import { useState } from 'react'
import { usePrefs } from './usePrefs'
import styles from './Toggles.module.css'

/**
 * Sound switch.
 *
 * Starts OFF on every visit without exception. `toggleSound` reports whether
 * the browser actually allowed playback; if it refused we say so instead of
 * showing an ON switch that makes no noise.
 */
export function SoundToggle({ className }: { className?: string | undefined }) {
  const { soundOn, toggleSound } = usePrefs()
  const [blocked, setBlocked] = useState(false)

  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      data-on={soundOn ? 'true' : 'false'}
      data-variant="sound"
      aria-pressed={soundOn}
      onClick={() => {
        void toggleSound().then((result) => setBlocked(!result && !soundOn))
      }}
    >
      <span className={styles.led} aria-hidden="true" />
      <span>SOUND</span>
      <span className={styles.state} aria-hidden="true">
        {soundOn ? 'ON' : 'OFF'}
      </span>
      <span className="visually-hidden">
        {soundOn ? 'Sound is on. Activate to mute.' : 'Sound is off. Activate to turn sound on.'}
      </span>
      {blocked ? (
        <span className={styles.blocked} role="status">
          BLOCKED BY BROWSER
        </span>
      ) : null}
    </button>
  )
}

/**
 * Motion switch.
 *
 * Reflects the resolved level, which already accounts for the OS
 * `prefers-reduced-motion` setting — so a visitor who has reduced motion at the
 * system level sees "FX: REDUCED" on arrival without touching anything.
 */
export function EffectsToggle({ className }: { className?: string | undefined }) {
  const { fx, toggleFx } = usePrefs()
  const reduced = fx === 'reduced'

  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      data-on={reduced ? 'false' : 'true'}
      data-variant="fx"
      aria-pressed={reduced}
      onClick={toggleFx}
    >
      <span className={styles.led} aria-hidden="true" />
      <span>FX</span>
      <span className={styles.state} aria-hidden="true">
        {reduced ? 'REDUCED' : 'FULL'}
      </span>
      <span className="visually-hidden">
        {reduced
          ? 'Visual effects are reduced. Activate to restore full motion.'
          : 'Visual effects are at full. Activate to reduce motion and flashing.'}
      </span>
    </button>
  )
}
