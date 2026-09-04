import { useCallback, useEffect, useRef, useState } from 'react'
import { PixelButton } from '@/ui/PixelButton'
import { usePrefs } from '@/ui/usePrefs'
import styles from './FinalLevel.module.css'

/**
 * A ten-second toy: catch falling coins in the cartridge slot.
 *
 * Explicitly NOT connected to anything — no wallet, no reward, no score
 * submission, nothing stored anywhere. It exists because an arcade site should
 * have one playable thing in it, and for no other reason.
 *
 * It is also entirely optional: nothing on the page depends on playing it, it
 * is keyboard-operable, and it does not run at all under REDUCE FX.
 */
const DURATION_MS = 10_000
const STAGE_HEIGHT = 120
const COIN_SIZE = 22

interface Coin {
  id: number
  x: number
  y: number
  speed: number
}

export function CoinDrop() {
  const { play, fx } = usePrefs()
  const [running, setRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION_MS)
  const [slotX, setSlotX] = useState(50)
  const [coins, setCoins] = useState<Coin[]>([])
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef(0)
  const nextId = useRef(0)

  const stop = useCallback(() => {
    setRunning(false)
    setCoins([])
    window.cancelAnimationFrame(frameRef.current)
  }, [])

  const start = useCallback(() => {
    setScore(0)
    setTimeLeft(DURATION_MS)
    setCoins([])
    setRunning(true)
    play('confirm')
  }, [play])

  useEffect(() => {
    if (!running) return
    let last = performance.now()
    let spawnAccumulator = 0
    let remaining = DURATION_MS
    // Deterministic spawn positions — no Math.random, so the game plays the
    // same for everyone and the e2e test is not flaky.
    let spawnSeed = 4663

    const tick = (now: number) => {
      const delta = Math.min(now - last, 64)
      last = now
      remaining -= delta
      if (remaining <= 0) {
        setTimeLeft(0)
        stop()
        play('powerup')
        return
      }
      setTimeLeft(remaining)

      spawnAccumulator += delta
      setCoins((current) => {
        let next = current.map((coin) => ({ ...coin, y: coin.y + coin.speed * (delta / 16) }))

        if (spawnAccumulator > 620) {
          spawnAccumulator = 0
          spawnSeed = (spawnSeed * 1103515245 + 12345) & 0x7fffffff
          const x = 8 + (spawnSeed % 84)
          nextId.current += 1
          next = [...next, { id: nextId.current, x, y: -COIN_SIZE, speed: 2.2 }]
        }

        // Collision with the slot, then cull anything past the floor.
        const kept: Coin[] = []
        for (const coin of next) {
          const atSlotHeight = coin.y + COIN_SIZE >= STAGE_HEIGHT - 52
          if (atSlotHeight && Math.abs(coin.x - slotX) < 9) {
            setScore((value) => value + 1)
            play('coin')
            continue
          }
          if (coin.y < STAGE_HEIGHT) kept.push(coin)
        }
        return kept
      })

      frameRef.current = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameRef.current)
  }, [running, slotX, stop, play])

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), [])

  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    setSlotX(Math.min(94, Math.max(6, ((event.clientX - rect.left) / rect.width) * 100)))
  }

  const moveKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setSlotX((x) => Math.max(6, x - 7))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setSlotX((x) => Math.min(94, x + 7))
    }
  }

  if (fx === 'reduced') {
    return (
      <div className={styles.game}>
        <p className={styles.gameTitle}>◆ COIN DROP ◆</p>
        <p className={styles.gameNote}>
          The mini-game is disabled while reduced effects are on, because it is entirely motion. Nothing else
          on this page depends on it.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.game}>
      <p className={styles.gameTitle}>◆ COIN DROP — 10 SECONDS, NO PRIZE ◆</p>

      <div
        className={styles.gameStage}
        ref={stageRef}
        onPointerMove={movePointer}
        onKeyDown={moveKey}
        tabIndex={0}
        role="application"
        aria-label="Coin Drop mini-game. Use the left and right arrow keys to move the cartridge slot and catch falling coins. This is a toy with no reward."
      >
        {coins.map((coin) => (
          <img
            key={coin.id}
            className={styles.gameCoin}
            src="/art/coin.svg"
            alt=""
            style={{ left: `${coin.x}%`, top: `${coin.y}px` }}
            width={COIN_SIZE}
            height={COIN_SIZE}
          />
        ))}
        <div className={styles.gameSlot} style={{ left: `${slotX}%` }} />
      </div>

      <div className={styles.gameHud}>
        <span>COINS: {score}</span>
        <span>TIME: {(timeLeft / 1000).toFixed(1)}s</span>
      </div>

      <div style={{ marginBlockStart: '0.75rem' }}>
        <PixelButton tone="cyan" size="sm" onClick={running ? stop : start} sound="select">
          {running ? 'STOP' : score > 0 ? 'PLAY AGAIN' : 'PLAY'}
        </PixelButton>
      </div>

      <p className={styles.gameNote}>
        No wallet, no reward, no leaderboard, nothing saved. Arrow keys work too.
      </p>
      <span role="status" aria-live="polite" className="visually-hidden">
        {running ? '' : score > 0 ? `Game over. You caught ${score} coins.` : ''}
      </span>
    </div>
  )
}
