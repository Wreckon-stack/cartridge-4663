import { z } from 'zod'

/**
 * Runtime validation for everything that crosses the network boundary.
 *
 * RPC responses and third-party APIs are untrusted input. TypeScript types
 * describe what we *hope* arrives; these schemas check what actually did. A
 * payload that fails validation becomes an honest ERROR state — it never
 * reaches a component as a half-populated object.
 */

/** A 0x address, any casing. Normalised to lower-case for comparison. */
export const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Not a 20-byte hex address')

/** A 32-byte hex string — pool ids, tx hashes. */
export const bytes32Schema = z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Not a 32-byte hex value')

/**
 * A non-negative integer arriving as a decimal string, hex string, number or
 * bigint, normalised to bigint. Anything fractional is rejected outright: a
 * fractional raw balance means the source has already lost precision.
 */
export const bigintSchema = z.union([z.bigint(), z.number(), z.string()]).transform((value, ctx): bigint => {
  try {
    if (typeof value === 'bigint') return value
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        ctx.addIssue({ code: 'custom', message: 'Refusing a fractional value as a raw token amount' })
        return z.NEVER
      }
      return BigInt(value)
    }
    const trimmed = value.trim()
    if (trimmed === '') {
      ctx.addIssue({ code: 'custom', message: 'Empty string is not a number' })
      return z.NEVER
    }
    return BigInt(trimmed)
  } catch {
    ctx.addIssue({ code: 'custom', message: `Cannot read ${String(value)} as an integer` })
    return z.NEVER
  }
})

export const decimalsSchema = z.number().int().min(0).max(36)

/** The launch record returned by PonsV2LaunchFactory.getLaunchedToken(). */
export const launchRecordSchema = z.object({
  token: addressSchema,
  curve: addressSchema,
  deployer: addressSchema,
  pairToken: addressSchema,
  graduationThreshold: bigintSchema,
  exists: z.boolean(),
})
export type LaunchRecord = z.infer<typeof launchRecordSchema>

/** pairTokenEconomics(pairToken) — protocol parameters for a quote asset. */
export const pairEconomicsSchema = z.object({
  phantomQuote: bigintSchema,
  graduationThreshold: bigintSchema,
  decimals: decimalsSchema,
})
export type PairEconomics = z.infer<typeof pairEconomicsSchema>

/** Standard ERC-20 metadata. */
export const tokenMetaSchema = z.object({
  address: addressSchema,
  name: z.string().min(1).max(128),
  symbol: z.string().min(1).max(32),
  decimals: decimalsSchema,
  totalSupply: bigintSchema,
})
export type TokenMeta = z.infer<typeof tokenMetaSchema>

/**
 * The GME stock-token reference reading.
 *
 * `multiplier` is the ERC-8056 scaled-UI value. It is carried explicitly rather
 * than folded into a balance so that no downstream consumer can accidentally
 * apply it twice.
 */
export const gmeReferenceSchema = z.object({
  address: addressSchema,
  symbol: z.string(),
  decimals: decimalsSchema,
  multiplier: bigintSchema,
  /** Where this reading came from, shown verbatim in the UI. */
  source: z.string().min(1),
})
export type GmeReference = z.infer<typeof gmeReferenceSchema>

/**
 * Normalised market metrics.
 *
 * Every field is nullable on purpose: a source that supplies price but not
 * volume produces `volume24h: null`, which renders NO SIGNAL for that tile
 * alone rather than poisoning the whole dashboard or defaulting to zero.
 */
export const marketMetricsSchema = z.object({
  /** Price of one project token, denominated in the quote asset, WAD-scaled. */
  priceInQuoteWad: bigintSchema.nullable(),
  /** Quote asset symbol, e.g. "GME". */
  quoteSymbol: z.string(),
  marketCapWad: bigintSchema.nullable(),
  fullyDilutedWad: bigintSchema.nullable(),
  volume24hWad: bigintSchema.nullable(),
  liquidityWad: bigintSchema.nullable(),
  change24hWad: bigintSchema.nullable(),
  holders: z.number().int().nonnegative().nullable(),
  /** Bonding-curve progress in basis points, 0..10000. */
  graduationBps: z.number().int().min(0).max(10_000).nullable(),
  /** Raw quote currently in the curve, for the gauge footer. */
  quoteRaw: bigintSchema.nullable(),
  quoteTargetRaw: bigintSchema.nullable(),
  /** True once the curve has graduated into a Uniswap v4 pool. */
  graduated: z.boolean().nullable(),
})
export type MarketMetrics = z.infer<typeof marketMetricsSchema>

/** Shape of the mock fixture file, so fixtures are validated like real data. */
export const mockPayloadSchema = z.object({
  metrics: marketMetricsSchema,
  gme: gmeReferenceSchema,
})
