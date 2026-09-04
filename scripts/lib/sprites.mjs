/**
 * Original pixel sprites, authored as character grids.
 *
 * Every sprite in this file was drawn for this project. Nothing is traced from,
 * derived from, or sampled out of any existing game, console UI, or franchise
 * artwork. The characters are generic archetypes — a player, a suited market
 * creature, an arcade attendant — with no resemblance to protected characters.
 *
 * Each grid maps single characters to colours via its own palette, so a sprite
 * can be recoloured without redrawing it.
 */

/** Convert a grid + palette into SVG rects. Adjacent same-colour cells in a row
 *  are merged into one rect, which roughly halves the output size. */
export function spriteSvg(grid, palette, { scale = 1, x = 0, y = 0 } = {}) {
  const parts = []
  grid.forEach((row, rowIndex) => {
    let runStart = -1
    let runKey = null
    const flush = (endExclusive) => {
      if (runStart < 0 || runKey == null) return
      const fill = palette[runKey]
      if (fill) {
        parts.push(
          `<rect x="${x + runStart * scale}" y="${y + rowIndex * scale}" width="${(endExclusive - runStart) * scale}" height="${scale}" fill="${fill}"/>`,
        )
      }
      runStart = -1
      runKey = null
    }
    for (let col = 0; col <= row.length; col += 1) {
      const key = col < row.length ? row[col] : null
      if (key !== runKey) {
        flush(col)
        if (key && key !== '.' && palette[key]) {
          runStart = col
          runKey = key
        }
      }
    }
    flush(row.length)
  })
  return parts.join('')
}

export function spriteSize(grid) {
  return { width: Math.max(...grid.map((r) => r.length)), height: grid.length }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PLAYER ONE — a hooded arcade kid clutching a cartridge.
   16 wide x 20 tall.
   ═══════════════════════════════════════════════════════════════════════════ */
export const PLAYER_ONE = {
  palette: {
    o: '#000000', // outline
    s: '#f0c69a', // skin
    h: '#00f5ff', // hood
    d: '#0090a8', // hood shadow
    e: '#030303', // eye
    j: '#ff6a00', // jacket
    k: '#a33f00', // jacket shadow
    c: '#ffe600', // cartridge
    p: '#39ff14', // cartridge label
    t: '#12121f', // trousers
  },
  grid: [
    '....oooooo......',
    '...ohhhhhho.....',
    '..ohhhhhhhho....',
    '..ohdddddhho....',
    '..ohsssssdho....',
    '..ohseseshho....',
    '..ohsssssdho....',
    '...osssssdo.....',
    '....ossssso.....',
    '...ojjjjjjjo....',
    '..ojjjjjjjjjo...',
    '.ojjjkjjjkjjjo..',
    '.ojjjkjjjkjjjo..',
    '.osjjkjjjkjjso..',
    '.oscccccccccso..',
    '..occpppppcco...',
    '..occcccccco....',
    '...ottttttto....',
    '...ottt.ttto....',
    '...ooo...ooo....',
  ],
}

/* ═══════════════════════════════════════════════════════════════════════════
   MARKET BOSS — a suited figure whose head is a candlestick chart.
   20 wide x 22 tall. The final-boss silhouette of the whole site.
   ═══════════════════════════════════════════════════════════════════════════ */
export const MARKET_BOSS = {
  palette: {
    o: '#000000', // outline
    r: '#ff2134', // down candle
    g: '#39ff14', // up candle
    w: '#f4f0dd', // wick / shirt
    c: '#0b0b14', // screen interior
    s: '#2a2a40', // suit
    b: '#14141f', // suit shadow
    t: '#ff00d4', // tie
    y: '#ffe600', // eye glow
  },
  grid: [
    '..oooooooooooooooooo..',
    '..occcccccccccccccco..',
    '..occcrrccccccggccco..',
    '..occcrrccggccggccco..',
    '..occyrrccggccggycco..',
    '..occyrrggggccgggyco..',
    '..occcrrggggrrgggcco..',
    '..occcrrccggrrggccco..',
    '..occccccccgrrccccco..',
    '..occcccccccccccccco..',
    '..oooooooooooooooooo..',
    '.......oo....oo.......',
    '.......ow....wo.......',
    '....oooooooooooooo....',
    '...osssswwwwwwsssso...',
    '..obssssswwttwsssssbo.',
    '..obsssssswttwssssbo..',
    '..obsssssswttwsssssbo.',
    '..obsssssswttwssssbo..',
    '..obssssssswwsssssbo..',
    '..obsssssssssssssbo...',
    '..obsso.......ossbo...',
    '..oooo.........oooo...',
    '..oooo.........oooo...',
  ],
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE ATTENDANT — arcade referee holding a whistle. The "witness" figure in
   the three-column comparison.
   16 wide x 20 tall.
   ═══════════════════════════════════════════════════════════════════════════ */
export const ATTENDANT = {
  palette: {
    o: '#000000',
    s: '#c88a5a', // skin
    c: '#f4f0dd', // cap / stripes
    k: '#1d1d2b', // stripes dark
    e: '#030303',
    v: '#ff00d4', // visor
    w: '#ffe600', // whistle
    t: '#12121f',
  },
  grid: [
    '....oooooo......',
    '...occcccco.....',
    '..occcccccco....',
    '..ovvvvvvvvo....',
    '..osssssssso....',
    '..oseossoeso....',
    '..osssssssso....',
    '...osssssso.....',
    '....osssso......',
    '...ockckcko.....',
    '..ockckckcko....',
    '.ockckckckcko...',
    '.ockckckckcko...',
    '.oskckckckckso..',
    '.osckckckckcso..',
    '..owckckckcko...',
    '..ocwckckckco...',
    '...ottttttto....',
    '...ottt.ttto....',
    '...ooo...ooo....',
  ],
}

/* ═══════════════════════════════════════════════════════════════════════════
   COIN — the falling token used in the background scatter. 9x9.
   ═══════════════════════════════════════════════════════════════════════════ */
export const COIN = {
  palette: { o: '#000000', y: '#ffe600', h: '#fff8a8', d: '#a38a00' },
  grid: [
    '..ooooo..',
    '.oyyyyyo.',
    'oyhyyydyo',
    'oyhyoyydo',
    'oyhyoyydo',
    'oyhyoyydo',
    'oyhyyyddo',
    '.oyddddo.',
    '..ooooo..',
  ],
}

/* ═══════════════════════════════════════════════════════════════════════════
   MINI CARTRIDGE — the floating decoration. 12x10.
   ═══════════════════════════════════════════════════════════════════════════ */
export const MINI_CART = {
  palette: { o: '#000000', s: '#ff6a00', d: '#a33f00', l: '#00f5ff', p: '#030303' },
  grid: [
    'oooooooooooo',
    'osssssssssdo',
    'osllllllllso',
    'osllllllllso',
    'osllllllllso',
    'osssssssssso',
    'osdsdsdsdsso',
    'osssssssssso',
    'op.p.p.p.pso',
    'oooooooooooo',
  ],
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKULL FLOPPY — decorative "corrupted save" glyph. 11x11.
   ═══════════════════════════════════════════════════════════════════════════ */
export const CORRUPT_SAVE = {
  palette: { o: '#000000', p: '#f4f0dd', m: '#ff00d4', d: '#6e6e66' },
  grid: [
    'ooooooooooo',
    'opppppppppo',
    'opommmmmopo',
    'opomm.mmopo',
    'opommmmmopo',
    'opppppppppo',
    'opdddddddpo',
    'opdmmmmmdpo',
    'opdddddddpo',
    'opppppppppo',
    'ooooooooooo',
  ],
}
