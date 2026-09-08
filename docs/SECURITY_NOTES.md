# Security Notes

## Threat model

This is a **read-only** marketing site that talks to a public blockchain. It holds no
user data, has no backend, no database, no accounts, and performs **no write
transactions**. Every function in `src/data/abi.ts` is `view`.

The realistic risks are therefore:

1. Misleading a visitor into buying the wrong token (address spoofing).
2. Rendering hostile content pulled from an untrusted source.
3. Leaking a credential through the client bundle.
4. Being framed or tab-napped for phishing.

Each is addressed below.

---

## 1. Address integrity

- **Full addresses, never truncated.** `ContractCopyField` renders the complete address
  and lets the browser select all of it in one click. Truncation is how address-spoofing
  scams work, so shortened forms (`shortenAddress`) appear only in secondary contexts,
  never where someone would copy an address to trade against.
- **Checksum-aware validation.** `checkAddress()` normalises to EIP-55 and returns a
  *reason* on failure. The zero address gets its own branch because it is the single most
  common "unset config" value and must never render as a real contract.
- **The canonical GME address is pinned in code**, not resolved by symbol. Hundreds of
  unrelated contracts on Robinhood Chain reuse the `GME` ticker; `config-status.ts`
  reports `MISMATCH` if the configured address is not the canonical one.
- **The site tells you to check.** Every copy field carries a note to verify against an
  official source before trading.

## 2. Untrusted input

- **No `dangerouslySetInnerHTML` anywhere.** All remote values render as text nodes.
- **Every network response crosses a Zod schema** before reaching a component. A
  malformed payload becomes an honest `ERROR` state, not partially-populated data.
- **`bigintSchema` rejects fractional numbers**, because a fractional raw balance means
  precision was already lost upstream.
- **URLs from configuration are protocol-checked.** `safeExternalUrl()` accepts only
  `http:`/`https:`, so a `javascript:` or `data:` URL smuggled in through an env var can
  never reach an `href`. Tested.

## 3. Secrets

- **There are none in the client.** Every `VITE_*` variable is inlined into the public
  bundle by design; `.env.example` says so at the top in capitals.
- The only outbound endpoint is a JSON-RPC URL. If you use a keyed provider, that key
  **will be public** — use a provider that supports origin allowlisting, or proxy it.
- **Error messages are sanitised** before display or logging. `sanitiseError()` strips
  URLs and long opaque tokens, because provider SDKs routinely embed the full request URL
  (key included) in error text.
- **No analytics, no third-party scripts, no wallet addresses logged.** There is nothing
  to correlate.

Scan before shipping:

```bash
npm audit --omit=dev
grep -rEn "(sk_|pk_live|AKIA|BEGIN [A-Z ]*PRIVATE KEY)" src public --exclude-dir=node_modules
```

Both are clean at the time of writing (`found 0 vulnerabilities`).

## 4. External links

Every external anchor goes through `EXTERNAL_LINK_PROPS`:

```ts
{ target: '_blank', rel: 'noopener noreferrer nofollow' }
```

`noopener` prevents reverse tabnabbing. An E2E test asserts that **no** `http`-scheme
link on the page lacks both `noopener` and `noreferrer`.

---

## 5. Content Security Policy

The site loads **nothing** from a third party — fonts are self-hosted, artwork is local
SVG, audio is synthesised at runtime. That makes a tight policy practical.

The meta-tag CSP in `index.html` covers what a meta tag can. **Two directives must be
added as real HTTP response headers**, because a meta tag cannot express them correctly:

```
Content-Security-Policy: default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  media-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'none';
  frame-ancestors 'none';
  connect-src 'self' https://rpc.mainnet.chain.robinhood.com;
  upgrade-insecure-requests

X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```

### Why those two are not in the meta tag

- **`frame-ancestors`** is ignored in a `<meta>` CSP and browsers log a console error for
  trying.
- **`upgrade-insecure-requests`** rewrites every subresource to `https://`. Chromium
  exempts `localhost`; **WebKit does not**. Shipping it in the meta tag made the entire
  site fail to load over plain HTTP — including `vite preview` and any non-TLS staging
  host. This was caught by the WebKit E2E project, which is exactly why that project
  exists.

### `'unsafe-inline'` on `style-src`

Required: the app sets a small number of inline `style` attributes for deterministic
scatter positions and gauge widths. **`script-src` has no such allowance** — scripts are
`'self'` only.

Verified: `grep -c "eval(\|new Function(" dist/assets/*.js` returns **0** across every
shipped chunk. A Lighthouse run reports a CSP `eval` issue, but that originates from
Lighthouse's own injected instrumentation being correctly blocked, not from application
code.

---

## 6. Wallet and transactions

Wallet support is **off by default** (`VITE_ENABLE_WALLET=false`) and the site is fully
functional without one. No wallet code path is currently wired up.

If wallet support is added later, the following are non-negotiable and are **not yet
implemented**:

- Never request a token approval on connect.
- Never request an unlimited approval by default.
- Show exact token, amount, recipient, slippage and deadline before any signature.
- Validate the chain ID and every contract address before building a transaction.
- Handle rejected / pending / replaced / confirmed / reverted states distinctly.
- Prefer a verified deep link to the official Pons interface over custom swap logic.

## 7. Dark patterns — explicitly absent

No fake urgency, no countdown to nothing, no fabricated holder counts, no simulated
transaction feed, no invented price history, no "X people are viewing this". Unavailable
data reads `NO SIGNAL`. Empty archive slots stay visibly empty.

The high-score board is **project milestones only** — never a holder leaderboard, because
publishing wallet rankings is how individual holders get targeted.

## 8. Known limitations

| Item | Status |
|---|---|
| Public RPC is rate-limited | Set `VITE_RPC_URL` to a dedicated provider before launch. Robinhood's docs explicitly say not to use the public endpoint in production. |
| Security headers | Must be configured at the edge; a static build cannot set them. |
| Legal copy | `src/config/content/disclosures.ts` needs review by a qualified lawyer in the relevant jurisdiction. Not a code issue. |
| SRI | Not applicable — no external scripts. |
