/**
 * Robinhood Chain network configuration.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EVERY VALUE IN THIS FILE WAS VERIFIED LIVE AGAINST THE CHAIN ON 2026-09-04.
 * See docs/PAIRING_VERIFICATION.md for the exact commands and raw responses.
 * Do not edit these without re-running `npm run verify:pairing`.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { Chain } from 'viem'

/** Verified via `eth_chainId` -> 0x1237. */
export const ROBINHOOD_CHAIN_ID = 4663 as const

/**
 * Public RPC. Rate-limited and explicitly "not recommended for production
 * workloads" by Robinhood's own docs, which is why it is only the fallback:
 * set VITE_RPC_URL to a dedicated provider before shipping.
 */
export const PUBLIC_RPC_URL = 'https://rpc.mainnet.chain.robinhood.com'

/** Verified: returns HTML behind Cloudflare for non-browser clients, so we only ever link to it. */
export const EXPLORER_URL = 'https://robinhoodchain.blockscout.com'

export const robinhoodChain = {
  id: ROBINHOOD_CHAIN_ID,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [PUBLIC_RPC_URL] } },
  blockExplorers: { default: { name: 'Blockscout', url: EXPLORER_URL } },
} as const satisfies Chain

/**
 * Canonical Robinhood tokenized-equity contract for GameStop.
 *
 * Verified on-chain:
 *   name()     -> "GameStop • Robinhood Token"
 *   symbol()   -> "GME"
 *   decimals() -> 18
 *   ERC-1967 beacon proxy -> implementation "Stock" 0xb35490d6f9163DE4F80d88dc75c3516eb64C5aE2
 *
 * Hundreds of unrelated contracts on this chain also use the ticker "GME".
 * This is the only one that is a Robinhood Stock Token. Never resolve GME by symbol.
 */
export const GME_STOCK_TOKEN_ADDRESS = '0x1b0E319c6A659F002271B69dB8A7df2F911c153E' as const

export const GME_STOCK_TOKEN_DECIMALS = 18 as const

/**
 * Pons V2 deployment. Each address below was confirmed to (a) hold bytecode,
 * (b) have verified source on Blockscout under the stated contract name, and
 * (c) be emitting logs continuously — the older Pons deployments listed by
 * third-party aggregators are dead (zero logs) and are deliberately not used.
 */
export const PONS_V2 = {
  /** Verified source name: PonsV2LaunchFactory */
  factory: '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e',
  /** Verified source name: V2MemeHook — the Uniswap v4 hook. factory.memeHook() returns this. */
  hook: '0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044',
  /** Verified source name: PonsV2LaunchAndBuy */
  router: '0xe33E9E479dF8802cb0866d5d05258bEc4cF62948',
  /** factory.poolManager() — the Uniswap v4 PoolManager. */
  poolManager: '0x8366a39CC670B4001A1121B8F6A443A643e40951',
} as const

/**
 * Live economics for a GME-quoted Pons V2 launch, read from
 * `factory.pairTokenEconomics(GME)`. These are protocol parameters, not our
 * numbers, and the app re-reads them at runtime rather than trusting these
 * constants — they exist so the UI has something honest to render before the
 * first fetch resolves, and so tests have a real expected value.
 */
export const GME_PAIR_ECONOMICS_SNAPSHOT = {
  /** 369 GME, expressed in raw 18-decimal units. */
  graduationThreshold: 369_000000000000000000n,
  /** 147.6 GME of virtual (phantom) quote reserve seeding the curve. */
  phantomQuote: 147_600000000000000000n,
  decimals: 18,
  /** Unix ms at which the snapshot above was taken. */
  observedAt: Date.UTC(2026, 8, 4),
} as const
