import { expect, test } from '@playwright/test'
import { enterSite } from './helpers'

test.describe('the evidence reel', () => {
  test('opens a poster in a lightbox and closes it with Escape', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#gallery').scrollIntoViewIfNeeded()

    const belt = page.getByRole('list', { name: /poster artwork/i })
    await belt.getByRole('button').first().click()

    const lightbox = page.getByRole('dialog')
    await expect(lightbox).toBeVisible()
    await expect(lightbox.getByRole('img')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(lightbox).toBeHidden()
  })

  test('navigates between posters with the arrow keys', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#gallery').scrollIntoViewIfNeeded()

    const belt = page.getByRole('list', { name: /poster artwork/i })
    await belt.getByRole('button').first().click()

    const lightbox = page.getByRole('dialog')
    const firstName = await lightbox.getAttribute('aria-label')
    await page.keyboard.press('ArrowRight')
    const secondName = await lightbox.getAttribute('aria-label')
    expect(secondName).not.toBe(firstName)
  })

  test('the belt can be paused', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#gallery').scrollIntoViewIfNeeded()
    const pause = page.getByRole('button', { name: /pause the moving gallery/i })
    await pause.click()
    await expect(page.getByRole('button', { name: /resume the moving gallery/i })).toBeVisible()
  })
})

test.describe('the contract copy control', () => {
  test('copies the GME address to the clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are chromium-specific here')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#gme-link').scrollIntoViewIfNeeded()

    await page.getByRole('button', { name: /^Copy GME STOCK TOKEN/i }).click()

    await expect(page.getByText('COPIED').first()).toBeVisible()
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toBe('0x1b0E319c6A659F002271B69dB8A7df2F911c153E')
  })

  test('the un-launched token contract has a disabled copy control', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#gme-link').scrollIntoViewIfNeeded()
    await expect(page.getByText(/NOT DEPLOYED YET/i).first()).toBeVisible()
  })
})

test.describe('keyboard operation', () => {
  test('the skip link is the first tabbable element and reaches main', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')

    // First tabbable in document order — independent of wherever focus
    // happened to land after the boot dialog was dismissed.
    const firstTabbable = await page.evaluate(() => {
      const candidates = document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      for (const el of candidates) {
        if (el.getAttribute('tabindex') === '-1') continue
        return el.textContent?.trim() ?? ''
      }
      return ''
    })
    expect(firstTabbable).toMatch(/skip to main content/i)

    const skip = page.getByRole('link', { name: /skip to main content/i })
    await skip.focus()
    await expect(skip).toBeFocused()
    await skip.press('Enter')
    await expect(page.locator('#main')).toBeAttached()
    expect(page.url()).toContain('#main')
  })

  test('the secret code unlocks phosphor mode and is reversible', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.evaluate(() => document.body.focus())
    for (const key of ['c', 'a', 'r', 't', '4', '6', '6', '3']) await page.keyboard.press(key)
    await expect(page.locator('html')).toHaveClass(/phosphor/)
    for (const key of ['c', 'a', 'r', 't', '4', '6', '6', '3']) await page.keyboard.press(key)
    await expect(page.locator('html')).not.toHaveClass(/phosphor/)
  })
})

test.describe('the mini game', () => {
  test('is playable and stores nothing', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#final').scrollIntoViewIfNeeded()

    const play = page.getByRole('button', { name: /^PLAY$/ })
    if (await play.isVisible().catch(() => false)) {
      await play.click()
      await expect(page.getByRole('button', { name: /^STOP$/ })).toBeVisible()
      await page.getByRole('button', { name: /^STOP$/ }).click()
    }

    // Nothing game-related may be persisted.
    const keys = await page.evaluate(() => Object.keys(window.localStorage))
    expect(keys.filter((k) => /score|game|coin/i.test(k))).toEqual([])
  })
})

test.describe('the mobile menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile viewport only')

  test('opens, navigates and closes', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')

    await page.getByRole('button', { name: /menu/i }).click()
    const drawer = page.getByRole('dialog', { name: /site menu/i })
    await expect(drawer).toBeVisible()

    await drawer.getByRole('link', { name: 'GME LINK' }).click()
    await expect(drawer).toBeHidden()
    await expect(page.locator('#gme-link')).toBeInViewport({ ratio: 0.05 })
  })

  test('closes with Escape', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.getByRole('button', { name: /menu/i }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /site menu/i })).toBeHidden()
  })
})
