import type { ReactNode } from 'react'
import styles from './NeonFrame.module.css'

export type FramePair = 'cyan-magenta' | 'acid-blue' | 'coin-cart' | 'danger-coin' | 'cart-cyan' | 'quiet'

export interface NeonFrameProps {
  children: ReactNode
  pair?: FramePair
  /** Add internal padding. */
  inset?: boolean
  /** Show the four corner rivets. */
  rivets?: boolean
  className?: string
}

/**
 * Decorative frame. Purely presentational, so it renders no semantics at all —
 * whatever it wraps keeps its own role and heading structure.
 *
 * Use `pair="quiet"` around anything containing market data: the clashing
 * double-ring is too noisy next to numbers people are meant to read.
 */
export function NeonFrame({ children, pair = 'cyan-magenta', inset, rivets, className }: NeonFrameProps) {
  return (
    <div
      className={[styles.frame, className].filter(Boolean).join(' ')}
      data-pair={pair}
      data-inset={inset ? 'true' : 'false'}
    >
      {rivets
        ? (['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
            <span key={corner} className={styles.rivet} data-corner={corner} aria-hidden="true" />
          ))
        : null}
      {children}
    </div>
  )
}
