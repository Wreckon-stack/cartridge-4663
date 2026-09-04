# Design System

## The governing rule

> **Decoration is lawless. Information is not.**

The whole system follows from that one sentence. Two parallel colour scales exist so the
distinction is structural rather than a matter of taste:

- `--neon-*` — scenery. Saturated, allowed to clash, never load-bearing.
- `--ink-*` — anything a person actually has to read. Contrast-checked, boring on purpose.

A value in the market dashboard is rendered in `--ink-primary`, never in a neon hue. The
neon appears on the *chrome around it* — the cartridge spine, the frame, the label chip.
This is what lets the page be genuinely overwhelming without becoming unusable.

## Creative concept

A bootleg game cartridge, serial **4663**, that boots a stock exchange instead of a game.
The serial number is the Robinhood Chain chain ID — the joke and the fact are the same
number, which is the hook the whole identity hangs off.

The site is styled as that cartridge's ROM running in your browser: a corrupted BIOS
check, a 1998 dialog box, an arcade cabinet dashboard, an obsessive evidence board, and a
manifesto printed on the inside of a cardboard box.

### How this differs from the cbkswwc.com reference

The reference was studied for **design grammar**, then rebuilt from different parts:

| Reference trait | What was taken | What is different |
|---|---|---|
| Modal opening question | The idea of a dialog gating entry | Ours is a BIOS/POST boot check with three exits and an Escape hatch; theirs is a single yes/no about accepting a claim |
| Dense underlined link nav | Deliberate messiness, clashing link colours | Ours resolves to a real landmark nav with a genuine mobile drawer |
| Fixed animated background | A fixed scene behind everything | Ours is a seeded canvas starfield + generated skyline, not a game screenshot |
| Floating objects | Drifting decorative sprites | Ours are original cartridges/coins/floppies |
| Three-column comparison with a central witness | The composition | Ours is Player One / attendant / quote asset, and the centre column's job is to state the legal distinction |
| Marquees and warning bars | The device | Ours are pausable and expose a single accessible copy |
| Evidence/archive section | Pseudo-academic seriousness | **Ours contains only true, independently checkable claims, with empty slots left visibly empty** |
| Horizontally scrolling gallery | The conveyor | Ours pauses on hover/focus, has a keyboard-navigable lightbox, and hides the duplicate track from assistive tech |
| Huge final logo + manifesto | The payoff | Original copy; makes no price or return promise |

Crucially, the reference site had **no contract address, wallet control, or live data**.
This one is a working Web3 read client with an honesty layer, which changes the
information architecture completely: there is a real dashboard with real failure states.

---

## Colour

### Palette

| Token | Hex | Role |
|---|---|---|
| `--void` | `#030303` | Base canvas |
| `--crt-blue` | `#071bff` | **Structure only** — see warning below |
| `--cyan` | `#00f5ff` | Primary neon |
| `--magenta` | `#ff00d4` | Secondary neon |
| `--acid` | `#39ff14` | Confirmation / live |
| `--danger` | `#ff2134` | Warning bars |
| `--coin` | `#ffe600` | Primary action |
| `--cartridge` | `#ff6a00` | Cartridge shell, manifesto |
| `--paper` | `#f4f0dd` | Primary ink, paper surfaces |

> ⚠️ **`--crt-blue` is 2.56:1 on black and must never carry text.** It is a title-bar
> fill, a border, and a horizon line. Use `--blue-ink` (`#7c88ff`, 6.70:1) when blue type
> is genuinely needed.

### Measured contrast

Run `node scripts/check-contrast.mjs` to regenerate. Against `--surface-0`:

| Token | Ratio | Verdict |
|---|---|---|
| `--ink-primary` `#f4f0dd` | 18.03:1 | AAA |
| `--ink-secondary` `#b9b6a6` | 10.12:1 | AAA |
| `--ink-muted` `#8a8878` | 5.77:1 | AA (floor for body text) |
| `--status-live` `#39ff14` | 15.21:1 | AAA |
| `--status-error` `#ff5b6a` | 6.83:1 | AA |

Button faces carry **dark** ink where a light ink would fail. White on `--danger` is only
3.56:1; the same red with `#1a0004` is 5.28:1. Button labels are 9–15px pixel type, which
never qualifies as "large text", so every face/ink pair clears 4.5:1.

Two bugs found by measurement rather than by eye, both fixed:
1. The disabled button style sat *before* the tone rules at equal specificity, so a
   disabled `coin` button still rendered bright yellow — a dead control that looked live.
2. The hero kicker used white on `--danger` at 9px (3.8:1), caught by axe.

### Status is never colour alone

Every state ships **glyph + word + colour**: `● LIVE`, `◐ STALE`, `✕ FEED LOST`,
`◌ READING…`, `○ NO SIGNAL`. Price direction uses `▲ +5.00%` with a visually-hidden
"up over 24 hours".

---

## Typography

Four families, deliberately clashing:

| Token | Family | Used for |
|---|---|---|
| `--font-pixel` | Press Start 2P | Game labels, buttons, section chips |
| `--font-terminal` | VT323 | Boot readout, terminal atmosphere |
| `--font-poster` | Anton | Wordmarks, section titles, tickers |
| `--font-data` | IBM Plex Mono | **All data, all body copy, all addresses** |
| `--font-ugly` | Times New Roman (system) | The nav strip — deliberate early-web ugliness |

The split that matters: **atmosphere uses VT323 and Press Start 2P; anything a person has
to read carefully uses IBM Plex Mono.** Press Start 2P has an enormous apparent size for
its em and no lowercase, which makes it unreadable in paragraphs — so it never carries
more than a few words.

All numeric readouts use `font-variant-numeric: tabular-nums` so a ticking value cannot
reflow its neighbours.

---

## Motion

Every duration derives from a single multiplier:

```css
--fx: 1;                                    /* 1 = full, 0 = reduced */
--dur-base: calc(320ms * var(--fx));
--dur-marquee: calc(26s / max(var(--fx), 0.0001));
```

Setting `--fx: 0` collapses the entire animation surface at once — no component needs to
know it was switched off. `html.fx-reduced` does this, and so does
`@media (prefers-reduced-motion: reduce)` for anyone who has not explicitly overridden it
in the page's own control.

### Flash safety

No animation on the site exceeds **2 Hz**, comfortably below the 3 Hz general
photosensitive-seizure threshold. The fastest are `blink-hard` (1 Hz, boot cursor) and
`alert-pulse` (0.6–1 Hz). `REDUCE FX` stops all of them.

### Performance contract

- Exactly **one** `requestAnimationFrame` loop exists site-wide, in `BackgroundScene`.
- It stops entirely on `visibilitychange` and under REDUCE FX.
- Canvas DPR is capped at 2; star count is capped at 160 regardless of viewport.
- Everything else animates `transform`/`opacity` only, so it stays on the compositor.
- All decorative scatter uses a **seeded** RNG (`src/lib/random.ts`) — no `Math.random`.
  This is what makes visual-regression snapshots meaningful.

Measured: **LCP 127 ms, CLS 0.00.**

---

## Components

| Primitive | Job |
|---|---|
| `RetroWindow` | 1998 window chrome. Decorative minimise/maximise are `<span aria-hidden>`, not disabled buttons. |
| `PixelButton` | The only button. A link with no destination becomes a genuinely disabled control with a stated reason. |
| `NeonFrame` | Mis-registered double ring. `pair="quiet"` for anything holding data. |
| `WarningMarquee` | Hazard strip. Duplicate track is `aria-hidden`; pauses on hover/focus/button. |
| `StatCartridge` | One metric as a cartridge in a shelf slot. Renders a value **only** when the reading holds one. |
| `ArcadeGauge` | Segmented meter. A real `progressbar`; `null` gives `aria-valuetext="Unknown"`, never a silent 0. |
| `DataStatusBadge` | The only component allowed to say whether a number is trustworthy. |
| `ContractCopyField` | Full address, never truncated. Clipboard API with `execCommand` fallback; reports failure honestly. |
| `MemeConveyor` | Moving gallery + focus-trapped lightbox with arrow-key navigation. |
| `CRTOverlay` | Scanlines, grille, vignette, roll bar, pointer bloom. Five static gradients, zero per-frame paint. |
| `SectionHeading` | Stage chip + poster title + blurb. |
| `SoundToggle` / `EffectsToggle` | Persistent, visible on desktop **and** mobile. |

## Layout

- `--page-max: 1440px`, fluid `--gutter` from 0.75rem to 2.5rem.
- `body { overflow-x: clip }` — the page is a wall of colour, and a horizontal scrollbar
  would read as a bug. Verified: `scrollWidth === clientWidth` at every tested breakpoint.
- Wide content (the pairing diagram) scrolls inside its own focusable, labelled container.
- `--tap-min: 44px` on every control. Audited to zero violations at 390 px.

### Mobile is designed, not scaled

- The cartridge comes **first** — it reads faster than a wall of pixel type at 360px.
- The player sprite is removed where it would collide with the cartridge's own sticker.
- Floating decoration count drops; falling coins are removed entirely.
- The pointer-follow CRT glow is disabled on coarse pointers.
- Sound and FX toggles stay in the bar rather than hiding in the drawer.
- Below 400px the brand name yields before the controls do.
- The high-score table becomes stacked cards rather than a squeezed grid.
