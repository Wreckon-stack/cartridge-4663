/**
 * Rasterises the generated SVG artwork into the PNG/ICO files that platforms
 * demand: OG scrapers largely reject SVG, and iOS ignores SVG touch icons.
 *
 * Run: `node scripts/rasterize.mjs` (after `npm run assets`).
 * Uses the Playwright Chromium that the e2e suite already installs, so this
 * adds no new dependency.
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const jobs = [
  { svg: 'public/art/social-card.svg', out: 'public/social-card.png', width: 1200, height: 630 },
  { svg: 'public/art/logo-mark.svg', out: 'public/apple-touch-icon.png', width: 180, height: 180 },
  { svg: 'public/art/logo-mark.svg', out: 'public/icon-192.png', width: 192, height: 192 },
  { svg: 'public/art/logo-mark.svg', out: 'public/icon-512.png', width: 512, height: 512 },
  { svg: 'public/art/logo-mark.svg', out: 'public/favicon-32.png', width: 32, height: 32 },
]

const browser = await chromium.launch()
try {
  for (const job of jobs) {
    const markup = await fs.readFile(job.svg, 'utf8')
    const page = await browser.newPage({ viewport: { width: job.width, height: job.height } })
    await page.setContent(
      `<!doctype html><meta charset="utf-8">
       <style>
         html,body{margin:0;padding:0;background:#030303}
         svg{display:block;width:${job.width}px;height:${job.height}px;image-rendering:pixelated}
       </style>${markup}`,
      { waitUntil: 'load' },
    )
    await page.screenshot({ path: job.out, type: 'png' })
    await page.close()
    const { size } = await fs.stat(job.out)
    console.log(`${path.basename(job.out).padEnd(24)} ${job.width}x${job.height}  ${(size / 1024).toFixed(1)} KB`)
  }
} finally {
  await browser.close()
}
