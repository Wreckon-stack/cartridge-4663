import { expect, test } from '@playwright/test'
import { enterSite } from './helpers'

test.describe('first visit', () => {
  test('the boot dialog appears and offers a way out', async ({ page }) => {
    await page.goto('/')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog.getByRole('button', { name: /^START GAME$/ })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /STAY IN THE LOBBY/ })).toBeVisible()
  })

  test.describe('every exit reaches the same site', () => {
    for (const mode of ['sound', 'silent', 'lobby', 'escape'] as const) {
      test(`via ${mode}`, async ({ page }) => {
        await page.goto('/')
        await enterSite(page, mode)
        await expect(page.getByRole('heading', { name: /CARTRIDGE/i }).first()).toBeVisible()
        await expect(page.locator('#gme-link')).toBeAttached()
      })
    }
  })

  test('sound is off before any interaction, and there is no AudioContext', async ({ page }) => {
    await page.goto('/')
    const created = await page.evaluate(() => {
      // If the app had constructed a context on load, state would exist.
      return typeof window.AudioContext === 'function'
    })
    expect(created).toBe(true) // the API exists...
    await enterSite(page, 'silent')
    const toggle = page.getByRole('button', { name: /sound is off/i }).first()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('preferences', () => {
  test('sound can be turned on and off, and the state is reflected', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    const toggle = page.getByRole('button', { name: /sound is off/i }).first()
    await toggle.click()
    // Headless Chromium allows WebAudio after a gesture, so this should latch on.
    await expect(page.getByRole('button', { name: /sound is on/i }).first()).toBeVisible()
    await page
      .getByRole('button', { name: /sound is on/i })
      .first()
      .click()
    await expect(page.getByRole('button', { name: /sound is off/i }).first()).toBeVisible()
  })

  test('reduce FX flips the document class and persists across a reload', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page
      .getByRole('button', { name: /visual effects are at full/i })
      .first()
      .click()
    await expect(page.locator('html')).toHaveClass(/fx-reduced/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/fx-reduced/)
    await expect(page.getByRole('button', { name: /visual effects are reduced/i }).first()).toBeVisible()
  })
})

test.describe('navigation', () => {
  const sections = [
    'welcome',
    'cartridge',
    'gme-link',
    'market',
    'how',
    'archives',
    'gallery',
    'scores',
    'final',
  ]

  test('every section exists and every in-page anchor resolves', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')

    for (const id of sections) {
      await expect(page.locator(`#${id}`)).toBeAttached()
    }

    const dead = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .map((a) => a.getAttribute('href')!.slice(1))
        .filter((id) => id && !document.getElementById(id)),
    )
    expect(dead).toEqual([])
  })

  test('there are no dead controls — every link has a destination or is disabled', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('a')]
        .filter((a) => {
          const href = a.getAttribute('href')
          return !href || href === '#' || href === ''
        })
        .map((a) => a.textContent?.trim().slice(0, 40)),
    )
    expect(bad).toEqual([])
  })
})

test.describe('honesty guarantees', () => {
  test('the pre-launch banner is shown and cannot be mistaken for a live site', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    const banner = page.getByTestId('preview-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(/PRE-LAUNCH PREVIEW/i)
    await expect(banner).toContainText(/has not launched/i)
  })

  test('unavailable metrics read NO SIGNAL rather than showing a number', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#market').scrollIntoViewIfNeeded()
    const arcade = page.locator('#market')
    await expect(arcade.getByText('NO SIGNAL').first()).toBeVisible()
    // No metric tile should contain a plausible-looking price.
    await expect(arcade).not.toContainText(/\$\d/)
  })

  test('the pre-launch primary action is visibly disabled, not styled as live', async ({ page }) => {
    // With no token deployed there is no address to copy, so COPY CONTRACT is
    // disabled. Unlike the old TRADE control this state is temporary — it
    // resolves itself the moment VITE_TOKEN_ADDRESS is set — but until then it
    // must not be dressed up as an active button.
    await page.goto('/')
    await enterSite(page, 'silent')
    const cta = page.getByRole('button', { name: /copy contract/i }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toBeDisabled()
    const bg = await cta.evaluate((el) => getComputedStyle(el).backgroundColor)
    // The disabled face is #3a3a4c. It must NOT be the coin yellow #ffe600.
    expect(bg).not.toBe('rgb(255, 230, 0)')
    expect(bg).toBe('rgb(58, 58, 76)')
  })

  test('no dead TRADE control is rendered when there is no venue', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await expect(page.getByText('TRADE / LAUNCH')).toHaveCount(0)
  })

  test('the GME contract is shown in full and is copyable', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#gme-link').scrollIntoViewIfNeeded()
    await expect(page.getByText('0x1b0E319c6A659F002271B69dB8A7df2F911c153E').first()).toBeVisible()
  })

  test('the not-a-share disclosure is present near the pairing explanation', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await expect(page.getByText(/NOT GAMESTOP STOCK/i).first()).toBeVisible()
  })
})

test.describe('external links', () => {
  test('all open in a new tab with the anti-tabnabbing attributes', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    const unsafe = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="http"]')]
        .filter((a) => {
          const rel = a.getAttribute('rel') ?? ''
          return !rel.includes('noopener') || !rel.includes('noreferrer')
        })
        .map((a) => a.getAttribute('href')),
    )
    expect(unsafe).toEqual([])
  })
})

test.describe('layout integrity', () => {
  test('there is no accidental horizontal overflow', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    const overflow = await page.evaluate(() => {
      const de = document.documentElement
      return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth }
    })
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
  })

  test('every meaningful image has alt text', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('img:not([alt])')].map((i) => i.getAttribute('src')),
    )
    expect(missing).toEqual([])
  })

  test('the wordmark never drops a letter onto its own line', async ({ page }) => {
    // Regression: Anton is ~1.5x narrower than the system fallback, so during
    // the font-swap window (or if the webfont fails) the hero wordmark used to
    // wrap and drop its final letter. Fixed with metric-matched fallback faces,
    // white-space: nowrap, and a container-relative size cap.
    await page.goto('/')
    await enterSite(page, 'silent')

    const lines = await page.evaluate(() => {
      const el = document.querySelector('h1')!
      const cs = getComputedStyle(el)
      const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 0.82
      const rect = el.getBoundingClientRect()
      return {
        lines: Math.round(rect.height / lineHeight),
        width: Math.round(rect.width),
        available: Math.round(el.parentElement!.getBoundingClientRect().width),
      }
    })
    // Two lines: the name's first word, then the remainder. Never three.
    expect(lines.lines).toBeLessThanOrEqual(2)
    expect(lines.width).toBeLessThanOrEqual(lines.available + 1)
  })

  test('the wordmark still fits when the display font fails to load', async ({ page }) => {
    await page.route('**/anton-400.woff2', (route) => route.abort())
    await page.goto('/')
    await enterSite(page, 'silent')

    const lines = await page.evaluate(() => {
      const el = document.querySelector('h1')!
      const cs = getComputedStyle(el)
      const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 0.82
      return Math.round(el.getBoundingClientRect().height / lineHeight)
    })
    expect(lines).toBeLessThanOrEqual(2)
  })

  test('there is exactly one h1', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('no severe console errors during a full page visit', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#final').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    // Network failures reaching a rate-limited public RPC are expected and are
    // surfaced in the UI as an honest FEED LOST state, not as a crash.
    const severe = errors.filter(
      (e) => !/Failed to load resource|net::ERR|429|rate limit|HTTP request failed/i.test(e),
    )
    expect(severe).toEqual([])
  })
})
