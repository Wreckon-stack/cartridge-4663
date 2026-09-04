import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ROBINHOOD_CHAIN_ID } from '@/config/chain.config'
import { brand, marketDataSource } from '@/config/project.config'
import { PixelButton } from '@/ui/PixelButton'
import { RetroWindow } from '@/ui/RetroWindow'
import { WarningMarquee } from '@/ui/WarningMarquee'
import { usePrefs } from '@/ui/usePrefs'
import { audioEngine } from '@/audio/audio-engine'
import styles from './BootSequence.module.css'

interface PostCheck {
  readonly label: string
  readonly result: string
  readonly tone: 'ok' | 'warn' | 'bad'
}

/** The POST readout. Every line states something that is actually true. */
function buildChecks(): PostCheck[] {
  return [
    { label: 'CARTRIDGE', result: 'SEATED', tone: 'ok' },
    { label: 'GME LINK', result: 'ESTABLISHED', tone: 'ok' },
    { label: 'PLAYER ONE', result: 'PRESENT', tone: 'ok' },
    { label: 'NETWORK', result: `CHAIN ${ROBINHOOD_CHAIN_ID}`, tone: 'ok' },
    {
      label: 'MARKET FEED',
      result: marketDataSource === 'none' ? 'NO SIGNAL' : marketDataSource.toUpperCase(),
      tone: marketDataSource === 'none' ? 'warn' : 'ok',
    },
    { label: 'SAVE FILE', result: 'CORRUPTED', tone: 'warn' },
  ]
}

export interface BootSequenceProps {
  /** Called when the visitor chooses to proceed, with their sound choice. */
  onEnter: (options: { withSound: boolean }) => void
}

/**
 * The opening interaction.
 *
 * Escape hatches, all of which lead to the same fully accessible site:
 *   - START GAME (with sound)  - START (silent)  - STAY IN THE LOBBY
 *   - the window's X control   - the Escape key
 *
 * Nobody is ever trapped, and the choice is not remembered as "sound on" unless
 * the browser genuinely granted audio.
 */
export function BootSequence({ onEnter }: BootSequenceProps) {
  const checks = useMemo(() => buildChecks(), [])
  const { fx } = usePrefs()
  const reduced = fx === 'reduced'

  // Under REDUCE FX the sequence starts already finished, rather than being
  // fast-forwarded from an effect — someone who asked not to see animation
  // should not have to watch one get skipped.
  const [revealed, setRevealed] = useState(() => (reduced ? checks.length : 0))
  const [showDialog, setShowDialog] = useState(() => reduced)

  const dialogRef = useRef<HTMLDivElement>(null)
  const firstButtonRef = useRef<HTMLDivElement>(null)

  // Step the POST lines. Only runs in the full-motion case.
  useEffect(() => {
    if (reduced) return
    let index = 0
    const tick = window.setInterval(() => {
      index += 1
      setRevealed(index)
      if (audioEngine.enabled) audioEngine.play('boot')
      if (index >= checks.length) {
        window.clearInterval(tick)
        window.setTimeout(() => setShowDialog(true), 260)
      }
    }, 190)
    return () => window.clearInterval(tick)
  }, [checks.length, reduced])

  // Move focus into the dialog once it appears so keyboard users land on it.
  useEffect(() => {
    if (!showDialog) return
    const target = firstButtonRef.current?.querySelector<HTMLElement>('button, [href]')
    target?.focus()
  }, [showDialog])

  const enter = useCallback(
    (withSound: boolean) => {
      onEnter({ withSound })
    },
    [onEnter],
  )

  // Lock page scrolling while the curtain is up. Without this the page behind
  // scrolls under the dialog and its scrollbar shows through the overlay.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Escape always dismisses, at any point in the sequence.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        enter(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enter])

  // Focus trap: keep Tab inside the dialog while it is the only thing on screen.
  useEffect(() => {
    if (!showDialog) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showDialog])

  return (
    <div className={styles.curtain} data-testid="boot-sequence">
      <div className={styles.post} aria-hidden="true">
        <div className={styles.postLine}>
          <span className={styles.postLabel}>{brand.name} — SYSTEM CHECK</span>
        </div>
        {checks.slice(0, revealed).map((check) => (
          <div className={styles.postLine} key={check.label}>
            <span className={styles.postLabel}>{check.label}</span>
            <span className={styles.postDots}>......................................................</span>
            <span className={styles.postResult} data-tone={check.tone}>
              {check.result}
            </span>
          </div>
        ))}
        {revealed < checks.length ? <span className={styles.cursor}>&nbsp;</span> : null}
      </div>

      {/* The POST is decorative; this is the accessible version of it. */}
      <p className="visually-hidden">
        System check complete. {checks.map((c) => `${c.label}: ${c.result}.`).join(' ')}
      </p>

      {showDialog ? (
        <div
          className={styles.dialogWrap}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="boot-title"
          aria-describedby="boot-desc"
        >
          <RetroWindow
            title={`${brand.name.toUpperCase()} — UNLICENSED SOFTWARE`}
            tone="cart"
            onClose={() => enter(false)}
            closeLabel="Skip the intro and go straight to the site"
          >
            <h1 className={styles.headline} id="boot-title">
              A CARTRIDGE THAT BOOTS
              <br />A STOCK MARKET
            </h1>

            <p className={styles.question} id="boot-desc">
              INSERT COIN AND ENTER THE MARKET?
            </p>
            <p className={styles.subQuestion}>
              Sound is off until you ask for it. You can leave at any time — nothing here is load-bearing.
            </p>

            <div className={styles.actions} ref={firstButtonRef}>
              <PixelButton tone="coin" size="lg" sound="confirm" onClick={() => enter(true)}>
                START GAME
              </PixelButton>
              <PixelButton tone="cyan" size="lg" sound="confirm" onClick={() => enter(false)}>
                START (SILENT)
              </PixelButton>
              <PixelButton tone="slate" size="lg" sound="cancel" onClick={() => enter(false)}>
                STAY IN THE LOBBY
              </PixelButton>
              <span className={styles.actionNote}>All three go to the same site. Press Escape to skip.</span>
            </div>
          </RetroWindow>
        </div>
      ) : null}

      <div className={styles.bootTicker}>
        <WarningMarquee
          tone="cart"
          pausable={false}
          items={[
            'UNLICENSED SOFTWARE',
            'NOT ENDORSED BY ANY PUBLISHER',
            'NOT GAMESTOP STOCK',
            'PLAYER ONE, ARE YOU STILL THERE',
          ]}
        />
      </div>
    </div>
  )
}
