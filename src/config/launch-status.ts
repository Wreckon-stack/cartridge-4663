/**
 * RUNTIME launch verification.
 *
 * `config-status.ts` can only check the *shape* of configuration — is this a
 * well-formed address, is it the canonical GME contract. That is all you can
 * know before a token exists.
 *
 * This module is the other half: once `VITE_TOKEN_ADDRESS` is set, it takes the
 * live launch record from the Pons V2 factory and confirms that the token was
 * genuinely launched, that its pair token really is the GME stock token, and
 * that its graduation threshold matches the protocol's published GME economics.
 *
 * Those checks can reach VERIFIED. They are the ones that matter on launch day.
 *
 * NOTE: the bonding-curve address is DERIVED from the factory here, not
 * configured. `VITE_PONS_POOL_OR_LAUNCH_ID` is therefore optional — supply it
 * only if you want the site to cross-check the factory's answer against a value
 * you recorded yourself.
 */
import { GME_STOCK_TOKEN_ADDRESS } from './chain.config'
import { brand, onchain } from './project.config'
import { addressesEqual, checkAddress } from '@/lib/address'
import { formatCompactWad } from '@/lib/format'
import type { Reading } from '@/lib/data-health'
import type { LaunchFacts, PairingFacts } from '@/data/adapters/pons'
import type { ConfigCheck } from './config-status'

const explorerAddress = (address: string) => `https://robinhoodchain.blockscout.com/address/${address}`

/** Human-readable description of where the launch is in its lifecycle. */
const PHASE_COPY: Record<string, string> = {
  ON_CURVE: 'Trading on the bonding curve. Liquidity graduates to Uniswap v4 at the threshold.',
  GRADUATING: 'Graduating now — liquidity is moving into the locked Uniswap v4 pool.',
  GRADUATED: 'Graduated. Trading has moved to the permanently locked Uniswap v4 pool.',
  UNKNOWN: 'The factory returned a lifecycle phase this build does not recognise.',
}

/**
 * Build the launch checks from live chain state.
 *
 * Both readings are passed in rather than fetched here so this stays a pure
 * function — it is trivially testable, and it cannot accidentally trigger a
 * network call from inside a render.
 */
export function buildLaunchChecks(
  launch: Reading<LaunchFacts>,
  pairing: Reading<PairingFacts>,
): ConfigCheck[] {
  const checks: ConfigCheck[] = []
  const token = checkAddress(onchain.tokenAddress)

  // ── 1. The token contract ────────────────────────────────────────────────
  if (!token.ok) {
    checks.push({
      id: 'project-token',
      label: `${brand.symbol} CONTRACT`,
      status: onchain.tokenAddress ? 'MISMATCH' : 'UNCONFIGURED',
      value: onchain.tokenAddress ?? null,
      detail: onchain.tokenAddress
        ? `Configured token address is ${token.reason}. Fix VITE_TOKEN_ADDRESS.`
        : 'Not launched yet. Set VITE_TOKEN_ADDRESS once the token is deployed and every check below verifies itself against the chain.',
    })
    return [...checks, ...unlaunchedRemainder()]
  }

  const facts = launch.value
  const stillReading = launch.status === 'LOADING'
  const readFailed = launch.status === 'ERROR' && facts == null

  checks.push({
    id: 'project-token',
    label: `${brand.symbol} CONTRACT`,
    status: readFailed ? 'PENDING' : stillReading ? 'PENDING' : facts?.exists ? 'VERIFIED' : 'MISMATCH',
    value: token.address,
    detail: readFailed
      ? 'Could not reach the chain to confirm this address. Retrying.'
      : stillReading
        ? 'Confirming against the Pons V2 factory…'
        : facts?.exists
          ? 'Confirmed: the Pons V2 launch factory holds a launch record for this contract.'
          : 'The Pons V2 factory has NO launch record for this address. It was not launched through Pons V2, or the address is wrong.',
    href: explorerAddress(token.address),
  })

  // ── 2. The pairing itself — the headline check ───────────────────────────
  const gmeAddress = onchain.gmeStockTokenAddress || GME_STOCK_TOKEN_ADDRESS
  const pairMatches = facts?.exists === true && facts.pairIsGme

  checks.push({
    id: 'gme-pair',
    label: 'GME PAIR CONFIRMED',
    status: !facts?.exists
      ? stillReading || readFailed
        ? 'PENDING'
        : 'UNCONFIGURED'
      : pairMatches
        ? 'VERIFIED'
        : 'MISMATCH',
    value: facts?.pairToken ?? null,
    detail: !facts?.exists
      ? 'Waiting on a launch record before the pair asset can be confirmed.'
      : pairMatches
        ? `Confirmed on chain: this launch's pair token is the canonical GME stock token (${gmeAddress}). Every buy and sell is denominated in GME.`
        : `WARNING — this launch is paired against ${facts.pairToken}, which is NOT the GME stock token. The pairing claims on this page do not hold.`,
    ...(facts?.pairToken ? { href: explorerAddress(facts.pairToken) } : {}),
  })

  // ── 3. The bonding curve, derived not configured ─────────────────────────
  const configuredCurve = checkAddress(onchain.ponsPoolOrLaunchId)
  const curveDisagrees =
    configuredCurve.ok && facts?.curve != null && !addressesEqual(configuredCurve.address, facts.curve)

  checks.push({
    id: 'pons-launch',
    label: 'BONDING CURVE',
    status: !facts?.exists
      ? stillReading || readFailed
        ? 'PENDING'
        : 'UNCONFIGURED'
      : curveDisagrees
        ? 'MISMATCH'
        : 'VERIFIED',
    value: facts?.curve ?? null,
    detail: !facts?.exists
      ? 'Read from the factory once the token is launched — you do not need to configure it.'
      : curveDisagrees
        ? `The factory reports ${facts.curve}, but VITE_PONS_POOL_OR_LAUNCH_ID is set to ${configuredCurve.address}. Trust the factory; fix or remove the env var.`
        : 'Read directly from the factory launch record. Not hand-configured, so it cannot drift.',
    ...(facts?.curve ? { href: explorerAddress(facts.curve) } : {}),
  })

  // ── 4. Threshold agreement ───────────────────────────────────────────────
  const protocolThreshold = pairing.value?.economics.graduationThreshold
  const launchThreshold = facts?.graduationThreshold
  const thresholdsAgree =
    protocolThreshold != null && launchThreshold != null && protocolThreshold === launchThreshold

  checks.push({
    id: 'graduation-threshold',
    label: 'GRADUATION THRESHOLD',
    status:
      launchThreshold == null
        ? 'UNCONFIGURED'
        : protocolThreshold == null
          ? 'PENDING'
          : thresholdsAgree
            ? 'VERIFIED'
            : 'MISMATCH',
    value: launchThreshold != null ? formatCompactWad(launchThreshold, 'GME') : null,
    detail:
      launchThreshold == null
        ? 'Available once the token is launched.'
        : protocolThreshold == null
          ? 'Comparing against the factory economics…'
          : thresholdsAgree
            ? "This launch's threshold matches the protocol's published economics for a GME-quoted launch."
            : `This launch requires ${formatCompactWad(launchThreshold, 'GME')} but the protocol currently publishes ${formatCompactWad(protocolThreshold, 'GME')} for GME. The parameters may have changed since launch.`,
  })

  // ── 5. Lifecycle phase ───────────────────────────────────────────────────
  if (facts?.exists) {
    checks.push({
      id: 'launch-phase',
      label: 'LAUNCH PHASE',
      status: facts.phase === 'UNKNOWN' ? 'MISMATCH' : 'VERIFIED',
      value: facts.phase.replace('_', ' '),
      detail: PHASE_COPY[facts.phase] ?? PHASE_COPY.UNKNOWN!,
    })
  }

  return checks
}

/** Rows that only make sense to show while there is no token at all. */
function unlaunchedRemainder(): ConfigCheck[] {
  return [
    {
      id: 'gme-pair',
      label: 'GME PAIR CONFIRMED',
      status: 'UNCONFIGURED',
      value: null,
      detail:
        'Confirmed automatically from the launch record once the token exists. Until then this row stays blank rather than claiming a pairing that has not happened.',
    },
    {
      id: 'pons-launch',
      label: 'BONDING CURVE',
      status: 'UNCONFIGURED',
      value: null,
      detail: 'Derived from the Pons V2 factory at launch. You do not need to configure it by hand.',
    },
  ]
}

/**
 * True only when the token is launched AND genuinely paired to GME.
 * Used to decide whether the site may drop its PRE-LAUNCH framing.
 */
export function isLaunchConfirmed(launch: Reading<LaunchFacts>): boolean {
  const facts = launch.value
  return facts?.exists === true && facts.pairIsGme
}
