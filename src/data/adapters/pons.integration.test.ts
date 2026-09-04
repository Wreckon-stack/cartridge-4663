import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encodeAbiParameters, parseAbiParameters, toFunctionSelector } from 'viem'
import { GME_STOCK_TOKEN_ADDRESS, PONS_V2 } from '@/config/chain.config'
import { ponsFactoryAbi } from '../abi'

/**
 * Integration tests for the Pons adapter.
 *
 * These drive the real adapter and the real viem client, replacing only the
 * outermost network call. That means ABI encoding, decoding, schema validation
 * and the pairing logic are all genuinely exercised — the only thing faked is
 * the wire.
 */

const FACTORY = PONS_V2.factory.toLowerCase()

/** Build a fetch stub that answers eth_call from a selector -> hex-data map. */
function mockRpc(handlers: Record<string, string | (() => never)>) {
  return vi.fn(async (_url: unknown, init?: { body?: string }) => {
    const body = JSON.parse(init?.body ?? '{}')
    const calls = Array.isArray(body) ? body : [body]

    const responses = calls.map((call: { id: number; method: string; params?: unknown[] }) => {
      if (call.method === 'eth_chainId') return { jsonrpc: '2.0', id: call.id, result: '0x1237' }
      if (call.method !== 'eth_call') {
        return { jsonrpc: '2.0', id: call.id, error: { code: -32601, message: 'unsupported' } }
      }
      const params = call.params as [{ to: string; data: string }, string]
      const selector = params[0].data.slice(0, 10)
      const handler = handlers[selector]
      if (typeof handler === 'function') handler()
      if (handler == null) {
        return { jsonrpc: '2.0', id: call.id, error: { code: -32000, message: `no handler ${selector}` } }
      }
      return { jsonrpc: '2.0', id: call.id, result: handler }
    })

    return new Response(JSON.stringify(Array.isArray(body) ? responses : responses[0]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
}

const sel = (name: string) => toFunctionSelector(ponsFactoryAbi.find((f) => 'name' in f && f.name === name)!)

const encodeBool = (value: boolean) => encodeAbiParameters(parseAbiParameters('bool'), [value])
const encodeAddress = (value: `0x${string}`) => encodeAbiParameters(parseAbiParameters('address'), [value])
const encodeEconomics = (phantom: bigint, threshold: bigint, decimals: number) =>
  encodeAbiParameters(parseAbiParameters('uint256, uint256, uint8'), [phantom, threshold, decimals])

/** The real values currently on chain, so the fixtures are not invented. */
const REAL_PHANTOM = 147_600000000000000000n
const REAL_THRESHOLD = 369_000000000000000000n

beforeEach(async () => {
  vi.resetModules()
  const { resetRpcClient } = await import('./rpc-client')
  resetRpcClient()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchPairingFacts with a well-formed response', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      mockRpc({
        [sel('approvedPairTokens')]: encodeBool(true),
        [sel('pairTokenEconomics')]: encodeEconomics(REAL_PHANTOM, REAL_THRESHOLD, 18),
        [sel('launchEnabled')]: encodeBool(true),
        [sel('memeHook')]: encodeAddress(PONS_V2.hook as `0x${string}`),
      }),
    )
  })

  it('reports GME as an approved quote asset', async () => {
    const { fetchPairingFacts } = await import('./pons')
    const facts = await fetchPairingFacts()
    expect(facts.gmeApproved).toBe(true)
  })

  it('decodes the real graduation economics', async () => {
    const { fetchPairingFacts } = await import('./pons')
    const facts = await fetchPairingFacts()
    expect(facts.economics.graduationThreshold).toBe(REAL_THRESHOLD)
    expect(facts.economics.phantomQuote).toBe(REAL_PHANTOM)
    expect(facts.economics.decimals).toBe(18)
  })

  it('confirms the hook the factory names matches our configuration', async () => {
    const { fetchPairingFacts } = await import('./pons')
    const facts = await fetchPairingFacts()
    expect(facts.hookMatchesConfig).toBe(true)
  })

  it('addresses the configured factory, not some other contract', async () => {
    const { fetchPairingFacts } = await import('./pons')
    await fetchPairingFacts()
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse((c[1] as { body: string }).body))
    const flattened = bodies.flatMap((b) => (Array.isArray(b) ? b : [b]))
    const targets = flattened
      .filter((c: { method: string }) => c.method === 'eth_call')
      .map((c: { params: [{ to: string }] }) => c.params[0].to.toLowerCase())
    expect(targets.length).toBeGreaterThan(0)
    for (const target of targets) expect(target).toBe(FACTORY)
  })
})

describe('pairing validation detects a mismatched hook', () => {
  it('reports MISMATCH rather than quietly accepting a different hook', async () => {
    vi.stubGlobal(
      'fetch',
      mockRpc({
        [sel('approvedPairTokens')]: encodeBool(true),
        [sel('pairTokenEconomics')]: encodeEconomics(REAL_PHANTOM, REAL_THRESHOLD, 18),
        [sel('launchEnabled')]: encodeBool(true),
        // A different (but valid) address.
        [sel('memeHook')]: encodeAddress(GME_STOCK_TOKEN_ADDRESS as `0x${string}`),
      }),
    )
    const { fetchPairingFacts } = await import('./pons')
    const facts = await fetchPairingFacts()
    expect(facts.hookMatchesConfig).toBe(false)
  })
})

describe('pairing detects GME being un-approved', () => {
  it('surfaces gmeApproved:false rather than assuming the pairing works', async () => {
    vi.stubGlobal(
      'fetch',
      mockRpc({
        [sel('approvedPairTokens')]: encodeBool(false),
        [sel('pairTokenEconomics')]: encodeEconomics(0n, 0n, 0),
        [sel('launchEnabled')]: encodeBool(true),
        [sel('memeHook')]: encodeAddress(PONS_V2.hook as `0x${string}`),
      }),
    )
    const { fetchPairingFacts } = await import('./pons')
    const facts = await fetchPairingFacts()
    expect(facts.gmeApproved).toBe(false)
    expect(facts.economics.graduationThreshold).toBe(0n)
  })
})

describe('failure handling', () => {
  it('rejects when the RPC returns an error, producing an honest ERROR state', async () => {
    vi.stubGlobal('fetch', mockRpc({}))
    const { fetchPairingFacts } = await import('./pons')
    await expect(fetchPairingFacts()).rejects.toThrow()
  })

  it('rejects when the transport itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    const { fetchPairingFacts } = await import('./pons')
    await expect(fetchPairingFacts()).rejects.toThrow()
  })

  it('rejects a malformed (non-hex) payload rather than rendering garbage', async () => {
    vi.stubGlobal(
      'fetch',
      mockRpc({
        [sel('approvedPairTokens')]: '0xnothexatall',
        [sel('pairTokenEconomics')]: encodeEconomics(REAL_PHANTOM, REAL_THRESHOLD, 18),
        [sel('launchEnabled')]: encodeBool(true),
        [sel('memeHook')]: encodeAddress(PONS_V2.hook as `0x${string}`),
      }),
    )
    const { fetchPairingFacts } = await import('./pons')
    await expect(fetchPairingFacts()).rejects.toThrow()
  })
})

describe('fetchLaunchFacts before launch', () => {
  it('returns "does not exist" without making a call when no token is configured', async () => {
    const fetchMock = mockRpc({})
    vi.stubGlobal('fetch', fetchMock)
    const { fetchLaunchFacts } = await import('./pons')
    const facts = await fetchLaunchFacts()
    expect(facts.exists).toBe(false)
    expect(facts.curve).toBeNull()
    expect(facts.pairIsGme).toBe(false)
    // No token address means there is nothing to ask the chain about.
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
