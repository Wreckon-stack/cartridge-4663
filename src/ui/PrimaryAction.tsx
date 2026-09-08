import { useCallback, useEffect, useRef, useState } from 'react'
import { onchain } from '@/config/project.config'
import { TRADE_LINK } from '@/config/content/socials'
import { checkAddress } from '@/lib/address'
import { PixelButton } from './PixelButton'
import type { ButtonSize } from './PixelButton'
import { usePrefs } from './usePrefs'

type CopyState = 'idle' | 'done' | 'error'

export interface PrimaryActionProps {
  size?: ButtonSize
  /** Slow attract shimmer. Use on the hero only. */
  attract?: boolean
  className?: string
}

/**
 * The site's single primary call to action.
 *
 * This project does not use a hosted trade page, so the default action is to
 * copy the contract address — the address is the product, and people paste it
 * into whatever wallet or DEX they already use.
 *
 * The trade-link path is kept rather than deleted: if `VITE_DEX_OR_LAUNCH_URL`
 * is ever configured, this silently becomes an INSERT COIN link to it. That
 * keeps the option open without leaving a dead button on the page today.
 *
 * Pre-launch the control is disabled with an explicit reason. That is a
 * *temporary* disabled state that resolves itself the moment the token exists,
 * which is materially different from a button that can never work.
 */
export function PrimaryAction({ size = 'lg', attract, className }: PrimaryActionProps) {
  const [state, setState] = useState<CopyState>('idle')
  const { play } = usePrefs()
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const token = checkAddress(onchain.tokenAddress)
  const address = token.ok ? token.address : null

  const copy = useCallback(async () => {
    if (!address) return
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address)
        ok = true
      }
    } catch {
      ok = false
    }
    if (!ok) ok = legacyCopy(address)

    setState(ok ? 'done' : 'error')
    play(ok ? 'coin' : 'error')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2200)
  }, [address, play])

  // A venue is configured — behave as a normal outbound trade link.
  if (TRADE_LINK) {
    return (
      <PixelButton
        as="a"
        href={TRADE_LINK}
        tone="coin"
        size={size}
        {...(attract ? { attract: true } : {})}
        sound="coin"
        {...(className ? { className } : {})}
      >
        INSERT COIN
      </PixelButton>
    )
  }

  return (
    <>
      <PixelButton
        tone="coin"
        size={size}
        {...(attract && address ? { attract: true } : {})}
        sound="coin"
        onClick={() => void copy()}
        {...(address ? {} : { disabled: true })}
        disabledReason="The token has not been deployed yet, so there is no contract address to copy"
        {...(className ? { className } : {})}
      >
        {state === 'done' ? '✓ COPIED' : state === 'error' ? '✕ COPY FAILED' : 'COPY CONTRACT'}
      </PixelButton>

      {/* Announced without stealing focus. */}
      <span role="status" aria-live="polite" className="visually-hidden">
        {state === 'done'
          ? 'Contract address copied to clipboard'
          : state === 'error'
            ? 'Could not copy the contract address. Use the copy field in the final section instead.'
            : ''}
      </span>
    </>
  )
}

/** Fallback for insecure origins and in-app browsers. */
function legacyCopy(text: string): boolean {
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
