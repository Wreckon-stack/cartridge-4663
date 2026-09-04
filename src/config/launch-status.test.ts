import { afterEach, describe, expect, it, vi } from 'vitest'
import { live, noSignal, type Reading } from '@/lib/data-health'
import { GME_STOCK_TOKEN_ADDRESS, PONS_V2 } from './chain.config'
import type { LaunchFacts, PairingFacts } from '@/data/adapters/pons'
import type { ConfigCheck } from './config-status'
import { WAD } from '@/lib/units'

const TOKEN = '0xe4a0D07F2c2cF083cC715333ea0F16fBB7087e86'
const CURVE = '0x40b66F016e0710eA15007E13F3ed80026Bc97912'
const NOT_GME = '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168' // USDG

const PAIRING: PairingFacts = {
  gmeApproved: true,
  economics: { phantomQuote: 147_600000000000000000n, graduationThreshold: 369n * WAD, decimals: 18 },
  launchEnabled: true,
  hookAddress: PONS_V2.hook,
  hookMatchesConfig: true,
}

function launched(overrides: Partial<LaunchFacts> = {}): Reading<LaunchFacts> {
  return live<LaunchFacts>({
    exists: true,
    curve: CURVE,
    pairToken: GME_STOCK_TOKEN_ADDRESS,
    graduationThreshold: 369n * WAD,
    phase: 'ON_CURVE',
    pairIsGme: true,
    ...overrides,
  })
}

/** Re-import with a stubbed env so `onchain.tokenAddress` reflects the case. */
async function withToken(address: string | undefined) {
  vi.resetModules()
  if (address === undefined) vi.stubEnv('VITE_TOKEN_ADDRESS', '')
  else vi.stubEnv('VITE_TOKEN_ADDRESS', address)
  return import('./launch-status')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

const byId = (checks: ConfigCheck[], id: string) => checks.find((c) => c.id === id)

describe('before a token exists', () => {
  it('reports the contract as UNCONFIGURED, not as an error', async () => {
    const { buildLaunchChecks } = await withToken(undefined)
    const checks = buildLaunchChecks(noSignal(), live(PAIRING))
    expect(byId(checks, 'project-token')?.status).toBe('UNCONFIGURED')
  })

  it('does NOT claim a GME pairing', async () => {
    const { buildLaunchChecks } = await withToken(undefined)
    const checks = buildLaunchChecks(noSignal(), live(PAIRING))
    const pair = byId(checks, 'gme-pair')
    expect(pair?.status).toBe('UNCONFIGURED')
    expect(pair?.value).toBeNull()
  })

  it('tells the operator which single variable to set', async () => {
    const { buildLaunchChecks } = await withToken(undefined)
    const checks = buildLaunchChecks(noSignal(), live(PAIRING))
    expect(byId(checks, 'project-token')?.detail).toContain('VITE_TOKEN_ADDRESS')
  })

  it('is not "confirmed"', async () => {
    const { isLaunchConfirmed } = await withToken(undefined)
    expect(isLaunchConfirmed(noSignal())).toBe(false)
  })
})

describe('a genuine GME-paired launch', () => {
  it('verifies the token contract against the factory record', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    const checks = buildLaunchChecks(launched(), live(PAIRING))
    expect(byId(checks, 'project-token')?.status).toBe('VERIFIED')
  })

  it('confirms the GME pairing', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    const pair = byId(buildLaunchChecks(launched(), live(PAIRING)), 'gme-pair')
    expect(pair?.status).toBe('VERIFIED')
    expect(pair?.value).toBe(GME_STOCK_TOKEN_ADDRESS)
  })

  it('derives the bonding curve from the factory without configuration', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    const curve = byId(buildLaunchChecks(launched(), live(PAIRING)), 'pons-launch')
    expect(curve?.status).toBe('VERIFIED')
    expect(curve?.value).toBe(CURVE)
    expect(curve?.detail).toContain('Read directly from the factory')
  })

  it('confirms the threshold matches the protocol economics', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    expect(byId(buildLaunchChecks(launched(), live(PAIRING)), 'graduation-threshold')?.status).toBe(
      'VERIFIED',
    )
  })

  it('reports the lifecycle phase', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    const phase = byId(buildLaunchChecks(launched(), live(PAIRING)), 'launch-phase')
    expect(phase?.status).toBe('VERIFIED')
    expect(phase?.value).toBe('ON CURVE')
  })

  it('reports GRADUATED once liquidity has moved', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    const phase = byId(buildLaunchChecks(launched({ phase: 'GRADUATED' }), live(PAIRING)), 'launch-phase')
    expect(phase?.value).toBe('GRADUATED')
    expect(phase?.detail).toContain('locked Uniswap v4 pool')
  })

  it('is confirmed', async () => {
    const { isLaunchConfirmed } = await withToken(TOKEN)
    expect(isLaunchConfirmed(launched())).toBe(true)
  })
})

describe('the failure modes that must never pass silently', () => {
  it('MISMATCHes when the launch is paired to something other than GME', async () => {
    const { buildLaunchChecks, isLaunchConfirmed } = await withToken(TOKEN)
    const reading = launched({ pairToken: NOT_GME, pairIsGme: false })
    const pair = byId(buildLaunchChecks(reading, live(PAIRING)), 'gme-pair')
    expect(pair?.status).toBe('MISMATCH')
    expect(pair?.detail).toContain('NOT the GME stock token')
    expect(isLaunchConfirmed(reading)).toBe(false)
  })

  it('MISMATCHes when the factory has no record for the configured address', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    const reading = live<LaunchFacts>({
      exists: false,
      curve: null,
      pairToken: null,
      graduationThreshold: null,
      phase: 'UNKNOWN',
      pairIsGme: false,
    })
    const check = byId(buildLaunchChecks(reading, live(PAIRING)), 'project-token')
    expect(check?.status).toBe('MISMATCH')
    expect(check?.detail).toContain('NO launch record')
  })

  it('MISMATCHes when a hand-configured curve disagrees with the factory', async () => {
    vi.stubEnv('VITE_PONS_POOL_OR_LAUNCH_ID', NOT_GME)
    const { buildLaunchChecks } = await withToken(TOKEN)
    const curve = byId(buildLaunchChecks(launched(), live(PAIRING)), 'pons-launch')
    expect(curve?.status).toBe('MISMATCH')
    expect(curve?.detail).toContain('Trust the factory')
  })

  it('MISMATCHes on a malformed token address', async () => {
    const { buildLaunchChecks } = await withToken('0xnope')
    const check = byId(buildLaunchChecks(noSignal(), live(PAIRING)), 'project-token')
    expect(check?.status).toBe('MISMATCH')
  })

  it('MISMATCHes when the launch threshold disagrees with the protocol', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    const reading = launched({ graduationThreshold: 500n * WAD })
    const check = byId(buildLaunchChecks(reading, live(PAIRING)), 'graduation-threshold')
    expect(check?.status).toBe('MISMATCH')
  })
})

describe('while the chain read is in flight', () => {
  it('shows PENDING rather than a premature verdict', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    const loading: Reading<LaunchFacts> = { status: 'LOADING', value: null, fetchedAt: null }
    const checks = buildLaunchChecks(loading, live(PAIRING))
    expect(byId(checks, 'project-token')?.status).toBe('PENDING')
    expect(byId(checks, 'gme-pair')?.status).toBe('PENDING')
  })

  it('never reports VERIFIED without a value to back it', async () => {
    const { buildLaunchChecks } = await withToken(TOKEN)
    for (const reading of [
      noSignal<LaunchFacts>(),
      { status: 'LOADING', value: null, fetchedAt: null } as Reading<LaunchFacts>,
    ]) {
      for (const check of buildLaunchChecks(reading, live(PAIRING))) {
        if (check.status === 'VERIFIED') expect(check.value).not.toBeNull()
      }
    }
  })
})
