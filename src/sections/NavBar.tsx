import { useCallback, useEffect, useRef, useState } from 'react'
import { NAV_ITEMS } from '@/config/content/nav'
import { brand } from '@/config/project.config'
import { TRADE_LINK, X_LINK } from '@/config/content/socials'
import { PixelButton } from '@/ui/PixelButton'
import { EffectsToggle, SoundToggle } from '@/ui/Toggles'
import { usePrefs } from '@/ui/usePrefs'
import styles from './NavBar.module.css'

/** Tiny cartridge separator between nav links. */
function CartSep() {
  return (
    <svg className={styles.sep} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="10" height="10" fill="#ff6a00" />
      <rect x="2" y="2" width="8" height="4" fill="#00f5ff" />
      <rect x="3" y="9" width="2" height="2" fill="#ffe600" />
      <rect x="7" y="9" width="2" height="2" fill="#ffe600" />
    </svg>
  )
}

export function NavBar() {
  const [open, setOpen] = useState(false)
  const { play } = usePrefs()
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    // Return focus to the control that opened the drawer.
    menuButtonRef.current?.focus()
  }, [])

  // Escape closes the drawer; body scroll is locked while it is open.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
      if (event.key === 'Tab') {
        const root = drawerRef.current
        if (!root) return
        const focusables = root.querySelectorAll<HTMLElement>('button:not([disabled]), [href]')
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
    // Focus the first item so the menu is immediately navigable.
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, close])

  // Keep the sticky header's height in a custom property so anchored sections
  // can scroll clear of it at any breakpoint.
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = headerRef.current
    if (!element) return
    const update = () =>
      document.documentElement.style.setProperty('--nav-height', `${element.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/*
        The scrolling red hazard strip that used to sit above the nav was
        removed at the operator's request. The "not GameStop stock" disclosure
        is unaffected — it still appears in the hero pair bar, the Player One vs
        Player Two panel, the owner's manual warning, the manifesto, the footer
        risk notice, and the noscript fallback.
      */}
      <header className={styles.header} ref={headerRef}>
        <nav className={styles.strip} aria-label="Main">
          {NAV_ITEMS.map((item, index) => (
            <span key={item.id} style={{ display: 'contents' }}>
              <a
                className={styles.link}
                href={item.href}
                data-accent={item.accent}
                onClick={() => play('select')}
              >
                {item.label}
              </a>
              {index < NAV_ITEMS.length - 1 ? <CartSep /> : null}
            </span>
          ))}
        </nav>

        <div className={styles.controls}>
          {/*
            The X account is the project's only outbound channel, so it gets the
            most prominent slot in the header rather than living solely at the
            bottom of the page. Omitted rather than disabled if unconfigured.
          */}
          {X_LINK ? (
            <PixelButton as="a" href={X_LINK} tone="cyan" size="sm" sound="select">
              OFFICIAL X ↗
            </PixelButton>
          ) : null}
          {/*
            Only shown when a venue is actually configured. With none, the nav
            would otherwise carry a permanently dead button — and the primary
            call to action already lives in the hero and the final section.
          */}
          {TRADE_LINK ? (
            <PixelButton as="a" href={TRADE_LINK} tone="coin" size="sm" sound="coin">
              TRADE / LAUNCH
            </PixelButton>
          ) : null}
          <SoundToggle />
          <EffectsToggle />
        </div>

        {/* ── Mobile ── */}
        <div className={styles.mobileBar}>
          <span className={styles.brandChip}>
            <img className={styles.brandMark} src="/art/logo-mark.svg" alt="" width={28} height={28} />
            <span className={styles.brandText}>{brand.name}</span>
          </span>
          {/*
            Sound and FX stay visible on mobile rather than hiding inside the
            drawer. Both are persistent controls a visitor may need immediately,
            and burying a sound switch behind a hamburger is exactly the thing
            people complain about.
          */}
          <span className={styles.mobileToggles}>
            {/* Compact, but still above the fold on a phone. */}
            {X_LINK ? (
              <a
                className={styles.xChip}
                href={X_LINK}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => play('select')}
              >
                <span aria-hidden="true">X</span>
                <span className="visually-hidden">Official X account (opens in a new tab)</span>
              </a>
            ) : null}
            <SoundToggle className={styles.compactToggle} />
            <EffectsToggle className={styles.compactToggle} />
          </span>
          <button
            type="button"
            className={styles.menuBtn}
            ref={menuButtonRef}
            onClick={() => {
              play('select')
              setOpen(true)
            }}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            ☰ MENU
          </button>
        </div>
      </header>

      {open ? (
        <div className={styles.drawer} ref={drawerRef} role="dialog" aria-modal="true" aria-label="Site menu">
          <div className={styles.drawerHead}>
            <span className={styles.drawerTitle}>❚❚ PAUSED</span>
            <PixelButton tone="danger" size="sm" sound="cancel" onClick={close}>
              RESUME ✕
            </PixelButton>
          </div>

          <div>
            <ul className={styles.drawerList}>
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    className={styles.drawerLink}
                    href={item.href}
                    data-accent={item.accent}
                    onClick={() => {
                      play('select')
                      close()
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className={styles.drawerControls}>
              {X_LINK ? (
                <PixelButton as="a" href={X_LINK} tone="cyan" size="md" block sound="select">
                  OFFICIAL X ↗
                </PixelButton>
              ) : null}
              {TRADE_LINK ? (
                <PixelButton as="a" href={TRADE_LINK} tone="coin" size="md" block sound="coin">
                  TRADE / LAUNCH
                </PixelButton>
              ) : null}
              <SoundToggle />
              <EffectsToggle />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
