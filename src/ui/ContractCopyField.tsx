import { useCallback, useEffect, useRef, useState } from 'react'
import { EXTERNAL_LINK_PROPS, explorerAddressUrl } from '@/lib/links'
import { usePrefs } from './usePrefs'
import styles from './ContractCopyField.module.css'

type CopyState = 'idle' | 'done' | 'error'

export interface ContractCopyFieldProps {
  label: string
  /** The address. Null renders an explicit "not deployed yet" state. */
  address: string | null
  /** Shown instead of an address when there is none. */
  emptyText?: string
  /** Adds an explorer link beside the copy control. */
  withExplorer?: boolean
  note?: string
  className?: string
}

/**
 * Full-address display with a copy control.
 *
 * Copy is done with the async Clipboard API and falls back to
 * `document.execCommand('copy')` over a hidden textarea, because the modern API
 * is unavailable on insecure origins and inside some in-app browsers — exactly
 * the environments where someone is most likely to be copying a contract.
 * If both fail, the button says so rather than silently reporting success.
 */
export function ContractCopyField({
  label,
  address,
  emptyText = 'NOT DEPLOYED YET',
  withExplorer = true,
  note,
  className,
}: ContractCopyFieldProps) {
  const [state, setState] = useState<CopyState>('idle')
  const { play } = usePrefs()
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

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

  const explorerHref = withExplorer ? explorerAddressUrl(address) : null

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>

      <code className={styles.value} data-empty={address ? 'false' : 'true'}>
        {address ?? emptyText}
      </code>

      <button
        type="button"
        className={`${styles.copy} on-coin`}
        onClick={() => void copy()}
        disabled={!address}
        data-done={state === 'done' ? 'true' : state === 'error' ? 'error' : 'false'}
      >
        <span aria-hidden="true">{state === 'done' ? '✓' : state === 'error' ? '✕' : '⧉'}</span>
        <span aria-hidden="true">{state === 'done' ? 'COPIED' : state === 'error' ? 'FAILED' : 'COPY'}</span>
        {/*
          The visible word is the same on every field, so the accessible name
          carries the label too — otherwise a page with four "COPY" buttons is
          unusable by voice control or a screen-reader element list.
        */}
        <span className="visually-hidden">
          {state === 'done'
            ? `Copied ${label}`
            : state === 'error'
              ? `Failed to copy ${label}`
              : `Copy ${label}`}
        </span>
      </button>

      {explorerHref ? (
        <a className={styles.explorer} href={explorerHref} {...EXTERNAL_LINK_PROPS}>
          EXPLORER
          <span className="visually-hidden"> — view {label} on Blockscout (opens in a new tab)</span>
        </a>
      ) : null}

      {/* Announce the outcome without stealing focus. */}
      <span role="status" aria-live="polite" className="visually-hidden">
        {state === 'done'
          ? `${label} copied to clipboard`
          : state === 'error'
            ? `Could not copy ${label}. Select the text and copy manually.`
            : ''}
      </span>

      {note ? <span className={styles.note}>{note}</span> : null}
    </div>
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
