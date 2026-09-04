import type { ReactNode } from 'react'
import { EXTERNAL_LINK_PROPS } from '@/lib/links'
import { usePrefs } from './usePrefs'
import type { SoundName } from '@/audio/audio-engine'
import styles from './PixelButton.module.css'

export type ButtonTone = 'coin' | 'danger' | 'cyan' | 'magenta' | 'cart' | 'slate' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface CommonProps {
  children: ReactNode
  tone?: ButtonTone
  size?: ButtonSize
  block?: boolean
  /** Slow shimmer. Use on at most one control per screen. */
  attract?: boolean
  className?: string
  /** Sound played on activation. Silent when sound is off. */
  sound?: SoundName
}

type ActionProps = CommonProps & {
  as?: 'button'
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Explains why the control is disabled. Announced to screen readers. */
  disabledReason?: string
}

type LinkProps = CommonProps & {
  as: 'a'
  /** A null href renders a disabled control rather than a dead link. */
  href: string | null
  external?: boolean
  disabledReason?: string
}

export type PixelButtonProps = ActionProps | LinkProps

/**
 * The one button in the system.
 *
 * A link with no destination becomes a genuinely disabled control with a stated
 * reason, which is what keeps the "no dead buttons" rule true even when the
 * launch URL has not been configured yet.
 */
export function PixelButton(props: PixelButtonProps) {
  const { play } = usePrefs()
  const { children, tone = 'coin', size = 'md', block, attract, className, sound = 'select' } = props

  const shared = {
    className: [styles.btn, className].filter(Boolean).join(' '),
    'data-tone': tone,
    'data-size': size,
    'data-block': block ? 'true' : 'false',
    'data-attract': attract ? 'true' : 'false',
  }

  if (props.as === 'a') {
    const { href, external = true, disabledReason } = props
    if (!href) {
      return (
        <span {...shared} aria-disabled="true" role="link" tabIndex={-1}>
          {children}
          {disabledReason ? <span className="visually-hidden"> — {disabledReason}</span> : null}
        </span>
      )
    }
    return (
      <a {...shared} href={href} onClick={() => play(sound)} {...(external ? EXTERNAL_LINK_PROPS : {})}>
        {children}
        {external ? <span className="visually-hidden"> (opens in a new tab)</span> : null}
      </a>
    )
  }

  const { onClick, type = 'button', disabled, disabledReason } = props
  return (
    <button
      {...shared}
      type={type}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        play(sound)
        onClick?.()
      }}
    >
      {children}
      {disabled && disabledReason ? <span className="visually-hidden"> — {disabledReason}</span> : null}
    </button>
  )
}
