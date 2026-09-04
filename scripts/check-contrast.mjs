// WCAG 2.1 relative luminance + contrast ratio.
const hex = (h) => { const s = h.replace('#',''); return [0,2,4].map(i => parseInt(s.slice(i,i+2),16)/255) }
const lin = (c) => (c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055) ** 2.4)
const lum = (h) => { const [r,g,b] = hex(h).map(lin); return 0.2126*r + 0.7152*g + 0.0722*b }
const ratio = (a,b) => { const l1=lum(a), l2=lum(b); const [hi,lo] = l1>l2?[l1,l2]:[l2,l1]; return (hi+0.05)/(lo+0.05) }

const surfaces = { '--surface-0 #030303':'#030303', '--surface-1 #0b0b14':'#0b0b14', '--surface-2 #14141f':'#14141f', '--surface-3 #1d1d2b':'#1d1d2b', '--surface-window #101018':'#101018' }
const inks = {
  '--ink-primary   #f4f0dd':'#f4f0dd',
  '--ink-secondary #b9b6a6':'#b9b6a6',
  '--ink-muted     #8a8878':'#8a8878',
  '--status-live   #39ff14':'#39ff14',
  '--status-stale  #ffe600':'#ffe600',
  '--status-error  #ff5b6a':'#ff5b6a',
  '--status-pending#00f5ff':'#00f5ff',
  '--cyan          #00f5ff':'#00f5ff',
  '--magenta       #ff00d4':'#ff00d4',
  '--crt-blue      #071bff':'#071bff',
  '--cartridge     #ff6a00':'#ff6a00',
  '--danger        #ff2134':'#ff2134',
}
const verdict = (r) => r>=7 ? 'AAA ' : r>=4.5 ? 'AA  ' : r>=3 ? 'AA-lg' : 'FAIL'
for (const [sn, sv] of Object.entries(surfaces)) {
  console.log('\n== on ' + sn + ' ==')
  for (const [inkName, inkVal] of Object.entries(inks)) {
    const r = ratio(inkVal, sv)
    console.log(`  ${inkName.padEnd(24)} ${r.toFixed(2).padStart(6)}:1  ${verdict(r)}`)
  }
}
// Button faces: dark text on bright face
console.log('\n== button text on face ==')
const btns = [['coin #ffe600 / #120f00','#120f00','#ffe600'],['danger #ff2134 / #fff5f5','#fff5f5','#ff2134'],['cyan #00f5ff / #001416','#001416','#00f5ff'],['magenta #ff00d4 / #fff0fb','#fff0fb','#ff00d4'],['cart #ff6a00 / #1a0c00','#1a0c00','#ff6a00'],['disabled #3a3a4c / #8f8fa4','#8f8fa4','#3a3a4c']]
for (const [label,fg,bg] of btns) { const r=ratio(fg,bg); console.log(`  ${label.padEnd(30)} ${r.toFixed(2).padStart(6)}:1  ${verdict(r)}`) }
