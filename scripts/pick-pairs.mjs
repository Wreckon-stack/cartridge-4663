const hex=(h)=>{const s=h.replace('#','');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255)}
const lin=(c)=>(c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4)
const lum=(h)=>{const [r,g,b]=hex(h).map(lin);return 0.2126*r+0.7152*g+0.0722*b}
const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);const [hi,lo]=l1>l2?[l1,l2]:[l2,l1];return (hi+0.05)/(lo+0.05)}
const v=(r)=>r>=7?'AAA':r>=4.5?'AA':r>=3?'AA-lg':'FAIL'

console.log('— DANGER face candidates (need >=4.5 for small pixel type) —')
for (const face of ['#ff2134','#e0121f','#c40d19','#ff5b6a']) for (const ink of ['#ffffff','#fff5f5','#1a0004','#000000'])
  console.log(`  face ${face} ink ${ink}  ${ratio(ink,face).toFixed(2)}:1 ${v(ratio(ink,face))}`)

console.log('\n— MAGENTA face candidates —')
for (const face of ['#ff00d4','#d400b0','#ff5be0']) for (const ink of ['#ffffff','#1a0016','#000000'])
  console.log(`  face ${face} ink ${ink}  ${ratio(ink,face).toFixed(2)}:1 ${v(ratio(ink,face))}`)

console.log('\n— DISABLED candidates —')
for (const face of ['#3a3a4c','#2b2b3a']) for (const ink of ['#8f8fa4','#a8a8bd','#b7b7cc'])
  console.log(`  face ${face} ink ${ink}  ${ratio(ink,face).toFixed(2)}:1 ${v(ratio(ink,face))}`)

console.log('\n— TITLEBAR: white on the blue gradient stops —')
for (const bg of ['#0a1cc9','#071bff','#4b2bff'])
  console.log(`  #ffffff on ${bg}  ${ratio('#ffffff',bg).toFixed(2)}:1 ${v(ratio('#ffffff',bg))}`)

console.log('\n— crt-blue as TEXT (why it is banned) —')
console.log(`  #071bff on #030303  ${ratio('#071bff','#030303').toFixed(2)}:1 ${v(ratio('#071bff','#030303'))}`)
console.log('— a usable blue for text instead —')
for (const c of ['#5a6bff','#7c88ff','#8f9aff'])
  console.log(`  ${c} on #030303  ${ratio(c,'#030303').toFixed(2)}:1 ${v(ratio(c,'#030303'))}`)
