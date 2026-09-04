import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { enterSite } from './helpers'

/**
 * Automated accessibility audit.
 *
 * Axe catches roughly a third of real accessibility problems, so this is a
 * floor rather than a certificate — the manual checks (keyboard operation,
 * focus restoration, pause controls) live in interactions.spec.ts.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.describe('the whole page', () => {
  test('has no detectable WCAG A/AA violations', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()

    if (results.violations.length > 0) {
      console.log(
        JSON.stringify(
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.slice(0, 4).map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
          null,
          2,
        ),
      )
    }
    expect(results.violations).toEqual([])
  })

  test('the boot dialog has no violations either', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 20_000 })

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    if (results.violations.length > 0) {
      console.log(
        JSON.stringify(
          results.violations.map((v) => ({ id: v.id, help: v.help })),
          null,
          2,
        ),
      )
    }
    expect(results.violations).toEqual([])
  })

  test('the lightbox has no violations', async ({ page }) => {
    await page.goto('/')
    await enterSite(page, 'silent')
    await page.locator('#gallery').scrollIntoViewIfNeeded()
    await page
      .getByRole('list', { name: /poster artwork/i })
      .getByRole('button')
      .first()
      .click()
    await page.getByRole('dialog').waitFor()

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    if (results.violations.length > 0) {
      console.log(
        JSON.stringify(
          results.violations.map((v) => ({ id: v.id, help: v.help })),
          null,
          2,
        ),
      )
    }
    expect(results.violations).toEqual([])
  })
})

test.describe('reduced motion', () => {
  test('is respected without any interaction when the OS asks for it', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    // With reduced motion the POST sequence is skipped, so the dialog is
    // immediate rather than animated in.
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 })
    await enterSite(page, 'silent')
    await expect(page.getByRole('button', { name: /visual effects are reduced/i }).first()).toBeVisible()
    await context.close()
  })
})
