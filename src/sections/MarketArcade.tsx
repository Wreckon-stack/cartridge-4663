import { brand, marketDataSource } from '@/config/project.config'
import { useGmeReference, useMarketMetrics } from '@/data/queries'
import { activeRpcLabel } from '@/data/adapters/rpc-client'
import {
  formatCompactWad,
  formatCount,
  formatMultiplier,
  formatPriceWad,
  formatRelativeTime,
} from '@/lib/format'
import { statusDescription } from '@/lib/data-health'
import { ArcadeGauge } from '@/ui/ArcadeGauge'
import { DataStatusBadge } from '@/ui/DataStatusBadge'
import { SectionHeading } from '@/ui/SectionHeading'
import { StatCartridge } from '@/ui/StatCartridge'
import styles from './MarketArcade.module.css'

/**
 * THE MARKET ARCADE.
 *
 * Looks like an attract screen, behaves like a dashboard. Every tile is fed a
 * `Reading`, so LIVE / STALE / FEED LOST / NO SIGNAL are rendered from real
 * state rather than being decided per-component. Nothing animates a number
 * before that number exists.
 */
export function MarketArcade() {
  const metrics = useMarketMetrics()
  const gme = useGmeReference()
  const value = metrics.value

  const sourceLabel =
    marketDataSource === 'none'
      ? 'No market data source configured'
      : marketDataSource === 'mock'
        ? 'DEVELOPMENT FIXTURES — these numbers are fake'
        : `Robinhood Chain RPC — ${activeRpcLabel()}`

  return (
    <section className="section shell" id="market" aria-labelledby="market-title">
      <SectionHeading
        stage="STAGE 03"
        title="The Market Arcade"
        id="market-title"
        accent="coin"
        blurb="Live readings, or an honest blank. A metric we cannot source shows NO SIGNAL — it never shows a zero pretending to be data."
      />

      <div className={styles.cabinet}>
        <div className={styles.marquee}>
          <span className={styles.marqueeTitle}>◆ {brand.name} — TRADING FLOOR ◆</span>
          <DataStatusBadge reading={metrics} size="lg" />
        </div>

        {metrics.status === 'ERROR' ? (
          <div className={styles.errorStrip} role="status">
            <span className={styles.errorTitle}>✕ MARKET FEED LOST — RETRYING</span>
            <span className={styles.errorBody}>
              {value != null
                ? 'Showing the last confirmed reading below. It is not current.'
                : 'No reading was ever received, so there is nothing to show.'}{' '}
              {metrics.error}
            </span>
          </div>
        ) : null}

        <div className={styles.sourceRow}>
          <span>
            <strong>SOURCE:</strong> {sourceLabel}
          </span>
          <span>
            <strong>QUOTE ASSET:</strong> {value?.quoteSymbol ?? 'GME'}
          </span>
          <span>
            <strong>LAST UPDATE:</strong> {formatRelativeTime(metrics.fetchedAt)}
          </span>
          <span>{statusDescription(metrics)}</span>
        </div>

        <div className={styles.grid}>
          <StatCartridge
            label={`${brand.symbol} PRICE`}
            reading={metrics}
            value={value ? formatPriceWad(value.priceInQuoteWad, value.quoteSymbol) : null}
            sub="Pool price in GME — not a GameStop share price"
            changeWad={value?.change24hWad ?? null}
            spine="cyan"
          />
          <StatCartridge
            label="MARKET CAP"
            reading={metrics}
            value={value ? formatCompactWad(value.marketCapWad, value.quoteSymbol) : null}
            sub="Circulating supply × pool price"
            spine="coin"
          />
          <StatCartridge
            label="FULLY DILUTED"
            reading={metrics}
            value={value ? formatCompactWad(value.fullyDilutedWad, value.quoteSymbol) : null}
            sub="Total supply × pool price"
            spine="coin"
          />
          <StatCartridge
            label="LIQUIDITY"
            reading={metrics}
            value={value ? formatCompactWad(value.liquidityWad, value.quoteSymbol) : null}
            sub="Real GME held by the curve"
            spine="acid"
          />
          <StatCartridge
            label="24H VOLUME"
            reading={metrics}
            value={value ? formatCompactWad(value.volume24hWad, value.quoteSymbol) : null}
            sub="Needs an indexer we have not wired up"
            spine="magenta"
          />
          <StatCartridge
            label="HOLDERS"
            reading={metrics}
            value={value ? formatCount(value.holders) : null}
            sub="Needs an indexer we have not wired up"
            spine="magenta"
          />
        </div>

        <div className={styles.gaugeWrap}>
          <ArcadeGauge
            label="CURVE PROGRESS — GRADUATION TO UNISWAP V4"
            bps={value?.graduationBps ?? null}
            floor={value?.quoteRaw != null ? formatCompactWad(value.quoteRaw, 'GME') : '— GME'}
            ceiling={
              value?.quoteTargetRaw != null ? formatCompactWad(value.quoteTargetRaw, 'GME') : '369 GME'
            }
          />
          <p className={styles.gaugeNote}>
            A Pons V2 launch runs on a bonding curve until it has taken in enough of the quote asset, at which
            point liquidity moves into a permanently locked Uniswap v4 pool. For a GME-quoted launch that
            threshold is 369 GME, read live from the factory.
          </p>
        </div>

        <div className={styles.rails}>
          <StatCartridge
            label="GME UI MULTIPLIER"
            reading={gme}
            value={gme.value ? formatMultiplier(gme.value.multiplier) : null}
            sub="ERC-8056 scaled UI amount — adjusts displayed shares for splits and dividends"
            spine="cart"
          />
          <StatCartridge
            label="GME TOKEN DECIMALS"
            reading={gme}
            value={gme.value ? String(gme.value.decimals) : null}
            sub={gme.value?.source ?? 'Read directly from the stock-token contract'}
            spine="cart"
          />
        </div>
      </div>
    </section>
  )
}
