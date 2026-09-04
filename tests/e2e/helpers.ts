import type { Page } from '@playwright/test'

/**
 * Dismiss the boot curtain. `mode` picks which of the three exits is used, so
 * tests can cover each one.
 */
export async function enterSite(page: Page, mode: 'sound' | 'silent' | 'lobby' | 'escape' = 'silent') {
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible', timeout: 20_000 })

  if (mode === 'escape') {
    await page.keyboard.press('Escape')
  } else {
    const name =
      mode === 'sound' ? /^START GAME$/ : mode === 'silent' ? /START \(SILENT\)/ : /STAY IN THE LOBBY/
    await dialog.getByRole('button', { name }).click()
  }

  await dialog.waitFor({ state: 'detached', timeout: 10_000 })
}

/**
 * Freeze motion before taking a screenshot. Uses the site's own REDUCE FX
 * control rather than injected CSS, so the snapshot reflects a real user state.
 */
export async function reduceMotion(page: Page) {
  const toggle = page.getByRole('button', { name: /visual effects are at full/i }).first()
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click()
  } else {
    await page.evaluate(() => {
      window.localStorage.setItem('c4663:fx', 'reduced')
    })
    await page.reload()
  }
}
