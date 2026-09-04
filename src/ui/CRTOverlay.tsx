import { useEffect, useRef } from 'react'
import { usePrefs } from './usePrefs'
import styles from './CRTOverlay.module.css'

/**
 * The screen treatment that sells the whole conceit.
 *
 * Performance notes — this sits over the entire viewport for the life of the
 * page, so it is deliberately cheap:
 *  - it is five static gradient layers, no canvas, no per-frame paint;
 *  - the only dynamic value is a CSS custom property written at most once per
 *    animation frame from a passive pointermove listener;
 *  - the listener is not attached at all under REDUCE FX or on touch devices,
 *    where the glow is hidden anyway.
 */
export function CRTOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  const { fx } = usePrefs()

  useEffect(() => {
    if (fx === 'reduced') return
    const element = ref.current
    if (!element) return
    // No pointer glow on touch — it would only ever be a stale hotspot.
    if (window.matchMedia('(pointer: coarse)').matches) return

    let frame = 0
    let pendingX = 50
    let pendingY = 40

    const apply = () => {
      frame = 0
      element.style.setProperty('--mx', `${pendingX}%`)
      element.style.setProperty('--my', `${pendingY}%`)
    }

    const onMove = (event: PointerEvent) => {
      pendingX = (event.clientX / window.innerWidth) * 100
      pendingY = (event.clientY / window.innerHeight) * 100
      // Coalesce to one write per frame regardless of pointer sample rate.
      if (frame === 0) frame = window.requestAnimationFrame(apply)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [fx])

  return (
    <div ref={ref} className={styles.overlay} aria-hidden="true">
      <div className={styles.grille} />
      <div className={styles.scanlines} />
      <div className={styles.glow} />
      <div className={styles.roll} />
      <div className={styles.vignette} />
    </div>
  )
}
