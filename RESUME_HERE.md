# Resume here

Last worked: **2026-09-04**. Everything is committed and deployed.

---

## Where it stands

The site is **finished and live**, sitting in an honest PRE-LAUNCH state because the token
does not exist yet.

**🔗 Live:** https://cartridge-4663.vercel.app (public, no login)
Vercel project: `wreckon-stacks-projects/cartridge-4663`

| Gate | State |
|---|---|
| Unit / component / integration | 256 passing |
| E2E + visual regression | 90 passing (Chromium + WebKit) |
| TypeScript / ESLint / build | clean, no suppressions |
| axe WCAG 2.1 AA | 0 violations |
| Lighthouse | A11y 100 · SEO 100 · Best Practices 96 |
| LCP / CLS | 127 ms / 0.00 |

---

## Pick up where you left off

```bash
cd "~/Desktop/GME STOCKS"
npm install          # if node_modules is gone
npm run dev          # http://localhost:5173
```

Everything else: `npm test`, `npm run test:e2e`, `npm run build`, `npm run verify:pairing`.

---

## The only thing that changes on launch day

```bash
VITE_TOKEN_ADDRESS="0xYourToken"
```

From that one value the site reads the Pons V2 launch record and verifies **live in the
visitor's browser**: that the factory knows the token, that its pair asset really is the
GME stock token, its bonding-curve address, its graduation threshold, and its phase.

Get it wrong and you get a red **LAUNCH VERIFICATION FAILED** banner rather than a page
quietly claiming a pairing that isn't there.

`VITE_PONS_POOL_OR_LAUNCH_ID` is **optional** — the curve is derived from the factory.

Full sequence: [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md).

---

## 👉 Tomorrow's plan

**[`TODO.md`](TODO.md)** — ordered by what blocks what, with the two answers I need from
you first thing. Start there.

---

## Open items (nothing is broken — these are decisions and inputs)

### Needs your decision
1. **Pons returns HTTP 403 to the United Kingdom.** *"pons does not operate in
   OFAC-sanctioned jurisdictions or the United Kingdom."* Affects you launching and any UK
   visitor clicking TRADE. Legal/commercial call, not a technical one.
2. **Legal review** of `src/config/content/disclosures.ts`. Not reviewed by a lawyer.

### Needs a value from you
3. `VITE_RPC_URL` — a dedicated provider. The public endpoint is rate-limited and
   Robinhood's docs say not to use it in production. Every visitor's browser hits it.
4. `VITE_TOKEN_ADDRESS`, `VITE_DEX_OR_LAUNCH_URL`, `VITE_OFFICIAL_X_URL`,
   `VITE_OFFICIAL_TELEGRAM_URL`.
5. `VITE_SITE_URL` — currently the placeholder `https://cartridge4663.example`. Also
   appears in `public/robots.txt` and `public/sitemap.xml`; update all three.
6. Final branding — `CARTRIDGE 4663` / `CART` are working placeholders. Set
   `VITE_PROJECT_NAME`, `VITE_TOKEN_SYMBOL`, regenerate art
   (`npm run assets && node scripts/rasterize.mjs`), then `VITE_BRANDING_FINAL=true`.

### Deliberately not built
- **Wallet connection** — off by default; site fully works without one.
- **24h volume / 24h change / holder count** — no trustworthy source, so they render
  `NO SIGNAL` rather than being approximated. Needs a real indexer adapter.

---

## Verified chain facts (re-check with `npm run verify:pairing`)

| Fact | Value |
|---|---|
| Chain ID | `4663` (`0x1237`) |
| GME stock token | `0x1b0E319c6A659F002271B69dB8A7df2F911c153E` |
| Pons V2 factory | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` |
| `approvedPairTokens(GME)` | `true` |
| Graduation threshold | **369 GME** |

Full evidence and the third-party sources that turned out to be wrong:
[`docs/PAIRING_VERIFICATION.md`](docs/PAIRING_VERIFICATION.md).

---

## Last three changes made

1. **Launch verification layer** — the evidence board can now reach VERIFIED from live
   chain data instead of being stuck on PENDING. Proven end-to-end against a real
   GME-paired Pons launch already on chain.
2. **Wordmark wrap fix** — Anton is ~1.5× narrower than the system fallback, so
   "CARTRIDGE" dropped its E during font load. Fixed with metric-matched `size-adjust`
   fallbacks, `nowrap`, and container-relative sizing. Two regression tests guard it.
3. **Removed the red hazard marquee** above the nav, at your request. The "not GameStop
   stock" disclosure still appears in six other places — verified on the rendered page.

---

## Docs

| File | What it answers |
|---|---|
| `docs/LAUNCH_CHECKLIST.md` | Launch-day sequence + the Pons UK block |
| `docs/PAIRING_VERIFICATION.md` | Every chain fact and its raw RPC response |
| `docs/DATA_SOURCES.md` | Every metric, its source, its failure behaviour |
| `docs/DESIGN_SYSTEM.md` | Colour, type, motion, components |
| `docs/SECURITY_NOTES.md` | Threat model, CSP, headers |
| `docs/IP_ASSET_AUDIT.md` | Every asset and its licence |
| `docs/QA_REPORT.md` | Commands, results, 20 defects found and fixed |
| `docs/ASSET_MANIFEST.md` | File-by-file asset inventory |
