import type { FeedStatus, Reading } from '@/lib/data-health'
import { statusDescription, statusLabel } from '@/lib/data-health'
import styles from './DataStatusBadge.module.css'

/** Glyph per state so meaning survives without colour. */
const GLYPH: Record<FeedStatus, string> = {
  LIVE: '●',
  STALE: '◐',
  ERROR: '✕',
  LOADING: '◌',
  NO_SIGNAL: '○',
}

export interface DataStatusBadgeProps {
  reading: Reading<unknown>
  size?: 'md' | 'lg'
  className?: string
}

/**
 * The single component allowed to say whether a number is trustworthy.
 * Its label comes from `data-health`, so a component cannot claim LIVE by
 * accident — it has to be handed a reading that genuinely is.
 */
export function DataStatusBadge({ reading, size = 'md', className }: DataStatusBadgeProps) {
  return (
    <span
      className={[styles.badge, className].filter(Boolean).join(' ')}
      data-status={reading.status}
      data-size={size}
      title={statusDescription(reading)}
    >
      <span className={styles.glyph} aria-hidden="true">
        {GLYPH[reading.status]}
      </span>
      <span aria-hidden="true">{statusLabel(reading.status)}</span>
      <span className="visually-hidden">Data status: {statusDescription(reading)}</span>
    </span>
  )
}
