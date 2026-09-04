import fs from 'node:fs/promises'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const families = [
  { file: 'press-start-2p', query: 'Press+Start+2P', weights: [400] },
  { file: 'vt323', query: 'VT323', weights: [400] },
  { file: 'anton', query: 'Anton', weights: [400] },
  { file: 'ibm-plex-mono', query: 'IBM+Plex+Mono', weights: [400, 600] },
]
const out = []
for (const fam of families) {
  const url = `https://fonts.googleapis.com/css2?family=${fam.query}:wght@${fam.weights.join(';')}&display=swap`
  const css = await fetch(url, { headers: { 'user-agent': UA } }).then((r) => r.text())
  const blocks = css.split('@font-face').slice(1)
  for (const block of blocks) {
    const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1] ?? ''
    // The latin subset is the block that covers basic ASCII (U+0000-00FF).
    if (!range.includes('U+0000-00FF')) continue
    const weight = Number(/font-weight:\s*(\d+)/.exec(block)?.[1] ?? '400')
    const src = /src:\s*url\((https:\/\/[^)]+\.woff2)\)/.exec(block)?.[1]
    if (!src) continue
    const name = `${fam.file}-${weight}.woff2`
    const buf = Buffer.from(await fetch(src, { headers: { 'user-agent': UA } }).then((r) => r.arrayBuffer()))
    await fs.writeFile(`public/fonts/${name}`, buf)
    out.push({ name, weight, bytes: buf.length, source: src })
  }
}
console.table(out.map((o) => ({ file: o.name, weight: o.weight, kb: (o.bytes / 1024).toFixed(1) })))
await fs.writeFile('public/fonts/SOURCES.json', JSON.stringify(out, null, 2))
