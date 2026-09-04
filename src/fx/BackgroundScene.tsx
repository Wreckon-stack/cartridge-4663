import { useEffect, useMemo, useRef } from 'react'
import { makeRng, scatter } from '@/lib/random'
import { usePrefs } from '@/ui/usePrefs'
import styles from './BackgroundScene.module.css'

const FLOATERS = [
  { src: '/art/mini-cart.svg', size: 72, alt: '' },
  { src: '/art/coin.svg', size: 54, alt: '' },
  { src: '/art/corrupt-save.svg', size: 64, alt: '' },
  { src: '/art/mini-cart.svg', size: 48, alt: '' },
  { src: '/art/coin.svg', size: 40, alt: '' },
  { src: '/art/corrupt-save.svg', size: 44, alt: '' },
] as const

const COIN_COUNT = 9

/**
 * The fixed scenery behind the whole page.
 *
 * Performance contract:
 *  - exactly ONE requestAnimationFrame loop exists for the entire site, and it
 *    lives here;
 *  - it stops completely when the tab is hidden (visibilitychange) and when
 *    REDUCE FX is on;
 *  - the star field is drawn to a canvas sized to devicePixelRatio, capped at 2
 *    so a 3x phone does not paint 9x the pixels;
 *  - floating sprites are CSS animations on transform/opacity only, so they
 *    stay on the compositor and never trigger layout.
 *
 * All scatter positions come from a seeded RNG, so the scene is identical on
 * every load — which is what makes visual regression snapshots meaningful.
 */
export function BackgroundScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { fx } = usePrefs()
  const reduced = fx === 'reduced'

  // Deterministic placement for the floating sprites.
  const floaterStyles = useMemo(() => {
    // Ceiling is 78%, not 92%: these are up to 72px wide and are anchored by
    // their left edge, so a higher value pushed them past the right edge of a
    // 320px viewport and gave the document a horizontal scroll.
    const xs = scatter(FLOATERS.length, 4663, 4, 78)
    const ys = scatter(FLOATERS.length, 9042, 8, 82)
    const delays = scatter(FLOATERS.length, 1337, 0, 8)
    const durations = scatter(FLOATERS.length, 2718, 16, 26)
    return FLOATERS.map((_, index) => ({
      left: `${xs[index] ?? 50}%`,
      top: `${ys[index] ?? 50}%`,
      animationDelay: `${delays[index] ?? 0}s`,
      animationDuration: `${durations[index] ?? 20}s`,
    }))
  }, [])

  const coinStyles = useMemo(() => {
    const xs = scatter(COIN_COUNT, 5150, 2, 88)
    const delays = scatter(COIN_COUNT, 6060, 0, 11)
    // 5.5–9s, matching the reference's staggered fall timing.
    const durations = scatter(COIN_COUNT, 7070, 5.5, 9)
    const sizes = scatter(COIN_COUNT, 8080, 18, 34)
    return Array.from({ length: COIN_COUNT }, (_, index) => ({
      left: `${xs[index] ?? 50}%`,
      animationDelay: `${delays[index] ?? 0}s`,
      animationDuration: `${durations[index] ?? 7}s`,
      width: `${Math.round(sizes[index] ?? 24)}px`,
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return

    // Cap DPR: beyond 2x nobody can see the difference in a star field, but the
    // fill cost keeps climbing.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0

    interface Star {
      x: number
      y: number
      z: number
      size: number
      hue: string
    }
    let stars: Star[] = []

    const HUES = ['#f4f0dd', '#00f5ff', '#ff00d4', '#ffe600']

    const build = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Density scales with area but is capped so a 4K monitor does not get
      // thousands of stars.
      const count = Math.min(160, Math.round((width * height) / 9000))
      const rng = makeRng(4663)
      stars = Array.from({ length: count }, () => ({
        x: rng() * width,
        y: rng() * height,
        z: 0.25 + rng() * 0.75,
        size: rng() > 0.86 ? 2 : 1,
        hue: HUES[Math.floor(rng() * HUES.length)] ?? '#f4f0dd',
      }))
    }

    const drawStatic = () => {
      context.clearRect(0, 0, width, height)
      for (const star of stars) {
        context.globalAlpha = 0.25 + star.z * 0.55
        context.fillStyle = star.hue
        context.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size)
      }
      context.globalAlpha = 1
    }

    build()

    if (reduced) {
      // Still render the field — it is scenery, not motion — just frozen.
      drawStatic()
      const onResizeStatic = () => {
        build()
        drawStatic()
      }
      window.addEventListener('resize', onResizeStatic)
      return () => window.removeEventListener('resize', onResizeStatic)
    }

    let frame = 0
    let running = true
    let last = performance.now()

    const tick = (now: number) => {
      if (!running) return
      const delta = Math.min(now - last, 64) / 1000
      last = now
      context.clearRect(0, 0, width, height)
      for (const star of stars) {
        // Slow rightward drift; parallax by depth.
        star.x += star.z * 8 * delta
        if (star.x > width + 2) star.x -= width + 4
        context.globalAlpha = 0.25 + star.z * 0.55
        context.fillStyle = star.hue
        context.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size)
      }
      context.globalAlpha = 1
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)

    // Stop entirely in a background tab.
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        window.cancelAnimationFrame(frame)
      } else if (!running) {
        running = true
        last = performance.now()
        frame = window.requestAnimationFrame(tick)
      }
    }

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(build, 150)
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', onResize)

    return () => {
      running = false
      window.cancelAnimationFrame(frame)
      window.clearTimeout(resizeTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
    }
  }, [reduced])

  return (
    <div className={styles.scene} aria-hidden="true">
      <canvas className={styles.canvas} ref={canvasRef} />

      <div className={styles.floaters}>
        {FLOATERS.map((floater, index) => (
          <img
            key={`${floater.src}-${index}`}
            className={styles.floater}
            src={floater.src}
            alt=""
            width={floater.size}
            height={floater.size}
            style={floaterStyles[index]}
            loading="lazy"
            decoding="async"
          />
        ))}

        {coinStyles.map((style, index) => (
          <img
            key={`coin-${index}`}
            className={styles.coinFall}
            src="/art/coin.svg"
            alt=""
            width={24}
            height={24}
            style={style}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      <img className={styles.skyline} src="/art/skyline.svg" alt="" width={1600} height={360} />
    </div>
  )
}
