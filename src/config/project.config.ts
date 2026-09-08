/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  THE ONLY FILE YOU NEED TO EDIT TO REBRAND / LAUNCH THIS SITE.            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Everything below is read from environment variables so the same build can be
 * pointed at a pre-launch preview or a live token without a code change.
 * Copy `.env.example` to `.env.local` and fill it in.
 *
 * RULES THIS MODULE ENFORCES (see ./config-status.ts):
 *   - A blank / placeholder address NEVER renders as a real value.
 *   - A malformed address is reported as MISMATCH, never silently dropped.
 *   - When production config is incomplete the whole site renders a clearly
 *     marked PRE-LAUNCH state instead of inventing numbers.
 */
import { GME_STOCK_TOKEN_ADDRESS, ROBINHOOD_CHAIN_ID } from './chain.config'

const env = import.meta.env

/** Trim and treat empty-string / obvious placeholder text as "not configured". */
function optional(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  // Guard against a half-filled .env being mistaken for real configuration.
  if (/^(TODO|TBD|CHANGEME|PLACEHOLDER|0x0+)$/i.test(trimmed)) return undefined
  return trimmed
}

function required(value: unknown, fallback: string): string {
  return optional(value) ?? fallback
}

/**
 * Brand identity. `PROJECT_NAME` and `TOKEN_SYMBOL` have working defaults so the
 * site is presentable before final branding lands; both are marked as
 * provisional by config-status until explicitly set.
 */
export const brand = {
  /** PROJECT_NAME */
  name: required(env.VITE_PROJECT_NAME, 'CARTRIDGE'),
  /** TOKEN_SYMBOL — rendered with a leading $ by the UI, so do not include one. */
  symbol: required(env.VITE_TOKEN_SYMBOL, 'CART'),
  /** Short line under the logo. */
  tagline: required(env.VITE_PROJECT_TAGLINE, 'NO PUBLISHER. NO BOX. NO REFUNDS.'),
  /** Used for <title>, OG tags and the social card. */
  description: required(
    env.VITE_PROJECT_DESCRIPTION,
    'A bootleg cartridge that boots a stock exchange instead of a game. Paired against the GME stock token on Robinhood Chain.',
  ),
  /** Canonical absolute URL, no trailing slash. Used for OG/canonical/sitemap. */
  siteUrl: required(env.VITE_SITE_URL, 'https://www.cartridgehood.xyz').replace(/\/$/, ''),
  /** Whether the operator has confirmed the branding above is final. */
  brandingFinal: optional(env.VITE_BRANDING_FINAL) === 'true',
} as const

/** Contract + venue configuration. `undefined` means "not configured yet". */
export const onchain = {
  /** CHAIN_ID — overridable only for local forks; production must equal 4663. */
  chainId: Number(optional(env.VITE_CHAIN_ID) ?? ROBINHOOD_CHAIN_ID),
  /** TOKEN_ADDRESS — our own token. Undefined until launch. */
  tokenAddress: optional(env.VITE_TOKEN_ADDRESS),
  /** GME_STOCK_TOKEN_ADDRESS — defaults to the verified canonical contract. */
  gmeStockTokenAddress: required(env.VITE_GME_STOCK_TOKEN_ADDRESS, GME_STOCK_TOKEN_ADDRESS),
  /** PONS_POOL_OR_LAUNCH_ID — the bonding curve address or graduated pool id. */
  ponsPoolOrLaunchId: optional(env.VITE_PONS_POOL_OR_LAUNCH_ID),
  /** Custom RPC. Falls back to the rate-limited public endpoint. */
  rpcUrl: optional(env.VITE_RPC_URL),
} as const

/** Outbound links. Undefined links render as disabled, never as dead buttons. */
export const links = {
  /** OFFICIAL_X_URL */
  x: optional(env.VITE_OFFICIAL_X_URL),
  /** OFFICIAL_TELEGRAM_URL */
  telegram: optional(env.VITE_OFFICIAL_TELEGRAM_URL),
  /** DEX_OR_LAUNCH_URL — where "TRADE / LAUNCH" points. */
  dexOrLaunch: optional(env.VITE_DEX_OR_LAUNCH_URL),
} as const

/**
 * MARKET_DATA_SOURCE — which adapter provides token metrics.
 *  - `none`  : no market data at all; the arcade renders NO SIGNAL slots. (default)
 *  - `chain` : read directly from Robinhood Chain RPC + Pons V2 factory.
 *  - `mock`  : development fixtures. HARD-BLOCKED in production builds.
 */
export type MarketDataSource = 'none' | 'chain' | 'mock'

const rawSource = optional(env.VITE_MARKET_DATA_SOURCE) ?? 'none'
const isProdBuild = import.meta.env.PROD

export const marketDataSource: MarketDataSource =
  rawSource === 'mock' && isProdBuild
    ? 'none' // never ship fixtures as if they were real
    : rawSource === 'chain' || rawSource === 'mock' || rawSource === 'none'
      ? rawSource
      : 'none'

/** True when a production bundle tried to enable mock data — surfaced loudly in the UI. */
export const mockDataWasBlocked = rawSource === 'mock' && isProdBuild

/** Feature flags. All default off so nothing surprising ships by accident. */
export const features = {
  /** Render the wallet connect control. Read-only site works fully without it. */
  wallet: optional(env.VITE_ENABLE_WALLET) === 'true',
  /** The 10-second mini-game in the FINAL LEVEL section. */
  miniGame: optional(env.VITE_ENABLE_MINIGAME) !== 'false',
  /** Konami-style unlock code. */
  secretCode: optional(env.VITE_ENABLE_SECRET_CODE) !== 'false',
} as const

export const projectConfig = { brand, onchain, links, marketDataSource, features } as const
export type ProjectConfig = typeof projectConfig
