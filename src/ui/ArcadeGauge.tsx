import styles from './ArcadeGauge.module.css'

export interface ArcadeGaugeProps {
  label: string
  /** Progress in basis points, 0..10000. Null renders an explicitly unknown meter. */
  bps: number | null
  /** Text at the left of the footer, e.g. "0 GME". */
  floor?: string
  /** Text at the right of the footer, e.g. "369 GME". */
  ceiling?: string
  segments?: number
  className?: string
}

/**
 * Segmented meter used for bonding-curve graduation progress.
 *
 * Exposed to assistive tech as a real `progressbar` with min/max/now, and the
 * numeric readout is always rendered visibly too — the bar is never the only
 * way to read the value. A null `bps` produces `aria-valuetext="unknown"`
 * rather than a silent zero.
 */
export function ArcadeGauge({ label, bps, floor, ceiling, segments = 24, className }: ArcadeGaugeProps) {
  const known = bps != null && Number.isFinite(bps)
  const clamped = known ? Math.min(Math.max(bps, 0), 10_000) : 0
  const filled = known ? Math.round((clamped / 10_000) * segments) : 0
  const percent = known ? clamped / 100 : null

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.readout}>{percent == null ? 'UNKNOWN' : `${percent.toFixed(1)}%`}</span>
      </div>

      <div
        className={styles.track}
        data-unknown={known ? 'false' : 'true'}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        {...(percent == null
          ? { 'aria-valuetext': 'Unknown — no data available' }
          : { 'aria-valuenow': Number(percent.toFixed(1)) })}
      >
        {Array.from({ length: segments }, (_, index) => {
          const on = index < filled
          const position = index / segments
          const zone = position > 0.75 ? 'high' : position > 0.45 ? 'mid' : 'low'
          return (
            <span
              key={index}
              className={styles.seg}
              data-on={on ? 'true' : 'false'}
              data-zone={zone}
              data-lead={on && index === filled - 1 ? 'true' : 'false'}
            />
          )
        })}
      </div>

      {floor || ceiling ? (
        <div className={styles.foot}>
          <span>{floor ?? ''}</span>
          <span>{ceiling ?? ''}</span>
        </div>
      ) : null}
    </div>
  )
}
