import { GME_STOCK_TOKEN_ADDRESS } from '@/config/chain.config'
import { gmeReferenceSchema, marketMetricsSchema, type GmeReference, type MarketMetrics } from '../schemas'
import { WAD } from '@/lib/units'

/**
 * Development fixtures.
 *
 * These exist so the dashboard's LIVE state can be built and tested before a
 * token is deployed. Three safeguards keep them from ever masquerading as real:
 *
 *  1. `marketDataSource` in project.config.ts forces 'mock' -> 'none' whenever
 *     import.meta.env.PROD is true, so a production bundle cannot select them.
 *  2. The numbers are conspicuous — a price of exactly 0.0369 GME and a round
 *     1,234 holders are obviously synthetic to anyone glancing at them.
 *  3. Every component that consumes them shows the MOCK source badge, driven by
 *     the same config value rather than by a separate flag that could drift.
 *
 * They are validated by the same schema as live data, so a fixture that drifts
 * out of shape fails a test rather than silently rendering.
 */

export const MOCK_METRICS: MarketMetrics = marketMetricsSchema.parse({
  // 0.0369 GME per token — nods to the real 369 GME graduation threshold.
  priceInQuoteWad: 36_900000000000000n,
  quoteSymbol: 'GME',
  marketCapWad: 36_900_000000000000000000n,
  fullyDilutedWad: 36_900_000000000000000000n,
  volume24hWad: 4_812_000000000000000000n,
  liquidityWad: 214_500000000000000000n,
  // +12.34%
  change24hWad: 12_340000000000000000n,
  holders: 1234,
  graduationBps: 5813,
  quoteRaw: 214_500000000000000000n,
  quoteTargetRaw: 369_000000000000000000n,
  graduated: false,
})

export const MOCK_GME: GmeReference = gmeReferenceSchema.parse({
  address: GME_STOCK_TOKEN_ADDRESS,
  symbol: 'GME',
  decimals: 18,
  multiplier: WAD,
  source: 'MOCK FIXTURE — not real data',
})

/** A payload that must fail validation. Used by the integration tests. */
export const MALFORMED_METRICS = {
  priceInQuoteWad: 'not-a-number',
  quoteSymbol: 'GME',
  marketCapWad: null,
  fullyDilutedWad: null,
  volume24hWad: null,
  liquidityWad: null,
  change24hWad: null,
  holders: -5,
  graduationBps: 99_999,
  quoteRaw: null,
  quoteTargetRaw: null,
  graduated: false,
} as const
