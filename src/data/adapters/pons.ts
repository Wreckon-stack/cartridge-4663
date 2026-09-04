import { getAddress } from 'viem'
import { GME_STOCK_TOKEN_ADDRESS, PONS_V2 } from '@/config/chain.config'
import { onchain } from '@/config/project.config'
import { addressesEqual, checkAddress } from '@/lib/address'
import { pairEconomicsSchema, type PairEconomics } from '../schemas'
import { ponsFactoryAbi, readPhase, type GraduationPhase } from '../abi'
import { getRpcClient, withTimeout } from './rpc-client'

/**
 * Everything we read from the Pons V2 launch factory.
 *
 * The factory is the authority on the pairing: it is the contract that decides
 * whether GME may be used as a quote asset and on what terms. The evidence
 * board renders these values directly, which is why the whole section can claim
 * VERIFIED without anyone having to take our word for anything.
 */

export interface PairingFacts {
  /** approvedPairTokens(GME) — is GME usable as a quote asset at all? */
  readonly gmeApproved: boolean
  /** Protocol economics for a GME-quoted launch. */
  readonly economics: PairEconomics
  /** launchEnabled() — is the factory currently accepting launches? */
  readonly launchEnabled: boolean
  /** memeHook() — confirms the factory and the v4 hook agree with each other. */
  readonly hookAddress: string
  /** True when the hook the factory names is the one we have configured. */
  readonly hookMatchesConfig: boolean
}

/** Read the GME↔Pons relationship. Requires no project token to exist. */
export async function fetchPairingFacts(signal?: AbortSignal): Promise<PairingFacts> {
  const client = getRpcClient()
  const factory = getAddress(PONS_V2.factory)
  const gme = getAddress(onchain.gmeStockTokenAddress || GME_STOCK_TOKEN_ADDRESS)

  const [gmeApproved, economicsTuple, launchEnabled, hookAddress] = await withTimeout(
    Promise.all([
      client.readContract({
        address: factory,
        abi: ponsFactoryAbi,
        functionName: 'approvedPairTokens',
        args: [gme],
      }),
      client.readContract({
        address: factory,
        abi: ponsFactoryAbi,
        functionName: 'pairTokenEconomics',
        args: [gme],
      }),
      client.readContract({ address: factory, abi: ponsFactoryAbi, functionName: 'launchEnabled' }),
      client.readContract({ address: factory, abi: ponsFactoryAbi, functionName: 'memeHook' }),
    ]),
    12_000,
    'Pons factory read',
  )

  signal?.throwIfAborted()

  const [phantomQuote, graduationThreshold, decimals] = economicsTuple

  return {
    gmeApproved,
    economics: pairEconomicsSchema.parse({ phantomQuote, graduationThreshold, decimals }),
    launchEnabled,
    hookAddress,
    hookMatchesConfig: addressesEqual(hookAddress, PONS_V2.hook),
  }
}

export interface LaunchFacts {
  readonly exists: boolean
  readonly curve: string | null
  readonly pairToken: string | null
  readonly graduationThreshold: bigint | null
  readonly phase: GraduationPhase | 'UNKNOWN'
  /** True when the launch record's pair token really is the GME stock token. */
  readonly pairIsGme: boolean
}

/**
 * Read our own launch record.
 *
 * Returns `exists: false` rather than throwing when the token is unconfigured
 * or unknown to the factory — "not launched yet" is a normal state, not an
 * error, and the UI renders it as PRE-LAUNCH.
 */
export async function fetchLaunchFacts(signal?: AbortSignal): Promise<LaunchFacts> {
  const token = checkAddress(onchain.tokenAddress)
  const empty: LaunchFacts = {
    exists: false,
    curve: null,
    pairToken: null,
    graduationThreshold: null,
    phase: 'UNKNOWN',
    pairIsGme: false,
  }
  if (!token.ok) return empty

  const client = getRpcClient()
  const record = await withTimeout(
    client.readContract({
      address: getAddress(PONS_V2.factory),
      abi: ponsFactoryAbi,
      functionName: 'getLaunchedToken',
      args: [token.address],
    }),
    12_000,
    'Pons launch record read',
  )

  signal?.throwIfAborted()
  if (!record.exists) return empty

  return {
    exists: true,
    curve: record.curve,
    pairToken: record.pairToken,
    graduationThreshold: record.graduationThreshold,
    phase: readPhase(record.phase),
    pairIsGme: addressesEqual(record.pairToken, onchain.gmeStockTokenAddress || GME_STOCK_TOKEN_ADDRESS),
  }
}
