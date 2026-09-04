import { useEffect, useState } from 'react'

/**
 * A keyboard unlock.
 *
 * Original sequence (not the Konami code): C-A-R-T-4-6-6-3. Typing it flips a
 * class on <html> that swaps the palette to a "green phosphor" mode.
 *
 * It is purely cosmetic and nothing on the site depends on finding it. The
 * listener ignores keystrokes while an input is focused so it cannot hijack
 * typing, and it is a `keydown` on window with no preventDefault.
 */
const SEQUENCE = ['c', 'a', 'r', 't', '4', '6', '6', '3']

export function useSecretCode(enabled: boolean): boolean {
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let progress = 0

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      // Never swallow keystrokes meant for a form control.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (target?.isContentEditable) return

      const key = event.key.toLowerCase()
      if (key === SEQUENCE[progress]) {
        progress += 1
        if (progress === SEQUENCE.length) {
          progress = 0
          setUnlocked((value) => !value)
        }
      } else {
        // Allow a wrong key to still start a fresh attempt.
        progress = key === SEQUENCE[0] ? 1 : 0
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])

  useEffect(() => {
    document.documentElement.classList.toggle('phosphor', unlocked)
  }, [unlocked])

  return unlocked
}
