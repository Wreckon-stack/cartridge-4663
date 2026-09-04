import { getAddress } from 'viem'
import { onchain } from '@/config/project.config'
import { checkAddress } from '@/lib/address'
import { marketCap, priceOf, progressBps, rawAmount } from '@/lib/units'
import { erc20Abi } from '../abi'
import { marketMetricsSchema, type MarketMetrics } from '../schemas'
import { fetchLaunchFacts, fetchPairingFacts } from './pons'
import { getRpcClient, withTimeout } from './rpc-client'

/**
 * Builds the market arcade's metrics from on-chain state.
 *
 * The honesty rules this function encodes:
 *
 *  1. A metric we cannot source is `null`, never 0 and never a guess. Volume,
 *     24h change and holder count all require an indexer that this project does
 *     not have, so they are null under the `chain` source and the corresponding
 *     tiles render NO SIGNAL. Wiring them up means adding a real indexer
 *     adapter, not inventing a number here.
 *
 *  2. Price is derived from the curve's actual GME balance against circulating
 *     supply using bigint maths throughout — see @/lib/units. No floats touch
 *     a raw balance.
 *
 *  3. The price is denominated in GME and labelled as such. It is a pool price
 *     for a memecoin, not a quote for GameStop equity.
 */
export async function fetchMarketMetrics(signal?: AbortSignal): Promise<MarketMetrics> {
  const token = checkAddress(onchain.tokenAddress)
  const gmeAddress = checkAddress(onchain.gmeStockTokenAddress)

  const [pairing, launch] = await Promise.all([fetchPairingFacts(signal), fetchLaunchFacts(signal)])

  const base: MarketMetrics = {
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
    quoteTargetRaw: launch.graduationThreshold ?? pairing.economics.graduationThreshold,
    graduated: launch.exists ? launch.phase === 'GRADUATED' : null,
  }

  // No token configured, or the factory has never heard of it: nothing to price.
  if (!token.ok || !launch.exists || !launch.curve || !gmeAddress.ok) {
    return marketMetricsSchema.parse(base)
  }

  const client = getRpcClient()
  const curve = getAddress(launch.curve)

  const [totalSupply, tokenDecimals, curveQuoteRaw, curveTokenRaw, quoteDecimals] = await withTimeout(
    Promise.all([
      client.readContract({ address: token.address, abi: erc20Abi, functionName: 'totalSupply' }),
      client.readContract({ address: token.address, abi: erc20Abi, functionName: 'decimals' }),
      // How much GME the bonding curve is holding right now.
      client.readContract({
        address: gmeAddress.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [curve],
      }),
      // How much of our token remains unsold on the curve.
      client.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [curve],
      }),
      client.readContract({ address: gmeAddress.address, abi: erc20Abi, functionName: 'decimals' }),
    ]),
    12_000,
    'Market metrics read',
  )

  signal?.throwIfAborted()

  // Circulating = everything not still sitting on the curve.
  const circulating = totalSupply > curveTokenRaw ? totalSupply - curveTokenRaw : 0n

  // Spot price from the curve's reserves, including the protocol's virtual
  // (phantom) quote so the figure matches how the curve actually prices.
  const effectiveQuote = curveQuoteRaw + pairing.economics.phantomQuote
  const priceInQuoteWad =
    circulating > 0n
      ? priceOf(rawAmount(circulating, tokenDecimals), rawAmount(effectiveQuote, quoteDecimals))
      : null

  const marketCapWad =
    priceInQuoteWad != null ? marketCap(rawAmount(circulating, tokenDecimals), priceInQuoteWad) : null
  const fullyDilutedWad =
    priceInQuoteWad != null ? marketCap(rawAmount(totalSupply, tokenDecimals), priceInQuoteWad) : null

  const target = launch.graduationThreshold ?? pairing.economics.graduationThreshold

  return marketMetricsSchema.parse({
    ...base,
    priceInQuoteWad,
    marketCapWad,
    fullyDilutedWad,
    // Liquidity is the real GME sitting in the curve — excluding the phantom
    // reserve, which is virtual and cannot be withdrawn by anyone.
    liquidityWad: curveQuoteRaw,
    quoteRaw: curveQuoteRaw,
    quoteTargetRaw: target,
    graduationBps: target > 0n ? progressBps(curveQuoteRaw, target) : null,
    graduated: launch.phase === 'GRADUATED',
    // Explicitly unavailable without an indexer. See rule 1 above.
    volume24hWad: null,
    change24hWad: null,
    holders: null,
  })
}
