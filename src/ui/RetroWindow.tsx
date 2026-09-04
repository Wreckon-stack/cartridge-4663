import type { ReactNode } from 'react'
import styles from './RetroWindow.module.css'

export type WindowTone = 'default' | 'alert' | 'money' | 'cart' | 'void'

export interface RetroWindowProps {
  title: string
  children: ReactNode
  tone?: WindowTone
  /** Called when the titlebar X is pressed. Omit for a window with no close. */
  onClose?: () => void
  /** Accessible name for the close button; defaults to `Close ${title}`. */
  closeLabel?: string
  /** Remove body padding — for windows whose content manages its own edges. */
  flush?: boolean
  /** Cells rendered in the bottom status strip. */
  status?: readonly string[]
  className?: string
  id?: string
  /** Render as a different element, e.g. 'section' for landmark semantics. */
  as?: 'div' | 'section' | 'article' | 'aside'
}

/**
 * The workhorse container for the whole site.
 *
 * The decorative minimise/maximise squares are `<span aria-hidden>` rather
 * than disabled buttons, so a screen reader user is not offered three controls
 * where only one does anything.
 */
export function RetroWindow({
  title,
  children,
  tone = 'default',
  onClose,
  closeLabel,
  flush = false,
  status,
  className,
  id,
  as: Element = 'div',
}: RetroWindowProps) {
  return (
    <Element
      id={id}
      className={[styles.window, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-flush={flush ? 'true' : 'false'}
    >
      <div className={styles.titlebar}>
        <PixelDisk />
        <span className={styles.title}>{title}</span>
        <span className={styles.chromeGroup}>
          <span className={styles.chromeBtn} aria-hidden="true">
            _
          </span>
          <span className={styles.chromeBtn} aria-hidden="true">
            □
          </span>
          {onClose ? (
            <button type="button" className={styles.chromeBtn} onClick={onClose}>
              <span aria-hidden="true">✕</span>
              <span className="visually-hidden">{closeLabel ?? `Close ${title}`}</span>
            </button>
          ) : (
            <span className={styles.chromeBtn} aria-hidden="true">
              ✕
            </span>
          )}
        </span>
      </div>

      <div className={styles.body}>{children}</div>

      {status && status.length > 0 ? (
        <div className={styles.statusbar}>
          {status.map((cell, index) => (
            <span key={`${cell}-${index}`} className={styles.statusbarCell}>
              {cell}
            </span>
          ))}
        </div>
      ) : null}
    </Element>
  )
}

/** Tiny original 8x8 "floppy" mark. Inline so it costs no request. */
function PixelDisk() {
  return (
    <svg className={styles.titleIcon} viewBox="0 0 8 8" aria-hidden="true" focusable="false">
      <rect width="8" height="8" fill="#0b0b14" />
      <rect x="1" y="1" width="6" height="6" fill="#cfcfc4" />
      <rect x="2" y="1" width="4" height="3" fill="#1b1b2e" />
      <rect x="3" y="1" width="1" height="2" fill="#cfcfc4" />
      <rect x="2" y="5" width="4" height="2" fill="#6e6e66" />
    </svg>
  )
}
