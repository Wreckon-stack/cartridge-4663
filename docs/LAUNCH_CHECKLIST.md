# Launch Checklist

For launching on **Pons V2** with the **GME stock token** as the pair asset.

---

## ⚠️ Read this first: Pons blocks the United Kingdom

Verified 2026-09-04 — `https://www.ponsfamily.com/launchpad` returns **HTTP 403** from a
UK connection:

> *"Unavailable in your region. This path is closed for your location. pons does not
> operate in OFAC-sanctioned jurisdictions or the United Kingdom. Access is restricted to
> meet regulatory requirements."*

Consequences:

- You cannot reach the Pons interface from a UK IP address.
- **Any UK visitor clicking TRADE / LAUNCH on this site will hit the same 403.**
- This is a jurisdictional restriction the venue imposes, not a technical fault. Take
  advice before relying on a workaround; routing around a compliance geo-block is a legal
  question, not an engineering one.

Decide how you want the site to handle it. Options, in rough order of honesty:

1. Leave the link as-is and let visitors hit the 403.
2. Add a short note beside the trade control that the venue restricts some regions.
3. Point `VITE_DEX_OR_LAUNCH_URL` at a venue that does serve your audience once the token
   graduates to Uniswap v4.

Nothing in the code assumes any of these — the trade link is a single env var.

---

## The launch-day change is ONE variable

```bash
VITE_TOKEN_ADDRESS="0xYourTokenAddress"
```

That is genuinely all that is required. From it, the site reads the Pons V2 launch record
(`getLaunchedToken`) and verifies **live, in the visitor's browser**:

| Row on the evidence board | Comes from |
|---|---|
| `{SYMBOL} CONTRACT` | the factory holds a launch record for this address |
| **`GME PAIR CONFIRMED`** | **`pairToken` on the record really is the GME stock token** |
| `BONDING CURVE` | `curve` on the record — derived, never configured |
| `GRADUATION THRESHOLD` | the record's threshold, compared to the protocol's GME economics |
| `LAUNCH PHASE` | `ON CURVE` → `GRADUATING` → `GRADUATED` |

`VITE_PONS_POOL_OR_LAUNCH_ID` is **optional**. Set it only if you want the site to
cross-check the factory against a value you recorded yourself; a disagreement shows as
`MISMATCH`.

### What happens if you get it wrong

This is the part that matters. If the address is wrong, or the token turns out to be
paired to something other than GME, the site does **not** quietly keep claiming the
pairing. It renders a full-width red banner:

> **✕ LAUNCH VERIFICATION FAILED — The chain disagrees with this build's configuration.**

and the relevant board row flips to `MISMATCH` with the actual pair token printed. Covered
by 18 tests in `src/config/launch-status.test.ts`, including the wrong-pair case.

---

## Full sequence

### Before you deploy the token

- [ ] Confirm GME is still an approved pair asset — `npm run verify:pairing` should print
      `approvedPairTokens = true` and a graduation threshold. If the threshold has moved
      from 369 GME, update the copy in `HowPairing.tsx` and `MarketArcade.tsx`.
- [ ] Set a dedicated RPC: `VITE_RPC_URL`. The public endpoint is rate-limited and
      Robinhood's docs say not to use it in production. Every visitor's browser makes
      these reads, so the public endpoint **will** rate-limit you under any real traffic.
- [ ] Finalise branding: `VITE_PROJECT_NAME`, `VITE_TOKEN_SYMBOL`, then regenerate art
      (`npm run assets && node scripts/rasterize.mjs`) and set `VITE_BRANDING_FINAL=true`.
- [ ] Set `VITE_SITE_URL`, and update the same URL in `public/robots.txt` and
      `public/sitemap.xml`.
- [ ] Legal review of `src/config/content/disclosures.ts`.

### At deployment

- [ ] Deploy the token through Pons V2 with GME as the pair asset.
- [ ] Set `VITE_TOKEN_ADDRESS` to the deployed contract.
- [ ] Set `VITE_MARKET_DATA_SOURCE="chain"` to turn on live metrics.
- [ ] Set `VITE_DEX_OR_LAUNCH_URL` to the token's Pons page (see the geo-block note above).
- [ ] Set `VITE_OFFICIAL_X_URL` / `VITE_OFFICIAL_TELEGRAM_URL`.
- [ ] `npm run build` and deploy.

### Immediately after deploying the site

- [ ] Open the GME LINK section. Confirm **`GME PAIR CONFIRMED` reads VERIFIED** and shows
      the canonical GME address `0x1b0E319c6A659F002271B69dB8A7df2F911c153E`.
- [ ] Confirm no red LAUNCH VERIFICATION FAILED banner.
- [ ] Confirm the MARKET ARCADE shows a price, market cap, liquidity and curve progress.
      Volume, 24h change and holders will still read `NO SIGNAL` — see below.
- [ ] Copy the contract from the site and compare it, character by character, against your
      deployment transaction.
- [ ] Confirm the security headers are live:
      `curl -sI https://yourdomain | grep -i "content-security-policy\|x-frame-options"`

### Add an archive exhibit

The archive has empty slots reserved for exactly these events. Fill them in
`src/config/content/archive.ts` — `token-deploy`, `pool-open`, `graduation` — with real
dates and explorer links. **Do not backfill invented history**; the empty-slot rendering
is deliberate.

---

## What will still read NO SIGNAL after launch

**24h volume, 24h change, and holder count.** All three need an indexer that aggregates
historical transfers, which this project does not have. They return `null` and the tiles
say *"Needs an indexer we have not wired up."*

That is a deliberate choice over approximating them from a short RPC log scan, which would
be slow, rate-limited and wrong. To enable them, add a real indexer adapter alongside
`token-metrics.ts` — do not compute them inline.

---

## Rolling back

Clear `VITE_TOKEN_ADDRESS` and rebuild. The site returns to its pre-launch state, the
banner comes back, and every metric returns to `NO SIGNAL`. Nothing is cached
server-side because there is no server.
