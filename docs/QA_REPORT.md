# QA Report

**Date:** 2026-09-04
**Build:** production (`npm run build`), served via `vite preview`
**Browsers:** Chromium 1440×900 (desktop) · WebKit / iPhone 13 (mobile)

Every result below was produced by running the stated command. Nothing is asserted
without having been executed.

---

## 1. Quality gates

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npx tsc -b --force` | ✅ **Pass** — 0 errors, no `@ts-ignore`, no suppressions |
| Lint | `npx eslint .` | ✅ **Pass** — 0 errors, 0 warnings |
| Format | `npx prettier --check` | ✅ **Pass** |
| Unit + component + integration | `npm test` | ✅ **244 passed** / 17 files |
| E2E + visual regression | `npm run test:e2e` | ✅ **86 passed**, 4 skipped (viewport-specific), 0 failed |
| Production build | `npm run build` | ✅ **Pass** — 653 modules, ~156 ms |
| Accessibility (axe) | included in e2e | ✅ **0 violations**, WCAG 2.1 A + AA |
| Lighthouse | Chrome DevTools, mobile | ✅ A11y **100** · SEO **100** · Agentic **100** · Best Practices **96** |

The four skipped E2E tests are the mobile-menu pair (skipped on desktop) and two
desktop-only checks (skipped on mobile). Nothing is skipped on both.

---

## 2. Test coverage by type

**Unit — 105 tests.** Fixed-point arithmetic (`units`), address validation and EIP-55
normalisation, display formatting, link builders and URL-scheme blocking, data-freshness
state machine and error sanitisation, sound/FX preference resolution, configuration status.

**Configuration guard — 19 tests.** Including six that specifically prove mock market
data cannot reach a production build.

**Schema — 21 tests.** Zod validation, including rejection of fractional raw balances,
negative holder counts, and out-of-range progress values.

**Component — 71 tests.** Boot dialog (all four exits, focus movement, scroll lock, no
audio before gesture), toggles, contract copy field (including clipboard failure and the
`execCommand` fallback), data-state rendering, gauge semantics, conveyor + lightbox,
navigation and mobile drawer.

**Integration — 10 tests.** The real Pons adapter and the real viem client with only the
network faked: correct decoding, hook-mismatch detection, un-approved-pair detection,
RPC error, transport failure, and malformed payload.

**E2E — 43 per project.** First visit via all four exits, preference persistence across
reload, every section anchor, no dead controls, honesty guarantees, external-link safety,
layout integrity, console cleanliness, gallery lightbox keyboard operation, secret code,
mini-game, mobile menu.

**Visual regression — 21 baselines.** Nine sections × two viewports, plus the boot dialog
and the mobile menu. Captured with REDUCE FX on; because all decorative scatter uses a
seeded RNG, re-running produces byte-identical output — verified by running the suite
twice with no diff.

---

## 3. Responsive audit

Measured on the production build at every required breakpoint:

| Viewport | H-overflow | Targets < 44px | Images without alt | `<h1>` count |
|---|---|---|---|---|
| 320 × 568 | ✅ none | 0 | 0 | 1 |
| 360 × 800 | ✅ none | 0 | 0 | 1 |
| 390 × 844 | ✅ none | 0 | 0 | 1 |
| 768 × 1024 | ✅ none | 0 | 0 | 1 |
| 1366 × 768 | ✅ none | 0 | 0 | 1 |
| 1440 × 900 | ✅ none | 0 | 0 | 1 |
| 1920 × 1080 | ✅ none | 0 | 0 | 1 |

Screenshots: [`docs/screenshots/`](screenshots/).

---

## 4. Performance

Chrome DevTools trace, mobile emulation, production build:

| Metric | Value | Threshold |
|---|---|---|
| **LCP** | **127 ms** | < 2500 ms ✅ |
| **CLS** | **0.00** | < 0.1 ✅ |
| TTFB | 2 ms | — |

### Bundle

| Chunk | Raw | Gzip |
|---|---|---|
| `web3` (viem) | 263.4 KB | **79.7 KB** |
| `react` | 181.7 KB | 57.2 KB |
| `index` (app) | 177.8 KB | 53.7 KB |
| `query` (TanStack) | 40.5 KB | 12.4 KB |
| CSS | 58.9 KB | 12.6 KB |
| **Total JS + CSS** | | **≈ 216 KB** |

Plus 52 KB of self-hosted fonts and 41 KB (gzipped) of artwork. **Zero third-party
requests.**

`viem` is the heaviest dependency at 80 KB gzipped, used for EIP-55 checksums, ABI
encode/decode and the RPC client. It is code-split into its own chunk. Replacing it with
hand-rolled equivalents would save bandwidth at the cost of correctness in exactly the
place where correctness matters most, so it stays.

---

## 5. Defects found and fixed during QA

These were all found by measurement or by an automated check, not by inspection.

| # | Defect | How found | Fix |
|---|---|---|---|
| 1 | **Disabled buttons rendered as live.** The disabled rule sat before the tone rules at equal specificity, so a disabled `coin` button was bright yellow — a dead control that looked clickable. | Visual review + E2E computed-style assertion | Moved after the tones with `.btn.btn` specificity; E2E now asserts the computed background is the disabled grey, not coin yellow |
| 2 | **CSP broke the whole site over plain HTTP.** `upgrade-insecure-requests` in the meta tag rewrote every asset to `https://`; Chromium exempts localhost, WebKit does not — blank page. | WebKit E2E project | Moved to the production HTTP header, documented in `SECURITY_NOTES.md` |
| 3 | `frame-ancestors` in a meta CSP is ignored and logs a console error | E2E console assertion | Moved to the HTTP header |
| 4 | **Horizontal overflow at 320 px** — a 72 px background sprite scattered at 86% hung past the viewport | Responsive audit | Clamped scatter bounds to account for sprite width; clipped the decorative layer; added `overflow-x: clip` on `html` |
| 5 | **Four identically-named "COPY" buttons** — unusable by voice control or a screen-reader element list | Writing the E2E locator | Accessible name now includes the field label |
| 6 | **Hero kicker at 3.8:1** (white on red at 9 px) | axe | Dark ink on the same red → 5.28:1 |
| 7 | Danger and magenta button labels at 3.56:1 / 3.39:1 | `check-contrast.mjs` | Inverted to dark ink → 5.28:1 / 5.88:1 |
| 8 | `--crt-blue` is 2.56:1 on black | `check-contrast.mjs` | Documented as structural-only; added `--blue-ink` at 6.70:1 |
| 9 | **Sound and FX hidden behind the hamburger on mobile** — contradicts "obvious persistent control" | Mobile E2E failure | Surfaced both in the mobile bar |
| 10 | Pairing diagram scrolled horizontally but was not keyboard-reachable | axe | Made focusable and labelled |
| 11 | SVG disclaimer clipped mid-word ("…votes or owners") | Visual snapshot review | Split across two lines |
| 12 | Step-number badges overlapped their titles | Visual snapshot review | Increased clearance |
| 13 | Tap targets below 44 px (20 at 390 px, 10 at desktop) | Responsive audit | All raised; now 0 at every breakpoint |
| 14 | Ghost button invisible on the light boot-dialog bar | Visual review | Added a `slate` tone for light surfaces |
| 15 | Market tiles laid out 5 + 1 at desktop | Visual review | Explicit 3 × 2 grid |
| 16 | Sprite grids contained Cyrillic look-alike characters and a ragged row, leaving holes in the artwork | Grid validation script | Normalised and re-validated; all grids now rectangular and clean |
| 17 | Posters were ~100 KB each (thousands of `<rect>` elements) | Size measurement | Replaced with SVG `<pattern>` |
| 18 | Two `setState`-in-effect violations and a non-inline `useMemo` | ESLint | Rewritten as lazy initialisers; context extracted to its own module for Fast Refresh |

### Verification defects (research stage)

| Claim | Source | Outcome |
|---|---|---|
| Chain ID hex `0x123F` | secondary summary | ❌ Wrong (= 4671). Chain returns `0x1237`. |
| Pons "active factory" `0xA5aAb3F0…` | third-party almanac | ❌ Dead — 0 logs in ~53 min |
| `TokenLaunched` with 10 parameters | third-party almanac | ❌ Wrong signature — the real event has 6 |

Full detail in [`PAIRING_VERIFICATION.md`](PAIRING_VERIFICATION.md).

---

## 6. Manual checks performed

- ✅ All four boot exits (START GAME, START SILENT, STAY IN LOBBY, Escape) reach the same site
- ✅ Sound is off on load even with `c4663:sound=on` in localStorage
- ✅ Sound toggle reports "BLOCKED BY BROWSER" rather than faking an ON state
- ✅ REDUCE FX persists across reload; OS `prefers-reduced-motion` respected with no interaction
- ✅ Every section anchor resolves; no `href="#"` anywhere
- ✅ Every external link carries `noopener noreferrer`
- ✅ Contract copy works, and reports failure honestly when both clipboard paths fail
- ✅ Lightbox: opens, Escape closes, arrows navigate, focus returns to the trigger
- ✅ Mobile drawer: opens, navigates, closes on Escape, restores focus, locks scroll
- ✅ Secret code (C-A-R-T-4-6-6-3) toggles phosphor mode both ways
- ✅ Mini-game persists nothing to localStorage; disabled entirely under REDUCE FX
- ✅ Live GME pairing data renders in-browser: `YES`, `369 GME`, `147.6 GME`, `MATCH`
- ✅ Pre-launch banner present; all unconfigured values read `UNCONFIGURED` / `NO SIGNAL`

---

## 7. Known warnings (not defects)

| Warning | Assessment |
|---|---|
| Lighthouse Best Practices 96 — "CSP blocks the use of `eval`" | **Not our code.** `grep -c "eval(\|new Function("` across every shipped chunk returns **0**. The issue comes from Lighthouse's own injected instrumentation being correctly blocked by our CSP. Arguably a sign the CSP is working. |
| DevTools: "Lazy-loaded images should have explicit dimensions" (21) | **Spurious.** All 36 lazy images carry `width` and `height` attributes (verified by script), and the measured **CLS is 0.00**. |
| `npm audit` | 0 vulnerabilities |

---

## 8. Blockers before launch

### Must fix

0. **Pons geo-blocks the United Kingdom.** `https://www.ponsfamily.com/launchpad` returns
   **HTTP 403** from a UK connection: *"pons does not operate in OFAC-sanctioned
   jurisdictions or the United Kingdom."* This affects both launching and any UK visitor
   who clicks TRADE / LAUNCH. It is a jurisdictional restriction imposed by the venue, not
   a technical fault, and the response is a legal/commercial decision rather than an
   engineering one. See [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md).
1. **Legal review of disclosure copy.** `src/config/content/disclosures.ts` has not been
   reviewed by a lawyer. The securities and marketing language is the highest-risk part of
   this project and is outside what can be settled in code.
2. **Dedicated RPC provider.** `VITE_RPC_URL` is unset, so the site falls back to the
   public endpoint, which is rate-limited and which Robinhood's own docs say not to use in
   production.
3. **Security headers at the edge.** `frame-ancestors`, `upgrade-insecure-requests`,
   `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` must be set as HTTP
   response headers — a static build cannot set them. Exact header in
   [`SECURITY_NOTES.md`](SECURITY_NOTES.md).

### Awaiting the operator

4. **Final branding** — `VITE_PROJECT_NAME`, `VITE_TOKEN_SYMBOL`, logo, social card.
   `CARTRIDGE 4663` / `CART` are working placeholders, flagged as provisional by
   `config-status.ts` until `VITE_BRANDING_FINAL=true`.
5. **Token address, pool/curve id, and trade URL** — do not exist yet. The site is
   correctly in PRE-LAUNCH until they do.
6. **Social links** — X and Telegram render as disabled controls until configured.
7. **`VITE_SITE_URL`** — currently the placeholder `https://cartridge4663.example`, which
   also appears in `robots.txt` and `sitemap.xml`. Update all three.

### Deliberately not built

- **Wallet connection** — off by default and not wired up. The site is fully functional
  without one, and the brief limits transaction work to verified contracts under explicit
  authorisation. Requirements for adding it are recorded in `SECURITY_NOTES.md`.
- **Volume / 24h change / holder count** — no trustworthy source available. They render
  `NO SIGNAL` rather than being approximated.

---

## 8b. Launch verification (added after initial delivery)

The evidence board originally could only ever report `PENDING` for the project's own
token, because those were config-*shape* checks. That is backwards on launch day, so a
runtime verification layer was added (`src/config/launch-status.ts`, 18 tests).

**Verified end to end against a real, unrelated GME-paired Pons V2 launch already on
chain** (`0xe4a0D07F…7e86`). With only `VITE_TOKEN_ADDRESS` set, the board returned:

```
✓ VERIFIED   CART CONTRACT          0xe4a0D07F2c2cF083cC715333ea0F16fBB7087e86
✓ VERIFIED   GME PAIR CONFIRMED     0x1b0E319c6A659F002271B69dB8A7df2F911c153E
✓ VERIFIED   BONDING CURVE          0x40b66F016e0710eA15007E13F3ed80026Bc97912
✓ VERIFIED   GRADUATION THRESHOLD   369 GME
✓ VERIFIED   LAUNCH PHASE           ON CURVE
```

The curve address was **derived from the factory**, not configured, which is why
`VITE_PONS_POOL_OR_LAUNCH_ID` is now optional.

Two further defects surfaced by that test, both fixed:

| # | Defect | Fix |
|---|---|---|
| 19 | Banner read "CART has not launched" while the board directly beneath it read VERIFIED | Banner now reports SETUP INCOMPLETE and names what is genuinely missing |
| 20 | Board footer said "Pre-launch preview" after launch | Summary now lists unconfigured items without asserting a launch state |

### Known limitation, documented not hidden

Before the first buy, the curve holds the entire supply, so circulating supply is zero and
**price / market cap / FDV read `NO SIGNAL`**. Liquidity correctly shows a real `0 GME`
— a genuine zero, distinct from unknown. Deriving a pre-first-buy spot price would mean
reimplementing the curve's pricing function, which is not in the verified ABI surface, so
it is left honest rather than guessed.

## 9. Reproducing this report

```bash
npm install
npx playwright install chromium webkit

npx tsc -b --force              # typecheck
npx eslint .                    # lint
npm test                        # 226 unit/component/integration tests
npm run test:e2e                # 86 e2e + visual regression tests
npm run build                   # production build

node scripts/check-contrast.mjs # measured WCAG ratios
npm run verify:pairing          # re-read every on-chain claim
```

No development server, preview server, watcher or browser instance was left running.
