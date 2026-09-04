# TODO — getting CARTRIDGE 4663 launch-ready

Nothing here is a bug. The site is finished and passing every gate. These are decisions
and values only you can supply, plus the work that follows from them.

Ordered by **what blocks what**. Items 1–3 have the longest lead time — start those first
even though the quick wins are tempting.

Legend: 🔴 blocks launch · 🟡 should do before launch · 🟢 optional
👤 only you can do · 🤖 I can do once you've decided

---

## 1. 🔴👤 Start the legal review — do this first, it has the longest lead time

The copy lives in one file: `src/config/content/disclosures.ts`. Send a lawyer that file
plus the live site.

The four distinctions that must survive any rewrite:

- the token **is not** GameStop stock and grants no shares, dividends, votes or ownership
- the project is **not affiliated with** GameStop, Robinhood, or anyone else
- the GME stock token is a **third-party asset** with its own transfer/jurisdiction rules
- prices shown are **pool prices**, not exchange quotes for GameStop shares

Ask them specifically about: whether this reads as a securities offering in your
jurisdiction, and whether the GameStop/Robinhood naming is defensible as nominative use.

> ⏱ Days to weeks. Everything else is hours. Start it tomorrow morning.

---

## 2. 🔴👤 Decide what to do about the Pons UK block

`ponsfamily.com` returns **HTTP 403** to UK visitors — *"pons does not operate in
OFAC-sanctioned jurisdictions or the United Kingdom."*

This affects **you launching** and **every UK visitor** who clicks TRADE.

Decide between:

- [ ] **A.** Launch anyway; accept UK visitors hit a 403 on the trade link
- [ ] **B.** Add a visible note beside the trade control that the venue restricts some regions (🤖 ~15 min once you choose)
- [ ] **C.** Point the trade link at a venue that serves your audience after graduation to Uniswap v4
- [ ] **D.** Reconsider Pons entirely

I'd raise this with the same lawyer as item 1 — it's the same conversation.

**I won't help route around a compliance geo-block.** That's not an engineering problem.

---

## 3. 🔴👤 Lock the branding

Currently `CARTRIDGE 4663` / `$CART` — working placeholders, flagged as provisional in code.

- [ ] Final project name → `VITE_PROJECT_NAME`
- [ ] Final ticker → `VITE_TOKEN_SYMBOL`
- [ ] Tagline (currently *"NO PUBLISHER. NO BOX. NO REFUNDS."*) → `VITE_PROJECT_TAGLINE`
- [ ] Keep the generated pixel logo, or supply your own?

Then 🤖 (~30 min): regenerate artwork, logo, favicons and the social card, and set
`VITE_BRANDING_FINAL=true`.

> Blocks item 4 — pick the domain to match the name.

---

## 4. 🟡👤 Domain

- [ ] Buy/choose the domain
- [ ] 🤖 Point it at the Vercel project, set `VITE_SITE_URL`, update `public/robots.txt`
      and `public/sitemap.xml` (all three must match — OG tags and the canonical URL come
      from it)

Currently the placeholder `https://cartridge4663.example`. **Social previews will not
render correctly until this is real.**

---

## 5. 🔴👤 Dedicated RPC provider

`VITE_RPC_URL` is unset, so the site falls back to the public endpoint — which is
rate-limited and which Robinhood's own docs say not to use in production. **Every
visitor's browser** makes these calls, so this will break under any real traffic.

- [ ] Sign up with Alchemy (supports Robinhood Chain) or QuickNode / dRPC
- [ ] Enable **origin allowlisting** on the key — it ships in the public bundle by design
- [ ] Set `VITE_RPC_URL`

> ⏱ ~20 minutes. Cheapest high-impact item on this list.

---

## 6. 🟡👤 Social links

- [ ] `VITE_OFFICIAL_X_URL`
- [ ] `VITE_OFFICIAL_TELEGRAM_URL`

Until set, these render as **disabled controls**, not dead links — so it's safe to ship
without them, it just looks unfinished.

---

## 7. 🟢🤖 Optional polish, once 1–6 are settled

- [ ] Region note beside the trade control (item 2B)
- [ ] Wire up **volume / 24h change / holder count** — needs a real indexer. They currently
      read `NO SIGNAL` rather than being approximated. Tell me your data source and I'll
      add an adapter alongside `token-metrics.ts`
- [ ] Fill the empty archive slots (`token-deploy`, `pool-open`, `graduation`) with real
      dates and explorer links as they happen — **do not backfill invented history**
- [ ] A second look at copy tone once branding is final

---

## 8. 🔴 LAUNCH DAY — the actual sequence

Run in this order:

- [ ] `npm run verify:pairing` — confirm GME is still an approved pair and the threshold is
      still 369 GME. **If it moved, tell me — copy in two components hard-codes it.**
- [ ] Deploy the token through Pons V2 **with GME as the pair asset**
- [ ] Set `VITE_TOKEN_ADDRESS` to the deployed contract ← *the only required change*
- [ ] Set `VITE_MARKET_DATA_SOURCE="chain"`
- [ ] Set `VITE_DEX_OR_LAUNCH_URL` to the token's Pons page
- [ ] `npm run build && npx vercel deploy --prod`

### Then verify, within 5 minutes

- [ ] GME LINK section: **`GME PAIR CONFIRMED` reads VERIFIED** and shows
      `0x1b0E319c6A659F002271B69dB8A7df2F911c153E`
- [ ] **No red `LAUNCH VERIFICATION FAILED` banner**
- [ ] MARKET ARCADE shows price, market cap, liquidity, curve progress
- [ ] Copy the contract from the site and compare character-by-character against your
      deployment transaction
- [ ] `curl -sI <domain> | grep -i content-security-policy` returns the header

> If the pairing check shows **MISMATCH**, stop and tell me before promoting it. That check
> exists precisely so a wrong address can't quietly go live claiming a pairing that isn't
> there.

---

## What I need from you first thing tomorrow

To make real progress in one session, the two highest-leverage answers are:

1. **The Pons UK decision** (item 2) — it changes where the trade link points
2. **Final name and ticker** (item 3) — it unblocks branding, assets and the domain

Give me those two and I can have items 3, 4 and 6 done inside an hour.
