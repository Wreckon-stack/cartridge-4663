import { createPublicClient, http, type PublicClient } from 'viem'
import { PUBLIC_RPC_URL, robinhoodChain } from '@/config/chain.config'
import { onchain } from '@/config/project.config'

/**
 * The single viem client for the app.
 *
 * Deliberate choices:
 *  - a hard 12s timeout, because a hung RPC must become a visible ERROR state
 *    rather than a spinner that never resolves;
 *  - two retries with backoff, then stop — we do not hammer a rate-limited
 *    public endpoint;
 *  - batching enabled so a dashboard render is one HTTP round trip instead of
 *    a dozen.
 */
let client: PublicClient | null = null

export function getRpcClient(): PublicClient {
  if (client) return client
  const url = onchain.rpcUrl ?? PUBLIC_RPC_URL
  client = createPublicClient({
    chain: robinhoodChain,
    transport: http(url, {
      timeout: 12_000,
      retryCount: 2,
      retryDelay: 400,
      batch: { wait: 16 },
    }),
  })
  return client
}

/** Test seam: drop the memoised client so a test can swap the transport. */
export function resetRpcClient(): void {
  client = null
}

/** Which endpoint we are actually talking to, for the data-source panel. */
export function activeRpcLabel(): string {
  return onchain.rpcUrl ? 'Configured RPC provider' : 'Public Robinhood Chain RPC (rate-limited)'
}

/**
 * Wrap a promise with an abort-aware timeout.
 *
 * viem has its own timeout, but adapters also compose several calls; this
 * bounds the whole operation so one slow leg cannot hold a panel in LOADING
 * indefinitely.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
