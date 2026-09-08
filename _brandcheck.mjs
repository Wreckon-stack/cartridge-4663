import { chromium } from '@playwright/test'
const b = await chromium.launch()
console.log('width  heroLines  heroW/colW  finalLines  docOverflow')
for (const w of [320, 390, 768, 1024, 1440, 1920]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } })
  const page = await ctx.newPage()
  await page.goto('http://localhost:4173/')
  await page.evaluate(() => window.localStorage.setItem('c4663:fx', 'reduced'))
  await page.reload()
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 20000 })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.evaluate(() => document.fonts.ready)
  const r = await page.evaluate(() => {
    const h1 = document.querySelector('h1')
    const cs = getComputedStyle(h1)
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 0.82
    const fm = document.querySelector('[class*="bigMark"]')
    const fcs = fm ? getComputedStyle(fm) : null
    const flh = fcs ? (parseFloat(fcs.lineHeight) || parseFloat(fcs.fontSize) * 0.8) : 1
    return {
      heroLines: Math.round(h1.getBoundingClientRect().height / lh),
      heroW: Math.round(h1.getBoundingClientRect().width),
      colW: Math.round(h1.parentElement.getBoundingClientRect().width),
      finalLines: fm ? Math.round(fm.getBoundingClientRect().height / flh) : 0,
      over: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      text: h1.innerText.replace(/\n/g, ' '),
    }
  })
  console.log(String(w).padEnd(7), String(r.heroLines).padEnd(10), `${r.heroW}/${r.colW}`.padEnd(11), String(r.finalLines).padEnd(11), r.over ? '*** OVERFLOW ***' : 'ok', ' text="' + r.text + '"')
  if (w === 1440) await page.screenshot({ path: 'docs/screenshots/brand-hero-1440.png', clip: { x: 0, y: 0, width: 1440, height: 900 } })
  await ctx.close()
}
await b.close()
