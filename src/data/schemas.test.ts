import { describe, expect, it } from 'vitest'
import {
  addressSchema,
  bigintSchema,
  bytes32Schema,
  gmeReferenceSchema,
  launchRecordSchema,
  marketMetricsSchema,
  pairEconomicsSchema,
} from './schemas'
import { MALFORMED_METRICS, MOCK_GME, MOCK_METRICS } from './mock/fixtures'
import { GME_STOCK_TOKEN_ADDRESS } from '@/config/chain.config'
import { WAD } from '@/lib/units'

describe('bigintSchema', () => {
  it('accepts a bigint unchanged', () => {
    expect(bigintSchema.parse(123n)).toBe(123n)
  })

  it('accepts a decimal string, which is how RPC results usually arrive', () => {
    expect(bigintSchema.parse('369000000000000000000')).toBe(369_000000000000000000n)
  })

  it('accepts a hex string', () => {
    expect(bigintSchema.parse('0x1237')).toBe(4663n)
  })

  it('accepts a safe integer number', () => {
    expect(bigintSchema.parse(4663)).toBe(4663n)
  })

  it('REJECTS a fractional number — that means precision was already lost', () => {
    expect(() => bigintSchema.parse(1.5)).toThrow()
  })

  it('rejects garbage rather than coercing it to zero', () => {
    expect(() => bigintSchema.parse('not-a-number')).toThrow()
    expect(() => bigintSchema.parse('')).toThrow()
    expect(() => bigintSchema.parse(null)).toThrow()
    expect(() => bigintSchema.parse({})).toThrow()
  })
})

describe('addressSchema', () => {
  it('accepts a valid address in any casing', () => {
    expect(addressSchema.parse(GME_STOCK_TOKEN_ADDRESS)).toBe(GME_STOCK_TOKEN_ADDRESS)
    expect(() => addressSchema.parse(GME_STOCK_TOKEN_ADDRESS.toLowerCase())).not.toThrow()
  })

  it('rejects malformed addresses', () => {
    expect(() => addressSchema.parse('0x123')).toThrow()
    expect(() => addressSchema.parse('nope')).toThrow()
  })
})

describe('bytes32Schema', () => {
  it('accepts a 32-byte hex value', () => {
    expect(() => bytes32Schema.parse('0x' + 'a'.repeat(64))).not.toThrow()
  })

  it('rejects a 20-byte address', () => {
    expect(() => bytes32Schema.parse(GME_STOCK_TOKEN_ADDRESS)).toThrow()
  })
})

describe('marketMetricsSchema', () => {
  it('accepts the mock fixture, so fixtures cannot drift out of shape', () => {
    expect(() => marketMetricsSchema.parse(MOCK_METRICS)).not.toThrow()
  })

  it('accepts an all-null payload — a source with no metrics is valid, not an error', () => {
    const empty = {
      priceInQuoteWad: null,
      quoteSymbol: 'GME',
      marketCapWad: null,
      fullyDilutedWad: null,
      volume24hWad: null,
      liquidityWad: null,
      change24hWad: null,
      holders: null,
      graduationBps: null,
      quoteRaw: null,
      quoteTargetRaw: null,
      graduated: null,
    }
    expect(() => marketMetricsSchema.parse(empty)).not.toThrow()
  })

  it('REJECTS a malformed provider payload rather than rendering it', () => {
    expect(() => marketMetricsSchema.parse(MALFORMED_METRICS)).toThrow()
  })

  it('rejects a negative holder count', () => {
    expect(() => marketMetricsSchema.parse({ ...MOCK_METRICS, holders: -1 })).toThrow()
  })

  it('rejects graduation progress outside 0..10000', () => {
    expect(() => marketMetricsSchema.parse({ ...MOCK_METRICS, graduationBps: 10_001 })).toThrow()
    expect(() => marketMetricsSchema.parse({ ...MOCK_METRICS, graduationBps: -1 })).toThrow()
  })
})

describe('gmeReferenceSchema', () => {
  it('accepts the mock reference', () => {
    expect(() => gmeReferenceSchema.parse(MOCK_GME)).not.toThrow()
  })

  it('requires a source string, so a value can never be rendered unattributed', () => {
    expect(() => gmeReferenceSchema.parse({ ...MOCK_GME, source: '' })).toThrow()
  })

  it('rejects an implausible decimals value', () => {
    expect(() => gmeReferenceSchema.parse({ ...MOCK_GME, decimals: 99 })).toThrow()
  })
})

describe('pairEconomicsSchema', () => {
  it('parses the real GME economics read from the factory', () => {
    const parsed = pairEconomicsSchema.parse({
      phantomQuote: '147600000000000000000',
      graduationThreshold: '369000000000000000000',
      decimals: 18,
    })
    expect(parsed.graduationThreshold).toBe(369n * WAD)
    expect(parsed.phantomQuote).toBe(147_600000000000000000n)
  })
})

describe('launchRecordSchema', () => {
  it('parses a launch record', () => {
    expect(() =>
      launchRecordSchema.parse({
        token: GME_STOCK_TOKEN_ADDRESS,
        curve: GME_STOCK_TOKEN_ADDRESS,
        deployer: GME_STOCK_TOKEN_ADDRESS,
        pairToken: GME_STOCK_TOKEN_ADDRESS,
        graduationThreshold: 369n * WAD,
        exists: true,
      }),
    ).not.toThrow()
  })

  it('rejects a record with a bad address', () => {
    expect(() =>
      launchRecordSchema.parse({
        token: 'nope',
        curve: GME_STOCK_TOKEN_ADDRESS,
        deployer: GME_STOCK_TOKEN_ADDRESS,
        pairToken: GME_STOCK_TOKEN_ADDRESS,
        graduationThreshold: 0n,
        exists: true,
      }),
    ).toThrow()
  })
})
