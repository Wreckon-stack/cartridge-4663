/**
 * Generates every piece of artwork the site ships.
 *
 * Run: `npm run assets`
 *
 * Everything is composed from the hand-authored pixel font and sprite grids in
 * ./lib, so the output is 100% original and fully reproducible — there is no
 * binary artwork checked in that cannot be regenerated from source. Output goes
 * to public/art/ and is listed in docs/ASSET_MANIFEST.md.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { textSvg, textWidth } from './lib/pixel-font.mjs'
import {
  spriteSvg,
  spriteSize,
  PLAYER_ONE,
  MARKET_BOSS,
  ATTENDANT,
  COIN,
  MINI_CART,
  CORRUPT_SAVE,
} from './lib/sprites.mjs'

const OUT = 'public/art'

/*
 * Branding, read from the same environment variables the app uses so the
 * artwork can never drift from the site copy. Run `npm run assets` after
 * changing either value.
 *
 * SERIAL is deliberately NOT the project name: 4663 is the Robinhood Chain ID,
 * and the whole conceit is that the cartridge's serial number is the network it
 * runs on. It stays put through a rename.
 */
const NAME = (process.env.VITE_PROJECT_NAME || 'CARTRIDGE').toUpperCase()
const SYMBOL = (process.env.VITE_TOKEN_SYMBOL || 'CART').toUpperCase()
const SERIAL = '4663'

/**
 * Largest integer pixel scale at which `text` fits inside `maxWidth`.
 * Keeps generated lettering inside its plate no matter how the brand is renamed
 * — the same failure the CSS wordmark fix addresses, in the asset pipeline.
 */
function fitScale(text, maxWidth, maxScale) {
  for (let scale = maxScale; scale > 1; scale -= 1) {
    if (textWidth(text) * scale <= maxWidth) return scale
  }
  return 1
}

const C = {
  void: '#030303',
  void2: '#0a0a12',
  blue: '#071bff',
  cyan: '#00f5ff',
  magenta: '#ff00d4',
  acid: '#39ff14',
  danger: '#ff2134',
  coin: '#ffe600',
  cart: '#ff6a00',
  paper: '#f4f0dd',
  ink: '#000000',
}

const svg = (w, h, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges"${extra}>${body}</svg>\n`

/** Centre pixel text horizontally inside `width`. */
function centredText(text, { y, scale, fill, width, letterSpacing = 1 }) {
  const w = textWidth(text, { letterSpacing }) * scale
  return textSvg(text, { x: Math.round((width - w) / 2), y, scale, fill, letterSpacing })
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. THE CARTRIDGE — the hero focal object.
   ═══════════════════════════════════════════════════════════════════════════ */
function cartridgeHero() {
  const W = 260
  const H = 300
  const p = []

  // Drop shadow
  p.push(`<rect x="18" y="18" width="228" height="268" fill="#000" opacity="0.65"/>`)

  // Shell body
  p.push(`<rect x="10" y="10" width="228" height="268" fill="${C.ink}"/>`)
  p.push(`<rect x="16" y="16" width="216" height="256" fill="${C.cart}"/>`)
  // Bevel highlight / shadow
  p.push(`<rect x="16" y="16" width="216" height="6" fill="#ffa257"/>`)
  p.push(`<rect x="16" y="16" width="6" height="256" fill="#ffa257"/>`)
  p.push(`<rect x="16" y="266" width="216" height="6" fill="#a33f00"/>`)
  p.push(`<rect x="226" y="16" width="6" height="256" fill="#a33f00"/>`)

  // Grip ridges across the top
  for (let i = 0; i < 9; i += 1) {
    p.push(`<rect x="${34 + i * 20}" y="28" width="10" height="18" fill="#a33f00"/>`)
    p.push(`<rect x="${34 + i * 20}" y="28" width="10" height="4" fill="#7a2f00"/>`)
  }

  // Label plate
  p.push(`<rect x="30" y="60" width="188" height="150" fill="${C.ink}"/>`)
  p.push(`<rect x="36" y="66" width="176" height="138" fill="${C.void}"/>`)
  p.push(`<rect x="36" y="66" width="176" height="138" fill="none" stroke="${C.cyan}" stroke-width="3"/>`)

  // Label artwork: a starfield with a rising candle
  const stars = [
    [52, 82],
    [88, 76],
    [128, 90],
    [176, 78],
    [196, 96],
    [60, 118],
    [200, 130],
    [46, 150],
  ]
  for (const [sx, sy] of stars) p.push(`<rect x="${sx}" y="${sy}" width="3" height="3" fill="${C.paper}"/>`)

  // Candlesticks climbing to the right
  const candles = [
    [64, 168, 18, C.danger],
    [84, 156, 30, C.acid],
    [104, 140, 46, C.acid],
    [124, 150, 36, C.danger],
    [144, 122, 64, C.acid],
    [164, 106, 80, C.acid],
  ]
  for (const [cx, cy, ch, fill] of candles) {
    p.push(`<rect x="${cx + 5}" y="${cy - 8}" width="2" height="${ch + 14}" fill="${C.paper}"/>`)
    p.push(`<rect x="${cx}" y="${cy}" width="12" height="${ch}" fill="${fill}"/>`)
    p.push(`<rect x="${cx}" y="${cy}" width="12" height="${ch}" fill="none" stroke="${C.ink}" stroke-width="2"/>`)
  }

  // Label lettering
  p.push(centredText(NAME, { y: 74, scale: fitScale(NAME, W - 48, 3), fill: C.coin, width: W }))
  p.push(centredText(SERIAL, { y: 176, scale: 5, fill: C.magenta, width: W }))

  // "GME LINK" sticker, rotated, over the corner
  p.push(
    `<g transform="rotate(-8 60 232)"><rect x="26" y="218" width="112" height="28" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>${textSvg(
      'GME LINK',
      { x: 34, y: 226, scale: 2, fill: C.ink },
    )}</g>`,
  )

  // Serial strip
  p.push(`<rect x="150" y="220" width="76" height="22" fill="${C.void2}" stroke="${C.ink}" stroke-width="2"/>`)
  p.push(textSvg('NO PUB', { x: 156, y: 226, scale: 1.6, fill: C.acid }))

  // Connector pins along the bottom
  p.push(`<rect x="34" y="272" width="180" height="18" fill="${C.ink}"/>`)
  for (let i = 0; i < 15; i += 1) {
    p.push(`<rect x="${40 + i * 12}" y="276" width="7" height="12" fill="${C.coin}"/>`)
  }

  return svg(W, H, p.join(''))
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. LOGO MARK — square emblem for favicon / avatar use.
   ═══════════════════════════════════════════════════════════════════════════ */
function logoMark() {
  const S = 64
  const p = []
  p.push(`<rect width="${S}" height="${S}" fill="${C.void}"/>`)
  p.push(`<rect x="2" y="2" width="${S - 4}" height="${S - 4}" fill="none" stroke="${C.magenta}" stroke-width="2"/>`)
  // Mini cartridge silhouette
  p.push(`<rect x="12" y="10" width="40" height="44" fill="${C.ink}"/>`)
  p.push(`<rect x="15" y="13" width="34" height="38" fill="${C.cart}"/>`)
  p.push(`<rect x="19" y="18" width="26" height="20" fill="${C.void}"/>`)
  p.push(`<rect x="19" y="18" width="26" height="20" fill="none" stroke="${C.cyan}" stroke-width="2"/>`)
  p.push(textSvg('46', { x: 21, y: 22, scale: 2, fill: C.coin }))
  // Connector pins
  for (let i = 0; i < 5; i += 1) p.push(`<rect x="${19 + i * 6}" y="44" width="4" height="7" fill="${C.coin}"/>`)
  return svg(S, S, p.join(''))
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. CHARACTER SPRITES — exported individually for use in the page.
   ═══════════════════════════════════════════════════════════════════════════ */
function spriteFile(sprite, scale = 8) {
  const { width, height } = spriteSize(sprite.grid)
  return svg(width * scale, height * scale, spriteSvg(sprite.grid, sprite.palette, { scale }))
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. CONVEYOR POSTERS — original bootleg-cover artwork.
   ═══════════════════════════════════════════════════════════════════════════ */
const POSTERS = [
  { id: 'found-in-a-dead-mall', head: ['FOUND IN A', 'DEAD MALL'], kicker: 'EXHIBIT 01', bg: C.blue, accent: C.coin, sprite: PLAYER_ONE, alt: 'Bootleg cartridge cover reading FOUND IN A DEAD MALL, with a hooded pixel figure holding a cartridge.' },
  { id: 'no-publisher', head: ['NO', 'PUBLISHER'], kicker: 'UNLICENSED', bg: C.danger, accent: C.paper, sprite: CORRUPT_SAVE, alt: 'Cover reading NO PUBLISHER with a corrupted save-file glyph.' },
  { id: 'market-boss', head: ['MARKET', 'BOSS'], kicker: 'FINAL LEVEL', bg: C.void2, accent: C.magenta, sprite: MARKET_BOSS, alt: 'Cover reading MARKET BOSS showing a suited figure whose head is a candlestick chart.' },
  { id: 'insert-coin', head: ['INSERT', 'COIN'], kicker: `$${SYMBOL}`, bg: C.magenta, accent: C.coin, sprite: COIN, alt: `Cover reading INSERT COIN with a large pixel coin, labelled $${SYMBOL}.` },
  { id: 'quote-asset', head: ['QUOTED', 'IN GME'], kicker: 'PAIR ONLINE', bg: C.acid, accent: C.ink, sprite: MINI_CART, alt: 'Cover reading QUOTED IN GME with a small cartridge.' },
  { id: 'attendant', head: ['THE', 'ATTENDANT'], kicker: 'WITNESS', bg: C.cyan, accent: C.ink, sprite: ATTENDANT, alt: 'Cover reading THE ATTENDANT showing a striped arcade referee.' },
  { id: 'threshold-369', head: ['369', 'TO CLEAR'], kicker: 'GRADUATION', bg: C.cart, accent: C.void, sprite: COIN, alt: 'Cover reading 369 TO CLEAR, referencing the graduation threshold.' },
  { id: 'not-a-share', head: ['NOT A', 'SHARE'], kicker: 'READ THIS', bg: C.coin, accent: C.ink, sprite: CORRUPT_SAVE, alt: 'Cover reading NOT A SHARE, a reminder that the token is not equity.' },
  { id: 'chain-4663', head: ['CHAIN', SERIAL], kicker: 'ROBINHOOD', bg: C.blue, accent: C.cyan, sprite: MINI_CART, alt: `Cover reading CHAIN ${SERIAL} with a cartridge motif.` },
  { id: 'no-game-over', head: ['NO GAME', 'OVER'], kicker: 'CONTINUE?', bg: C.void, accent: C.acid, sprite: PLAYER_ONE, alt: 'Cover reading NO GAME OVER with a pixel figure.' },
]

function poster({ head, kicker, bg, accent, sprite }) {
  const W = 320
  const H = 400
  const p = []
  p.push(`<rect width="${W}" height="${H}" fill="${bg}"/>`)
  // Halftone print texture. A <pattern> rather than a few thousand <rect>s —
  // the naive version made every poster ~100KB.
  p.push(
    `<defs><pattern id="halftone" width="12" height="24" patternUnits="userSpaceOnUse">` +
      `<rect x="0" y="0" width="2" height="2" fill="${C.ink}" opacity="0.18"/>` +
      `<rect x="6" y="12" width="2" height="2" fill="${C.ink}" opacity="0.18"/>` +
      `</pattern></defs>`,
  )
  p.push(`<rect width="${W}" height="${H}" fill="url(#halftone)"/>`)
  // Border
  p.push(`<rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="${C.ink}" stroke-width="6"/>`)
  p.push(`<rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="${accent}" stroke-width="2"/>`)

  // Kicker bar
  p.push(`<rect x="16" y="26" width="${W - 32}" height="26" fill="${C.ink}"/>`)
  p.push(textSvg(kicker, { x: 26, y: 33, scale: 2, fill: accent }))

  // Sprite panel
  const { width: sw, height: sh } = spriteSize(sprite.grid)
  const scale = Math.floor(Math.min(180 / sw, 150 / sh))
  const sx = Math.round((W - sw * scale) / 2)
  p.push(`<rect x="40" y="70" width="${W - 80}" height="170" fill="${C.void}" stroke="${C.ink}" stroke-width="4"/>`)
  p.push(spriteSvg(sprite.grid, sprite.palette, { scale, x: sx, y: Math.round(155 - (sh * scale) / 2) }))

  // Headline
  head.forEach((line, index) => {
    p.push(centredText(line, { y: 264 + index * 42, scale: 5, fill: C.ink, width: W }))
    p.push(centredText(line, { y: 261 + index * 42, scale: 5, fill: accent, width: W }))
  })

  // Footer strip
  p.push(`<rect x="16" y="${H - 44}" width="${W - 32}" height="20" fill="${C.ink}"/>`)
  p.push(textSvg(`${NAME} · ${SERIAL}`, { x: 26, y: `${H - 39}`, scale: 1.6, fill: accent }))
  return svg(W, H, p.join(''))
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. SOCIAL CARD — 1200x630.
   ═══════════════════════════════════════════════════════════════════════════ */
function socialCard() {
  const W = 1200
  const H = 630
  const p = []
  p.push(`<rect width="${W}" height="${H}" fill="${C.void}"/>`)
  // Scanlines, as a tiling pattern rather than 157 rects.
  p.push(
    `<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">` +
      `<rect width="4" height="1" fill="#ffffff" opacity="0.05"/></pattern></defs>`,
  )
  p.push(`<rect width="${W}" height="${H}" fill="url(#scan)"/>`)
  // Grid horizon
  for (let i = 0; i <= 20; i += 1) {
    p.push(`<line x1="${i * 60}" y1="${H}" x2="${600}" y2="430" stroke="${C.blue}" stroke-width="2" opacity="0.5"/>`)
  }
  for (let i = 0; i < 7; i += 1) {
    const y = 440 + i * i * 4.6
    p.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.blue}" stroke-width="2" opacity="0.5"/>`)
  }
  // Border
  p.push(`<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${C.magenta}" stroke-width="5"/>`)

  // Cartridge on the right
  p.push(`<g transform="translate(790 130) scale(1.35)">`)
  p.push(`<rect x="0" y="0" width="200" height="240" fill="${C.ink}"/>`)
  p.push(`<rect x="6" y="6" width="188" height="228" fill="${C.cart}"/>`)
  p.push(`<rect x="20" y="42" width="160" height="120" fill="${C.void}" stroke="${C.cyan}" stroke-width="3"/>`)
  // Keep the lettering inside the 160-wide label plate: 4 glyphs at 6 cells
  // advance = 23 cells, so scale 5.5 -> 126px starting at x=46.
  p.push(textSvg(SERIAL, { x: 46, y: 80, scale: 5.5, fill: C.coin }))
  for (let i = 0; i < 6; i += 1) p.push(`<rect x="${28 + i * 26}" y="18" width="14" height="16" fill="#a33f00"/>`)
  for (let i = 0; i < 12; i += 1) p.push(`<rect x="${26 + i * 13}" y="228" width="8" height="14" fill="${C.coin}"/>`)
  p.push(`</g>`)

  // Wordmark. The cartridge illustration starts at x=790, so the text has
  // 690px of runway from x=70; fitScale keeps it clear of the art.
  p.push(textSvg(NAME, { x: 70, y: 140, scale: fitScale(NAME, 690, 11), fill: C.coin }))
  p.push(textSvg(SERIAL, { x: 70, y: 240, scale: fitScale(SERIAL, 690, 15), fill: C.magenta }))

  // Pair strip
  p.push(`<rect x="70" y="350" width="620" height="58" fill="${C.acid}"/>`)
  p.push(textSvg('PAIRED WITH THE GME STOCK TOKEN', { x: 86, y: 368, scale: 3, fill: C.ink }))

  // Chain strip
  p.push(`<rect x="70" y="424" width="420" height="46" fill="${C.void2}" stroke="${C.cyan}" stroke-width="3"/>`)
  p.push(textSvg(`ROBINHOOD CHAIN ${SERIAL}`, { x: 86, y: 438, scale: 2.6, fill: C.cyan }))

  // Disclaimer
  p.push(textSvg('NOT GAMESTOP STOCK. NOT AFFILIATED.', { x: 70, y: 508, scale: 2, fill: C.paper }))
  p.push(textSvg('NO PUBLISHER. NO BOX. NO REFUNDS.', { x: 70, y: 548, scale: 2, fill: '#8a8878' }))
  return svg(W, H, p.join(''))
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. BOOT SCREEN BACKDROP — the arcade skyline used behind the manifesto.
   ═══════════════════════════════════════════════════════════════════════════ */
function skyline() {
  const W = 1600
  const H = 360
  const p = []
  p.push(`<rect width="${W}" height="${H}" fill="none"/>`)
  // Deterministic building strip: no Math.random, so it renders identically
  // every time and visual snapshots stay stable.
  let seed = 20260904
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  let x = 0
  while (x < W) {
    const w = 40 + Math.floor(rand() * 70)
    const h = 90 + Math.floor(rand() * 230)
    const y = H - h
    p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#07070f"/>`)
    p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.blue}" stroke-width="2" opacity="0.7"/>`)
    // Lit windows
    for (let wy = y + 12; wy < H - 14; wy += 18) {
      for (let wx = x + 8; wx < x + w - 10; wx += 16) {
        if (rand() > 0.55) {
          const lit = rand()
          const fill = lit > 0.82 ? C.magenta : lit > 0.6 ? C.coin : C.cyan
          p.push(`<rect x="${wx}" y="${wy}" width="6" height="8" fill="${fill}" opacity="0.85"/>`)
        }
      }
    }
    x += w + 6
  }
  return svg(W, H, p.join(''), ' preserveAspectRatio="xMidYMax slice"')
}

/* ═══════════════════════════════════════════════════════════════════════════
   WRITE EVERYTHING
   ═══════════════════════════════════════════════════════════════════════════ */
async function main() {
  await fs.mkdir(OUT, { recursive: true })
  const written = []
  const write = async (name, contents) => {
    await fs.writeFile(path.join(OUT, name), contents)
    written.push({ file: `art/${name}`, bytes: Buffer.byteLength(contents) })
  }

  await write('cartridge-hero.svg', cartridgeHero())
  await write('logo-mark.svg', logoMark())
  await write('player-one.svg', spriteFile(PLAYER_ONE))
  await write('market-boss.svg', spriteFile(MARKET_BOSS))
  await write('attendant.svg', spriteFile(ATTENDANT))
  await write('coin.svg', spriteFile(COIN, 6))
  await write('mini-cart.svg', spriteFile(MINI_CART, 6))
  await write('corrupt-save.svg', spriteFile(CORRUPT_SAVE, 6))
  await write('skyline.svg', skyline())
  await write('social-card.svg', socialCard())

  for (const spec of POSTERS) await write(`poster-${spec.id}.svg`, poster(spec))

  // Emit the gallery manifest so the app and the docs cannot drift apart.
  const manifest = POSTERS.map((spec) => ({
    id: spec.id,
    src: `/art/poster-${spec.id}.svg`,
    title: spec.head.join(' '),
    kicker: spec.kicker,
    alt: spec.alt,
    width: 320,
    height: 400,
  }))
  await fs.writeFile('src/config/content/gallery.generated.json', JSON.stringify(manifest, null, 2) + '\n')

  console.table(written.map((w) => ({ file: w.file, kb: (w.bytes / 1024).toFixed(1) })))
  console.log(`\n${written.length} files -> ${OUT}`)
  console.log(`gallery manifest -> src/config/content/gallery.generated.json (${manifest.length} posters)`)
}

await main()
