# Pairing Verification

Every chain fact this site displays, how it was verified, and the raw response.

**Verified on 2026-09-04** against Robinhood Chain mainnet via the public JSON-RPC
endpoint `https://rpc.mainnet.chain.robinhood.com`. Re-run at any time with:

```bash
npm run verify:pairing
```

> **Nothing in this document was taken on trust from a blog post or an aggregator.**
> Where a third-party source disagreed with the chain, the chain won — see
> [Rejected sources](#rejected-sources).

---

## 1. Network

| Fact | Value | How verified |
|---|---|---|
| Chain ID | `4663` (`0x1237`) | `eth_chainId` |
| Native currency | ETH, 18 decimals | Robinhood Chain docs |
| Public RPC | `https://rpc.mainnet.chain.robinhood.com` | responds to `eth_chainId` |
| Explorer | `https://robinhoodchain.blockscout.com` | serves verified contract sources |
| Block time | ~0.1 s | measured across 1000 blocks |

```console
$ curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
    -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
{"jsonrpc":"2.0","id":1,"result":"0x1237"}
```

`0x1237` = 4663. Note that one secondary source rendered this as `0x123F` (= 4671),
which is wrong; the value above is from the chain itself.

There is also a testnet at chain ID `46630` (`0xb626`). This project targets **mainnet only**.

---

## 2. The GME stock token

**`0x1b0E319c6A659F002271B69dB8A7df2F911c153E`**

| Call | Raw result | Decoded |
|---|---|---|
| `name()` | `0x…47616d6553746f7020e280a220526f62696e686f6f6420546f6b656e` | `GameStop • Robinhood Token` |
| `symbol()` | `0x…474d45` | `GME` |
| `decimals()` | `0x…12` | `18` |
| `totalSupply()` | `0x23339d077e9d632b0000` | `166234.926` |
| `uiMultiplier()` | `0x…0de0b6b3a7640000` | `1.0` (1e18) |

Contract type: **ERC-1967 beacon proxy**, implementation named `Stock` at
`0xb35490d6f9163DE4F80d88dc75c3516eb64C5aE2` (verified source on Blockscout).

### Scaled UI amounts (ERC-8056)

Robinhood stock tokens implement a `uiMultiplier()` that scales **displayed shares**
to account for splits and dividends, while raw balances stay unchanged.

It currently returns exactly `1e18`, i.e. no corporate action has been applied.

**This site never folds the multiplier into an economic figure.** It is applied only in
`toDisplayShares()` in [`src/lib/units.ts`](../src/lib/units.ts); `priceOf()` and
`marketCap()` take raw amounts and have no overload that accepts shares, so the
adjustment cannot be double-counted. There is a unit test asserting exactly this.

> ⚠️ **Hundreds of unrelated contracts on this chain use the ticker "GME".** Exactly one
> is the Robinhood stock token. Never resolve GME by symbol — always by the address above.

---

## 3. Pons V2

All three addresses hold bytecode, have verified source on Blockscout under the stated
contract name, and are emitting logs continuously.

| Role | Address | Verified source name |
|---|---|---|
| Launch factory | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` | `PonsV2LaunchFactory` |
| Uniswap v4 hook | `0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044` | `V2MemeHook` |
| Launch-and-buy router | `0xe33E9E479dF8802cb0866d5d05258bEc4cF62948` | `PonsV2LaunchAndBuy` |
| Uniswap v4 PoolManager | `0x8366a39CC670B4001A1121B8F6A443A643e40951` | via `factory.poolManager()` |

Cross-check: `factory.memeHook()` returns the hook address above, so the factory and the
hook agree with each other. The site re-runs this check at runtime and displays the
result in the GME LINK section.

### Live factory state

```console
factory.owner()             = 0x263ed295dAFaE1d9AAdD6E56c4B6F9f38eE019Dd
factory.launchEnabled()     = true
factory.launchConfigCount() = 1
factory.launchFee()         = 500000000000000  (0.0005 ETH)
factory.locker()            = 0x267444D099b10fB5Ed7c3Cc7B7c767AdcA574952
```

---

## 4. GME as a quote asset — the core claim

This is the fact the whole project rests on, so it is checked directly against the
factory rather than inferred:

```console
factory.approvedPairTokens(0x1b0E319c6A659F002271B69dB8A7df2F911c153E) = true

factory.pairTokenEconomics(0x1b0E319c6A659F002271B69dB8A7df2F911c153E)
  phantomQuote        = 147600000000000000000   (147.6 GME)
  graduationThreshold = 369000000000000000000   (369   GME)
  decimals            = 18
```

For comparison, the same call for two other assets:

| Pair token | Approved | Graduation threshold |
|---|---|---|
| **GME** `0x1b0E…153E` | ✅ `true` | **369 GME** |
| USDG `0x5fc5…d168` | ✅ `true` | 8090 USDG (6 dp) |
| WETH `0x0Bd7…AD73` | ❌ `false` | — |

**Meaning:** a token launched through Pons V2 may be quoted in the GME stock token, and
such a launch graduates to a locked Uniswap v4 pool once its curve has taken in 369 GME.
Nobody had to ask permission for this; it is a public parameter on a public contract.

### Corroboration

A real GME-quoted launch already exists on chain, confirming the path works end to end:

```
TokenLaunched(
  token               = 0xe4a0D07F2c2cF083cC715333ea0F16fBB7087e86
  curve               = 0x40b66F016e0710eA15007E13F3ed80026Bc97912
  pairToken           = 0x1b0E319c6A659F002271B69dB8A7df2F911c153E   (GME)
  graduationThreshold = 369000000000000000000                        (369 GME)
  block               = 54424012
)
```

That token is **unrelated to this project** and is recorded here purely as evidence that
the mechanism is live. It is not referenced anywhere in the application code.

---

## 5. Rejected sources

Recording these because "we checked and it was wrong" is itself a verification result.

| Claim | Source | Verdict |
|---|---|---|
| Chain ID hex is `0x123F` | secondary doc summary | ❌ **Wrong.** `0x123F` is 4671. Chain returns `0x1237`. |
| Pons factory `0xA5aAb3F0…1feB` ("active") | third-party almanac | ❌ **Dead.** Holds code but emitted **0 logs** in ~53 minutes of chain time. |
| Pons factory `0x0c37a24F…77a4` ("legacy") | third-party almanac | ❌ **Dead.** 0 logs over the same window. |
| `TokenLaunched(address,address,address,address,address,uint256,uint256,uint256,uint256,uint256)` | third-party almanac | ❌ **Wrong signature.** Returns no logs. The real event has 6 parameters — see the verified ABI. |
| Pons factory `0x7eD598Bc…EC7e` | blog post | ✅ **Confirmed.** 1904 logs in ~53 min, verified source `PonsV2LaunchFactory`. |

The lesson encoded in the code: the site reads `approvedPairTokens` and
`pairTokenEconomics` **live** rather than hard-coding them, so if the protocol changes
these parameters the page follows rather than lying.

---

## 6. What is NOT verified

Stated plainly, because the absence matters:

- **The project's own token does not exist.** `VITE_TOKEN_ADDRESS` is empty. There is no
  contract, no pool, no price and no market cap. The site renders `UNCONFIGURED` and
  `NO SIGNAL` accordingly.
- **No GameStop share price is displayed anywhere.** This project has no authoritative
  feed for the NYSE quote and does not pretend otherwise. The only prices the site can
  ever show are token-pool prices, and they are labelled as such.
- **Holder counts and 24-hour volume are not available.** Both need an indexer that this
  project has not wired up. They return `null` and render `NO SIGNAL` rather than `0`.

---

## 7. Re-verification

```bash
npm run verify:pairing          # re-reads every value in sections 1-4
node scripts/check-contrast.mjs # re-checks the colour contrast claims
```

If `verify:pairing` disagrees with this document, **this document is out of date** —
update it and `src/config/chain.config.ts` together.
