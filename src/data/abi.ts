/**
 * Minimal ABI fragments.
 *
 * Only the functions the site actually calls are declared. Each was taken from
 * the verified source published on Blockscout for the address in question —
 * none of it is guessed. The full ABIs are checked into reference/abi/ for
 * anyone who wants to confirm the signatures.
 *
 * Every function here is `view`. This app performs no writes.
 */

export const erc20Abi = [
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const

/**
 * ERC-8056 Scaled UI Amount extension, as implemented by Robinhood Stock
 * Tokens. Returns a WAD-scaled multiplier (1e18 == 1.0) that adjusts DISPLAYED
 * shares for splits and dividends while raw balances stay put.
 *
 * Confirmed live against the GME stock token: returns 1000000000000000000.
 */
export const scaledUiAbi = [
  {
    type: 'function',
    name: 'uiMultiplier',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const

/**
 * PonsV2LaunchFactory — the subset we read.
 * Verified source at 0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e.
 */
export const ponsFactoryAbi = [
  {
    type: 'function',
    name: 'approvedPairTokens',
    stateMutability: 'view',
    inputs: [{ name: 'pairToken', type: 'address' }],
    outputs: [{ name: 'approved', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'pairTokenEconomics',
    stateMutability: 'view',
    inputs: [{ name: 'pairToken', type: 'address' }],
    outputs: [
      { name: 'phantomQuote', type: 'uint256' },
      { name: 'graduationThreshold', type: 'uint256' },
      { name: 'decimals', type: 'uint8' },
    ],
  },
  {
    type: 'function',
    name: 'launchEnabled',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'memeHook',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'getLaunchedToken',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'token', type: 'address' },
          { name: 'curve', type: 'address' },
          { name: 'deployer', type: 'address' },
          { name: 'creatorFeeRecipient', type: 'address' },
          { name: 'pairToken', type: 'address' },
          { name: 'graduationThreshold', type: 'uint256' },
          { name: 'poolFee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'creatorTaxBps', type: 'uint16' },
          { name: 'buybackEnabled', type: 'bool' },
          { name: 'phase', type: 'uint8' },
          { name: 'sweptQuote', type: 'uint256' },
          { name: 'sweptTokens', type: 'uint256' },
          { name: 'sweptAt', type: 'uint256' },
          { name: 'exists', type: 'bool' },
        ],
      },
    ],
  },
] as const

/**
 * GraduationPhase enum from the factory. Index matches the `phase` field above.
 * Used to decide whether the curve or the graduated pool is authoritative.
 */
export const GRADUATION_PHASE = ['ON_CURVE', 'GRADUATING', 'GRADUATED'] as const
export type GraduationPhase = (typeof GRADUATION_PHASE)[number]

export function readPhase(index: number): GraduationPhase | 'UNKNOWN' {
  return GRADUATION_PHASE[index] ?? 'UNKNOWN'
}
