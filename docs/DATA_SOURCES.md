# Data Sources

Every number the site can display, where it comes from, and exactly what happens when
that source fails.

## The governing rule

> **A value we cannot source is `null`, and `null` renders as `NO SIGNAL` and a dash.**
> It is never `0`, never a placeholder, and never an estimate.

This is enforced structurally, not by convention:

- `MarketMetrics` (in [`src/data/schemas.ts`](../src/data/schemas.ts)) types every metric
  as nullable, so "unavailable" is representable and has to be handled.
- `StatCartridge` only renders a value when `reading.value != null`. Passing it a
  formatted string while the reading is empty still renders a dash — there is a unit test
  asserting that.
- `DataStatusBadge` derives its label from `data-health`, so a component cannot claim
  `LIVE` unless it was handed a reading that genuinely is.

## Source selection

`VITE_MARKET_DATA_SOURCE` picks the adapter:

| Value | Behaviour |
|---|---|
| `none` *(default)* | No market data at all. Every metric renders `NO SIGNAL`. Always safe. |
| `chain` | Reads Robinhood Chain RPC + the Pons V2 factory directly. |
| `mock` | Development fixtures. **Hard-blocked in production builds.** |

### The production guard

`marketDataSource` is computed in [`project.config.ts`](../src/config/project.config.ts):
if `import.meta.env.PROD` is true and the requested source is `mock`, it is forced to
`none` and `mockDataWasBlocked` is raised so the UI can say what happened.

Covered by six tests in `src/config/production-guard.test.ts`, including the case where
someone deliberately sets `mock` in a production `.env`.

---

## Metric inventory

| Metric | Source | Units | Unavailable when | Renders as |
|---|---|---|---|---|
| Token price | curve reserves ÷ circulating supply | WAD, denominated in **GME** | no token deployed | `NO SIGNAL` |
| Market cap | circulating supply × price | WAD GME | price unavailable | `NO SIGNAL` |
| Fully diluted | total supply × price | WAD GME | price unavailable | `NO SIGNAL` |
| Liquidity | GME held by the bonding curve | WAD GME | no curve | `NO SIGNAL` |
| Graduation progress | curve GME ÷ threshold | basis points | no curve | gauge shows `UNKNOWN` |
| 24h volume | **no source** | — | always | `NO SIGNAL` |
| 24h change | **no source** | — | always | `NO SIGNAL` |
| Holder count | **no source** | — | always | `NO SIGNAL` |
| GME approved as quote | `factory.approvedPairTokens(GME)` | bool | RPC failure | `—` + `FEED LOST` |
| Graduation threshold | `factory.pairTokenEconomics(GME)` | WAD GME | RPC failure | `—` + `FEED LOST` |
| Virtual reserve | `factory.pairTokenEconomics(GME)` | WAD GME | RPC failure | `—` + `FEED LOST` |
| GME UI multiplier | `uiMultiplier()` (ERC-8056) | WAD | not implemented → defaults to 1.0 | `1.000000 ×` |

### Metrics deliberately absent

**Volume, 24-hour change and holder count** all require an indexer that aggregates
historical transfers. This project does not have one. Rather than approximate them from
a short RPC log scan — which would be slow, rate-limited and wrong — the adapter returns
`null` and the tiles say so, with the subtitle *"Needs an indexer we have not wired up."*

**A GameStop share price is not displayed anywhere.** The site has no authoritative feed
for the NYSE quote. Labelling a token-pool price as "the GME price" would be the single
most misleading thing this site could do, so the price tile is explicitly subtitled
*"Pool price in GME — not a GameStop share price."*

---

## Freshness and failure

Defined in [`src/lib/data-health.ts`](../src/lib/data-health.ts).

| State | Meaning | UI |
|---|---|---|
| `LIVE` | Fetched and newer than 60 s | green dot, `LIVE` |
| `STALE` | Value held, older than 60 s | amber half-dot, `STALE` |
| `ERROR` | Fetch failed. **Last good value is retained.** | red cross, `FEED LOST`, plus a banner explaining the last reading is not current |
| `LOADING` | First fetch in flight | loading slot reading `READING…` |
| `NO_SIGNAL` | No source configured | hollow dot, `NO SIGNAL` |

Every state ships a **glyph and a word** alongside the colour, so status is never carried
by hue alone.

### Error sanitisation

`sanitiseError()` strips URLs and long opaque tokens before an error can be rendered or
logged, because provider SDKs routinely embed the full request URL — including the API
key — in their error messages. Tested in `data-health.test.ts`.

---

## Request policy

Configured in [`rpc-client.ts`](../src/data/adapters/rpc-client.ts) and
[`queries.ts`](../src/data/queries.ts):

- **12 s hard timeout** per operation — a hung RPC becomes a visible `FEED LOST`, never
  an infinite spinner.
- **2 retries** with exponential backoff, then stop. The public endpoint is rate-limited
  and Robinhood's own docs say not to use it for production traffic.
- **Request batching** (`batch: { wait: 16 }`) so a dashboard render is one HTTP round
  trip rather than a dozen.
- **Polling pauses in a background tab** (`refetchIntervalInBackground: false`).
- **No refetch on window focus** — every query is a public read, so it would only burn quota.
- Market metrics poll every **30 s**; pairing facts every **5 min**, because protocol
  parameters change rarely.

## Validation

Every response crosses a Zod schema before reaching a component. Notably `bigintSchema`
**rejects fractional numbers outright** — a fractional raw balance means the source has
already lost precision, and silently accepting it would corrupt every downstream figure.

Integration tests in `src/data/adapters/pons.integration.test.ts` drive the real adapter
and the real viem client with only the network faked, and assert that a malformed
payload, an RPC error and a transport failure each produce a rejection rather than
partially-populated data.

## Arithmetic

All on-chain values are `bigint` end to end. `number` appears only at the final display
step. `src/lib/units.ts` carries the fixed-point helpers and ESLint blocks `parseFloat`
globally to keep float maths away from raw balances.
