import { useId, useState } from 'react'
import styles from './WarningMarquee.module.css'

export interface WarningMarqueeProps {
  /** Phrases cycled along the bar. */
  items: readonly string[]
  tone?: 'danger' | 'coin' | 'acid' | 'cyan' | 'cart' | 'blue'
  /** Show the pause control. On by default — required for WCAG 2.2.2. */
  pausable?: boolean
  className?: string
}

/**
 * Scrolling hazard strip.
 *
 * Accessibility notes:
 *  - The visible track is duplicated for a seamless loop, so the duplicate is
 *    `aria-hidden` and the accessible copy is a single static list.
 *  - Hover and focus-within pause it, plus an explicit pause button, because
 *    moving text that lasts more than five seconds needs a stop mechanism.
 *  - Under REDUCE FX the animation is off and the text simply sits still.
 */
export function WarningMarquee({ items, tone = 'danger', pausable = true, className }: WarningMarqueeProps) {
  const [paused, setPaused] = useState(false)
  const id = useId()

  if (items.length === 0) return null

  const run = (
    <span className={styles.run}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`}>
          {item}
          <span className={styles.sep} aria-hidden="true">
            {' '}
            ◆{' '}
          </span>
        </span>
      ))}
    </span>
  )

  return (
    <div
      className={[styles.bar, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-paused={paused ? 'true' : 'false'}
    >
      {/* One accessible copy of the text, read normally by assistive tech. */}
      <span className="visually-hidden" id={id}>
        {items.join('. ')}
      </span>

      <div className={styles.viewport} aria-hidden="true">
        {run}
        {run}
      </div>

      {pausable ? (
        <button
          type="button"
          className={styles.pause}
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
        >
          <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
          <span className="visually-hidden">
            {paused ? 'Resume scrolling banner' : 'Pause scrolling banner'}
          </span>
        </button>
      ) : null}
    </div>
  )
}
