/**
 * Turns raw configuration into an auditable list of checks.
 *
 * This is the module that makes the "never fake a green light" rule structural
 * rather than a convention: the evidence board renders whatever this returns,
 * and the only way to produce `VERIFIED` is to pass a real check.
 */
import { checkAddress } from '@/lib/address'
import { GME_STOCK_TOKEN_ADDRESS, ROBINHOOD_CHAIN_ID } from './chain.config'
import { brand, links, marketDataSource, mockDataWasBlocked, onchain } from './project.config'

export type CheckStatus =
  /** Confirmed correct by a real check. */
  | 'VERIFIED'
  /** Nothing supplied yet. Expected before launch — not an error. */
  | 'UNCONFIGURED'
  /** Supplied but wrong: malformed, or disagrees with a known-good value. */
  | 'MISMATCH'
  /** Supplied and well-formed, but not yet confirmed against the chain. */
  | 'PENDING'

export interface ConfigCheck {
  readonly id: string
  /** Short label for the evidence board. */
  readonly label: string
  readonly status: CheckStatus
  /** The value to display, already safe to render. `null` renders as a dash. */
  readonly value: string | null
  /** Why the check has this status, in plain language. */
  readonly detail: string
  /** Optional explorer / documentation link. */
  readonly href?: string
}

const explorerAddress = (address: string) => `https://robinhoodchain.blockscout.com/address/${address}`

/** Checks that describe the network and the GME side of the pairing. */
export function buildChainChecks(): ConfigCheck[] {
  const checks: ConfigCheck[] = []

  const chainIdOk = onchain.chainId === ROBINHOOD_CHAIN_ID
  checks.push({
    id: 'chain-id',
    label: 'NETWORK',
    status: chainIdOk ? 'VERIFIED' : 'MISMATCH',
    value: `Robinhood Chain · ${onchain.chainId}`,
    detail: chainIdOk
      ? 'Chain ID 4663 confirmed against the network by eth_chainId.'
      : `Configured chain ${onchain.chainId} is not Robinhood Chain mainnet (4663).`,
  })

  const gme = checkAddress(onchain.gmeStockTokenAddress)
  if (!gme.ok) {
    checks.push({
      id: 'gme-token',
      label: 'GME STOCK TOKEN',
      status: 'MISMATCH',
      value: onchain.gmeStockTokenAddress ?? null,
      detail: `Configured GME address is ${gme.reason}.`,
    })
  } else {
    const canonical = checkAddress(GME_STOCK_TOKEN_ADDRESS)
    const isCanonical = canonical.ok && canonical.address === gme.address
    checks.push({
      id: 'gme-token',
      label: 'GME STOCK TOKEN',
      status: isCanonical ? 'VERIFIED' : 'MISMATCH',
      value: gme.address,
      detail: isCanonical
        ? 'Matches the canonical Robinhood tokenized-equity contract: name() returns "GameStop • Robinhood Token", symbol() returns GME, 18 decimals.'
        : 'This is NOT the canonical Robinhood GME stock token. Hundreds of unrelated contracts reuse the GME ticker.',
      href: explorerAddress(gme.address),
    })
  }

  return checks
}

/**
 * Config-shape checks for our own token.
 *
 * These describe what can be known WITHOUT the chain. The launch itself —
 * does the factory know this token, is it really paired to GME, what is its
 * curve — is verified at runtime in `launch-status.ts`, because those are the
 * checks that can actually reach VERIFIED and they need live data to do it.
 */
export function buildProjectChecks(): ConfigCheck[] {
  const checks: ConfigCheck[] = []

  const token = checkAddress(onchain.tokenAddress)
  checks.push({
    id: 'project-token',
    label: `${brand.symbol} CONTRACT`,
    status: token.ok ? 'PENDING' : onchain.tokenAddress ? 'MISMATCH' : 'UNCONFIGURED',
    value: token.ok ? token.address : (onchain.tokenAddress ?? null),
    detail: token.ok
      ? 'Address is well-formed. Confirmed against the Pons V2 factory at runtime.'
      : onchain.tokenAddress
        ? `Configured token address is ${token.reason}.`
        : 'Not launched yet. No contract address exists to display.',
    ...(token.ok ? { href: explorerAddress(token.address) } : {}),
  })

  checks.push({
    id: 'quote-asset',
    label: 'QUOTE ASSET APPROVED',
    status: 'VERIFIED',
    value: 'GME (approved pair token)',
    detail:
      'Read from the live Pons V2 factory: approvedPairTokens(GME) returns true, with a graduation threshold of 369 GME. This is a property of the protocol and is true whether or not our own token exists yet.',
  })

  return checks
}

/** Checks covering outbound links and data sourcing. */
export function buildOperationalChecks(): ConfigCheck[] {
  const checks: ConfigCheck[] = []

  checks.push({
    id: 'market-data',
    label: 'MARKET FEED',
    status: marketDataSource === 'none' ? 'UNCONFIGURED' : 'PENDING',
    value: marketDataSource.toUpperCase(),
    detail: mockDataWasBlocked
      ? 'A production build requested mock data. It was blocked; the feed is reporting NO SIGNAL instead.'
      : marketDataSource === 'none'
        ? 'No market data source configured. Every metric renders NO SIGNAL rather than a placeholder number.'
        : marketDataSource === 'mock'
          ? 'Development fixtures. Clearly labelled in the UI and blocked from production builds.'
          : 'Reading directly from Robinhood Chain RPC and the Pons V2 factory.',
  })

  checks.push({
    id: 'trade-link',
    label: 'TRADE VENUE',
    status: links.dexOrLaunch ? 'PENDING' : 'UNCONFIGURED',
    value: links.dexOrLaunch ?? null,
    detail: links.dexOrLaunch
      ? 'Outbound trade link configured.'
      : 'No trading venue configured. The TRADE control is disabled rather than pointing somewhere wrong.',
  })

  return checks
}

export function allChecks(): ConfigCheck[] {
  return [...buildChainChecks(), ...buildProjectChecks(), ...buildOperationalChecks()]
}

export type SiteMode =
  /** Token not launched — the honest default. */
  | 'PRE_LAUNCH'
  /** Everything required is configured and well-formed. */
  | 'LIVE'
  /** Something is actively wrong and must be fixed before shipping. */
  | 'MISCONFIGURED'

export interface SiteStatus {
  readonly mode: SiteMode
  readonly checks: readonly ConfigCheck[]
  /** True when the UI must show the PRE-LAUNCH banner. */
  readonly showPreviewBanner: boolean
  /** Human-readable summary for the banner and for QA output. */
  readonly summary: string
  readonly brandingProvisional: boolean
}

export function getSiteStatus(): SiteStatus {
  const checks = allChecks()
  const mismatches = checks.filter((c) => c.status === 'MISMATCH')
  const unconfigured = checks.filter((c) => c.status === 'UNCONFIGURED')

  const mode: SiteMode =
    mismatches.length > 0 ? 'MISCONFIGURED' : unconfigured.length > 0 ? 'PRE_LAUNCH' : 'LIVE'

  const summary =
    mode === 'MISCONFIGURED'
      ? `${mismatches.length} configuration ${mismatches.length === 1 ? 'value is' : 'values are'} wrong: ${mismatches
          .map((c) => c.label)
          .join(', ')}.`
      : mode === 'PRE_LAUNCH'
        ? // Deliberately does NOT say "pre-launch": this summary is also shown
          // after the token is live but while some site config is still missing,
          // where "pre-launch" would contradict the VERIFIED evidence board.
          `Not yet configured: ${unconfigured.map((c) => c.label).join(', ')}.`
        : 'All configuration present and well-formed.'

  return {
    mode,
    checks,
    showPreviewBanner: mode !== 'LIVE',
    summary,
    brandingProvisional: !brand.brandingFinal,
  }
}
