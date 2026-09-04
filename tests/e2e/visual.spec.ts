import { expect, test } from '@playwright/test'
import { enterSite, reduceMotion } from './helpers'

/**
 * Visual regression.
 *
 * Every snapshot is taken with REDUCE FX on, which stops the star field, the
 * marquees, the falling coins and the CRT roll bar. Because all decorative
 * placement uses a seeded RNG (src/lib/random.ts), the scene is byte-identical
 * between runs — so a diff means something actually changed.
 */
const SECTIONS = [
  { id: 'welcome', name: 'hero' },
  { id: 'cartridge', name: 'player-comparison' },
  { id: 'gme-link', name: 'pair-evidence' },
  { id: 'market', name: 'market-arcade' },
  { id: 'how', name: 'how-pairing' },
  { id: 'archives', name: 'archives' },
  { id: 'gallery', name: 'evidence-reel' },
  { id: 'scores', name: 'high-scores' },
  { id: 'final', name: 'final-level' },
] as const

test.describe('section snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await reduceMotion(page)
    // Let fonts settle so glyph metrics are stable.
    await page.evaluate(() => document.fonts.ready)
  })

  for (const section of SECTIONS) {
    test(section.name, async ({ page }, testInfo) => {
      const target = page.locator(`#${section.id}`)
      await target.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      await expect(target).toHaveScreenshot(`${section.name}-${testInfo.project.name}.png`, {
        // The market panel shows a "last read" clock that ticks; mask it so the
        // snapshot tests layout rather than the current time.
        mask: [page.locator('[title*="Value read"]'), page.getByText(/ago$/)],
      })
    })
  }
})

test.describe('opening dialog', () => {
  test('boot dialog', async ({ page }, testInfo) => {
    await page.evaluate?.(() => {})
    await page.goto('/')
    // Ask for reduced motion up front so the POST sequence is already complete
    // and the dialog is in a settled state.
    await page.evaluate(() => window.localStorage.setItem('c4663:fx', 'reduced'))
    await page.reload()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    await expect(page).toHaveScreenshot(`boot-dialog-${testInfo.project.name}.png`)
  })
})

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile viewport only')

  test('menu drawer', async ({ page }, testInfo) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await reduceMotion(page)
    await page.getByRole('button', { name: /menu/i }).click()
    await page.getByRole('dialog', { name: /site menu/i }).waitFor()
    await page.evaluate(() => document.fonts.ready)
    await expect(page).toHaveScreenshot(`mobile-menu-${testInfo.project.name}.png`)
  })
})
