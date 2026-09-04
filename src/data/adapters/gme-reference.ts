import { getAddress } from 'viem'
import { GME_STOCK_TOKEN_ADDRESS } from '@/config/chain.config'
import { onchain } from '@/config/project.config'
import { WAD } from '@/lib/units'
import { erc20Abi, scaledUiAbi } from '../abi'
import { gmeReferenceSchema, type GmeReference } from '../schemas'
import { getRpcClient, withTimeout } from './rpc-client'

/**
 * Reads the GME stock token's own identity from the chain.
 *
 * What this deliberately does NOT do: report a share price. The site has no
 * authoritative feed for GameStop's NYSE quote, and inventing one — or
 * relabelling a pool price as "the GME price" — is exactly the dishonesty the
 * whole data layer exists to prevent. This adapter returns what the contract
 * genuinely tells us: symbol, decimals, and the ERC-8056 UI multiplier.
 */
export async function fetchGmeReference(signal?: AbortSignal): Promise<GmeReference> {
  const client = getRpcClient()
  const address = getAddress(onchain.gmeStockTokenAddress || GME_STOCK_TOKEN_ADDRESS)

  const [symbol, decimals, multiplier] = await withTimeout(
    Promise.all([
      client.readContract({ address, abi: erc20Abi, functionName: 'symbol' }),
      client.readContract({ address, abi: erc20Abi, functionName: 'decimals' }),
      // uiMultiplier is an extension: a token without it is not fatal, it just
      // means no corporate action has ever been applied. Default to 1.0.
      client.readContract({ address, abi: scaledUiAbi, functionName: 'uiMultiplier' }).catch(() => WAD),
    ]),
    12_000,
    'GME reference read',
  )

  signal?.throwIfAborted()

  return gmeReferenceSchema.parse({
    address,
    symbol,
    decimals,
    multiplier,
    source: 'Robinhood Chain RPC — direct contract read',
  })
}
