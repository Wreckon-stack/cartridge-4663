import { useCallback, useEffect, useRef, useState } from 'react'
import type { GalleryItem } from '@/config/content/gallery'
import { PixelButton } from './PixelButton'
import { usePrefs } from './usePrefs'
import styles from './MemeConveyor.module.css'

export interface MemeConveyorProps {
  items: readonly GalleryItem[]
  label: string
}

/**
 * The continuously-moving evidence reel.
 *
 * Accessibility, which is most of the work in this component:
 *  - the belt is duplicated for a seamless loop; the duplicate is `aria-hidden`
 *    and `tabIndex={-1}`, so screen readers and Tab order see each poster once;
 *  - it pauses on hover, on focus-within, and via an explicit control (WCAG
 *    2.2.2 — any motion lasting over five seconds needs a pause);
 *  - under REDUCE FX the animation stops entirely and the strip becomes an
 *    ordinary horizontally-scrollable region;
 *  - the lightbox traps focus, closes on Escape, restores focus to the poster
 *    that opened it, and supports arrow-key navigation.
 */
export function MemeConveyor({ items, label }: MemeConveyorProps) {
  const [paused, setPaused] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { play } = usePrefs()
  const lastTrigger = useRef<HTMLElement | null>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)

  const open = useCallback(
    (index: number, trigger: HTMLElement) => {
      lastTrigger.current = trigger
      setOpenIndex(index)
      play('select')
    },
    [play],
  )

  const close = useCallback(() => {
    setOpenIndex(null)
    play('cancel')
    // Put focus back where it came from.
    lastTrigger.current?.focus()
  }, [play])

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current == null || items.length === 0) return current
        return (current + delta + items.length) % items.length
      })
      play('select')
    },
    [items.length, play],
  )

  // Keyboard handling for the lightbox.
  useEffect(() => {
    if (openIndex == null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        step(1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        step(-1)
      } else if (event.key === 'Tab') {
        const root = lightboxRef.current
        if (!root) return
        const focusables = root.querySelectorAll<HTMLElement>('button, [href]')
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
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lightboxRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [openIndex, close, step])

  if (items.length === 0) return null

  const current = openIndex != null ? items[openIndex] : null

  const renderItem = (item: GalleryItem, index: number, isClone: boolean) => (
    <button
      type="button"
      key={`${item.id}-${isClone ? 'clone' : 'real'}`}
      className={styles.item}
      // The cloned belt exists purely so the loop looks seamless. Hiding it
      // keeps the accessible list and the tab order at ten items, not twenty.
      {...(isClone ? { 'aria-hidden': true, tabIndex: -1 } : {})}
      onClick={(event) => {
        if (isClone) return
        open(index, event.currentTarget)
      }}
    >
      <img
        className={styles.itemImg}
        src={item.src}
        alt={isClone ? '' : item.alt}
        width={item.width}
        height={item.height}
        loading="lazy"
        decoding="async"
      />
      <span className={styles.itemCaption}>
        {item.kicker} — {item.title}
      </span>
    </button>
  )

  return (
    <>
      <div className={styles.wrap} data-paused={paused ? 'true' : 'false'}>
        <div className={styles.controls}>
          <span className={styles.hint}>Hover or focus to pause. Select a poster to enlarge it.</span>
          <div className={styles.ctrlGroup}>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
            >
              <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
              {paused ? 'PLAY' : 'PAUSE'}
              <span className="visually-hidden">
                {paused ? 'Resume the moving gallery' : 'Pause the moving gallery'}
              </span>
            </button>
          </div>
        </div>

        <ul className={styles.track} aria-label={label} style={{ listStyle: 'none' }}>
          {items.map((item, index) => (
            <li key={item.id} style={{ display: 'contents' }}>
              {renderItem(item, index, false)}
            </li>
          ))}
          {items.map((item, index) => (
            <li key={`${item.id}-clone`} style={{ display: 'contents' }} aria-hidden="true">
              {renderItem(item, index, true)}
            </li>
          ))}
        </ul>
      </div>

      {current ? (
        <div
          className={styles.lightbox}
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${current.kicker} — ${current.title}`}
        >
          <div className={styles.lbHead}>
            <span className={styles.lbTitle}>
              {current.kicker} — {current.title}
            </span>
            <PixelButton tone="danger" size="sm" sound="cancel" onClick={close}>
              CLOSE ✕
            </PixelButton>
          </div>

          <div className={styles.lbStage}>
            <img
              className={styles.lbImg}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
            />
          </div>

          <div className={styles.lbFoot}>
            <p className={styles.lbAlt}>{current.alt}</p>
            <div className={styles.lbNav}>
              <PixelButton tone="cyan" size="sm" sound="select" onClick={() => step(-1)}>
                ◀ PREV
              </PixelButton>
              <PixelButton tone="cyan" size="sm" sound="select" onClick={() => step(1)}>
                NEXT ▶
              </PixelButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
