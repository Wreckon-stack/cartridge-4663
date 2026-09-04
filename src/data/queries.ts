import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { marketDataSource } from '@/config/project.config'
import { failed, live, noSignal, withFreshness, type Reading } from '@/lib/data-health'
import { fetchGmeReference } from './adapters/gme-reference'
import { fetchLaunchFacts, fetchPairingFacts, type LaunchFacts, type PairingFacts } from './adapters/pons'
import { fetchMarketMetrics } from './adapters/token-metrics'
import { MOCK_GME, MOCK_METRICS } from './mock/fixtures'
import type { GmeReference, MarketMetrics } from './schemas'

/**
 * React Query wiring.
 *
 * Each hook returns a `Reading<T>` rather than raw query state, so components
 * never have to decide what "no data" means — the mapping from query state to
 * LIVE / STALE / ERROR / NO_SIGNAL happens exactly once, here.
 */

const REFRESH_MS = 30_000
const RETRY_LIMIT = 2

/** Convert a react-query result into a Reading. */
function toReading<T>(query: UseQueryResult<T, Error>, enabled: boolean): Reading<T> {
  if (!enabled) return noSignal<T>()
  if (query.isError) {
    return failed<T>(query.error, query.data != null ? live(query.data, query.dataUpdatedAt) : undefined)
  }
  if (query.data == null) return { status: 'LOADING', value: null, fetchedAt: null }
  return withFreshness(live(query.data, query.dataUpdatedAt))
}

const sharedOptions = {
  staleTime: REFRESH_MS,
  refetchInterval: REFRESH_MS,
  // Don't keep pounding a rate-limited endpoint; two tries then show the error.
  retry: RETRY_LIMIT,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
  // Pause polling while the tab is hidden — no point burning RPC quota on a
  // dashboard nobody is looking at.
  refetchIntervalInBackground: false,
} as const

/**
 * The GME↔Pons pairing facts.
 *
 * Note this is NOT gated on `marketDataSource`. The pairing is a property of
 * public contracts that exists whether or not we have a token, and the evidence
 * board should be able to prove it even in the pre-launch state.
 */
export function usePairingFacts(): Reading<PairingFacts> {
  const query = useQuery<PairingFacts, Error>({
    queryKey: ['pairing-facts'],
    queryFn: ({ signal }) => fetchPairingFacts(signal),
    ...sharedOptions,
    // Protocol parameters change rarely; poll far less often than prices.
    refetchInterval: 5 * 60_000,
    staleTime: 5 * 60_000,
  })
  return toReading(query, true)
}

/**
 * Our own launch record, read from the Pons V2 factory.
 *
 * Not gated on `marketDataSource`: this is a verification read, not a market
 * feed. The evidence board must be able to confirm the pairing even when no
 * price source is configured. Returns `exists: false` — not an error — when no
 * token address is set, and makes no network call in that case.
 */
export function useLaunchFacts(): Reading<LaunchFacts> {
  const query = useQuery<LaunchFacts, Error>({
    queryKey: ['launch-facts'],
    queryFn: ({ signal }) => fetchLaunchFacts(signal),
    ...sharedOptions,
    // A launch record changes only at graduation, so poll gently.
    refetchInterval: 60_000,
    staleTime: 60_000,
  })
  return toReading(query, true)
}

export function useGmeReference(): Reading<GmeReference> {
  const enabled = marketDataSource !== 'none'
  const query = useQuery<GmeReference, Error>({
    queryKey: ['gme-reference', marketDataSource],
    queryFn: async ({ signal }) => {
      if (marketDataSource === 'mock') return MOCK_GME
      return fetchGmeReference(signal)
    },
    enabled,
    ...sharedOptions,
  })
  return toReading(query, enabled)
}

export function useMarketMetrics(): Reading<MarketMetrics> {
  const enabled = marketDataSource !== 'none'
  const query = useQuery<MarketMetrics, Error>({
    queryKey: ['market-metrics', marketDataSource],
    queryFn: async ({ signal }) => {
      if (marketDataSource === 'mock') return MOCK_METRICS
      return fetchMarketMetrics(signal)
    },
    enabled,
    ...sharedOptions,
  })
  return toReading(query, enabled)
}
