# CARTRIDGE 4663

> A bootleg game cartridge that boots a stock exchange instead of a game.
> Paired against the **GME stock token** on **Robinhood Chain** (chain ID **4663**).

**It is not GameStop stock.** It grants no shares, dividends, voting rights or ownership,
and this project is not affiliated with or endorsed by GameStop, Robinhood, or anyone else.

---

## What this is

A deliberately maximalist retro-arcade site — CRT scanlines, 1998 dialog boxes, hazard
marquees, an obsessive evidence board — built on top of a **live, read-only Web3 client**
with a strict honesty layer.

The design rule that shapes everything:

> **Decoration is lawless. Information is not.**

The page is loud. The numbers on it are not. A metric that cannot be sourced reads
`NO SIGNAL` and a dash — never a zero, never a placeholder, never an estimate.

### The current state is PRE-LAUNCH, and the site says so

The project's own token does not exist yet. There is no contract, no pool, no price. The
site renders a permanent `PRE-LAUNCH PREVIEW` banner, marks its own config as
`UNCONFIGURED`, and shows `NO SIGNAL` for every unavailable metric — while still proving
the *pairing* is real by reading the Pons V2 factory live in your browser.

---

## Quick start

```bash
npm install
npm run assets        # generate all artwork from source (optional; output is committed)
npm run dev           # http://localhost:5173
```

Production:

```bash
npm run build         # tsc -b && vite build  ->  dist/
npm run preview       # serve dist/ on http://localhost:4173
```

## Configuration

Everything brandable or launch-specific lives in **one file**:
[`src/config/project.config.ts`](src/config/project.config.ts), fed entirely by env vars.

```bash
cp .env.example .env.local
```

> **Nothing in `.env` is a secret.** Every `VITE_*` value is inlined into the public
> bundle. Never put a key with write access or billing exposure there.

### To launch

**See [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) for the full sequence.**

The launch-day change is **one variable**. From `VITE_TOKEN_ADDRESS` the site reads the
Pons V2 launch record and verifies live, in the visitor's browser: that the factory knows
the token, that its pair asset really is the GME stock token, its bonding-curve address,
its graduation threshold, and its lifecycle phase. If any of that fails to match, a red
**LAUNCH VERIFICATION FAILED** banner appears rather than the page quietly continuing to
claim a pairing that does not exist.

| Variable | Set it to |
|---|---|
| `VITE_TOKEN_ADDRESS` | **Your deployed token contract — the only required change** |
| `VITE_PONS_POOL_OR_LAUNCH_ID` | *Optional.* The curve is derived from the factory; set this only to cross-check |
| `VITE_DEX_OR_LAUNCH_URL` | Where TRADE / INSERT COIN should point |
| `VITE_MARKET_DATA_SOURCE` | `chain` |
| `VITE_RPC_URL` | A dedicated provider — **the public RPC is rate-limited and Robinhood's docs say not to use it in production** |
| `VITE_OFFICIAL_X_URL`, `VITE_OFFICIAL_TELEGRAM_URL` | Your links |
| `VITE_SITE_URL` | Your canonical URL (drives OG tags + sitemap) |
| `VITE_BRANDING_FINAL` | `true` once the name/ticker/logo are final |

Until those are set the site stays in its honest pre-launch state. **Unset links render
as disabled controls, never as dead buttons.**

### To rebrand

1. `VITE_PROJECT_NAME`, `VITE_TOKEN_SYMBOL`, `VITE_PROJECT_TAGLINE`.
2. Edit `logoMark()` / `socialCard()` in `scripts/generate-assets.mjs`.
3. `npm run assets && node scripts/rasterize.mjs`.

Content lives in typed modules under `src/config/content/` — navigation, socials, archive
exhibits, high scores, gallery, disclosures. No component needs editing to change copy.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build |
| `npm test` | Unit + component + integration (Vitest) |
| `npm run test:e2e` | End-to-end + visual regression (Playwright) |
| `npm run test:e2e:update` | Refresh visual baselines |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run assets` | Regenerate all artwork from source |
| `npm run verify:pairing` | Re-read every on-chain fact this site claims |

Two extra scripts worth knowing:

```bash
node scripts/check-contrast.mjs   # measured WCAG ratios for the whole palette
node scripts/rasterize.mjs        # SVG -> PNG for the social card and icons
```

---

## Architecture

```
src/
  config/          project.config.ts   ← the only file you edit to rebrand
                   chain.config.ts     ← verified chain + contract constants
                   config-status.ts    ← turns config into auditable checks
                   content/            ← nav, socials, archive, gallery, disclosures
  lib/             address, units (bigint fixed-point), format, data-health, links, prefs, random
  data/            schemas (zod) · abi · adapters/ · queries.ts · mock/
  ui/              primitives: RetroWindow, PixelButton, StatCartridge, ArcadeGauge,
                   ContractCopyField, MemeConveyor, DataStatusBadge, CRTOverlay, …
  sections/        Boot, Nav, Hero, PlayerVersus, PairEvidence, MarketArcade,
                   HowPairing, Archives, Gallery, HighScores, FinalLevel, Footer
  fx/              BackgroundScene (the single rAF loop), useSecretCode
  audio/           audio-engine.ts — WebAudio synthesis, zero audio files
scripts/           asset generation, font fetching, contrast + pairing verification
```

### Three rules the code enforces structurally

1. **Nothing fake can render as real.** `config-status.ts` is the only thing that can emit
   `VERIFIED`, and it only does so after a genuine check. `StatCartridge` renders a value
   only when its `Reading` actually holds one.
2. **Mock data cannot reach production.** `marketDataSource` forces `mock → none` whenever
   `import.meta.env.PROD`. Six tests cover it.
3. **No float maths on token balances.** Everything is `bigint` until the display step.
   ESLint blocks `parseFloat` globally.

---

## Accessibility

Zero axe violations (WCAG 2.1 A + AA) on desktop Chromium and mobile WebKit, across the
page, the boot dialog and the lightbox. Lighthouse accessibility **100**.

- Sound is **off on every visit**, regardless of stored preference. Only a user gesture
  can start audio, and if the browser refuses we say so rather than showing a fake ON.
- `REDUCE FX` collapses all motion; `prefers-reduced-motion` is respected automatically.
- No animation exceeds 2 Hz — well under the photosensitive-seizure threshold.
- Every marquee and the moving gallery are pausable.
- Full keyboard operation, focus trapping and focus restoration on all three dialogs.
- Status is always glyph + word + colour, never colour alone.
- Every control clears 44 px.

## Performance

LCP **127 ms**, CLS **0.00** (Chrome DevTools trace, mobile emulation).

Total transfer ≈ **215 KB gzip**, of which `viem` is 80 KB. The whole art library is
42 KB gzipped; fonts are 52 KB for five self-hosted faces. **Zero third-party requests.**

## Documentation

| Document | Contents |
|---|---|
| [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) | **Launch-day sequence, and the Pons UK geo-block** |
| [`docs/PAIRING_VERIFICATION.md`](docs/PAIRING_VERIFICATION.md) | Every chain fact, the raw RPC response, and the third-party sources that turned out to be wrong |
| [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) | Every metric, its source, and its failure behaviour |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Colour, type, motion, components, and how the reference was translated |
| [`docs/IP_ASSET_AUDIT.md`](docs/IP_ASSET_AUDIT.md) | Every asset and its licence status |
| [`docs/SECURITY_NOTES.md`](docs/SECURITY_NOTES.md) | Threat model, CSP, and the headers to deploy |
| [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) | File-by-file asset inventory |
| [`docs/QA_REPORT.md`](docs/QA_REPORT.md) | Commands, results, and remaining blockers |

## Legal

Not affiliated with, endorsed by or sponsored by GameStop, Robinhood, Nintendo, Sega,
Sony, or any other company named on the site. The project token is not GameStop stock and
is not a security offering. Crypto assets are volatile and may lose all value. Nothing
here is financial advice.

**The disclosure copy in `src/config/content/disclosures.ts` has not been reviewed by a
lawyer.** Do that before launch.
