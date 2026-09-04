import type { ReactNode } from 'react'
import type { Reading } from '@/lib/data-health'
import { NO_VALUE, changeDirection, formatPercentWad } from '@/lib/format'
import { DataStatusBadge } from './DataStatusBadge'
import styles from './StatCartridge.module.css'

const ARROW = { up: '▲', down: '▼', flat: '▬', unknown: '?' } as const

export interface StatCartridgeProps {
  label: string
  /** The reading this tile displays. Drives every visual state. */
  reading: Reading<unknown>
  /** Already-formatted primary value. Ignored when the reading has no value. */
  value: string | null
  /** Secondary line, e.g. raw units or the denominating asset. */
  sub?: ReactNode
  /** 24h change in WAD percent, when the metric has one. */
  changeWad?: bigint | null
  spine?: 'cyan' | 'magenta' | 'acid' | 'coin' | 'cart'
  /** Hide the status badge when a group already shows one. */
  hideStatus?: boolean
  className?: string
}

/**
 * One metric in the market arcade.
 *
 * The contract that makes this honest: the tile renders `value` **only** when
 * `reading.value` is non-null. There is no default, no placeholder digit and no
 * animation that could run before real data arrives — a missing metric shows
 * NO SIGNAL and a dash.
 */
export function StatCartridge({
  label,
  reading,
  value,
  sub,
  changeWad,
  spine = 'cyan',
  hideStatus,
  className,
}: StatCartridgeProps) {
  const hasValue = reading.value != null && value != null
  const isLoading = reading.status === 'LOADING'
  const direction = changeDirection(changeWad)

  return (
    <div className={[styles.cart, className].filter(Boolean).join(' ')} data-spine={spine}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        {hideStatus ? null : <DataStatusBadge reading={reading} />}
      </div>

      {isLoading && !hasValue ? (
        <div className={styles.skeleton} role="status" aria-live="polite">
          READING…
        </div>
      ) : (
        <div className={styles.value} data-empty={hasValue ? 'false' : 'true'}>
          {hasValue ? value : NO_VALUE}
          {!hasValue ? <span className="visually-hidden"> — no value available</span> : null}
        </div>
      )}

      {changeWad !== undefined && hasValue ? (
        <span className={styles.delta} data-dir={direction}>
          <span aria-hidden="true">{ARROW[direction]}</span>
          {formatPercentWad(changeWad)}
          <span className="visually-hidden">
            {direction === 'up' ? ' up over 24 hours' : direction === 'down' ? ' down over 24 hours' : ''}
          </span>
        </span>
      ) : null}

      {sub ? <div className={styles.sub}>{sub}</div> : null}
    </div>
  )
}
