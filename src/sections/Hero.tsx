import { ROBINHOOD_CHAIN_ID } from '@/config/chain.config'
import { brand } from '@/config/project.config'
import { useMarketMetrics } from '@/data/queries'
import { formatCompactWad, formatPriceWad } from '@/lib/format'
import { splitWordmark, wordmarkStyle } from '@/lib/wordmark'
import { PixelButton } from '@/ui/PixelButton'
import { PrimaryAction } from '@/ui/PrimaryAction'
import { StatCartridge } from '@/ui/StatCartridge'
import styles from './Hero.module.css'

/**
 * The hero.
 *
 * Information order is fixed and deliberate — a visitor who reads only the
 * first screen must still come away knowing what this is, what it is paired
 * with, that it is not equity, and where to go next:
 *   1. what it is        (wordmark + tagline)
 *   2. what it pairs to  (the acid PAIRED WITH bar)
 *   3. what it is not    (the same bar, immediately after)
 *   4. what to do        (the CTA row)
 *   5. what is true now  (the market summary strip)
 */
export function Hero() {
  const metrics = useMarketMetrics()
  const value = metrics.value
  const mark = splitWordmark(brand.name)

  return (
    <section className={`${styles.hero} shell`} id="welcome" aria-labelledby="hero-title">
      <div className={styles.grid}>
        <div className={styles.stack}>
          <span className={styles.kicker}>UNLICENSED · SERIAL 4663</span>

          <h1 className={styles.wordmark} id="hero-title" style={wordmarkStyle(brand.name)}>
            {mark.first}
            {mark.rest ? <span className={styles.wordmarkLine2}>{mark.rest}</span> : null}
          </h1>

          <p className={styles.tagline}>{brand.tagline}</p>

          <div className={styles.pairBar}>
            <span className={styles.pairBarText}>PAIRED WITH THE GME STOCK TOKEN</span>
            <span className={styles.pairBarNote}>
              It is not GameStop stock. It never becomes GameStop stock.
            </span>
          </div>

          <div className={styles.versus}>
            <div className={styles.versusSide} data-side="p1">
              <span className={styles.versusRole}>PLAYER ONE</span>
              <span className={styles.versusTicker}>${brand.symbol}</span>
            </div>
            <span className={styles.versusMark} aria-hidden="true">
              VS
            </span>
            <div className={styles.versusSide} data-side="p2">
              <span className={styles.versusRole}>PLAYER TWO — QUOTE ASSET</span>
              <span className={styles.versusTicker}>GME</span>
            </div>
          </div>

          <div className={styles.actions}>
            <PrimaryAction size="lg" attract />
            <PixelButton as="a" href="#gme-link" external={false} tone="ghost" size="lg" sound="select">
              SEE THE PROOF
            </PixelButton>
          </div>

          <div className={styles.badges}>
            <span className={styles.badge}>◆ ROBINHOOD CHAIN · {ROBINHOOD_CHAIN_ID}</span>
            <span className={styles.badge}>◆ QUOTE ASSET: GME</span>
            <span className={styles.badge} data-tone="warn">
              ◆ NOT A SECURITY
            </span>
          </div>
        </div>

        <div className={styles.art}>
          <div className={styles.artInner}>
            <img
              className={styles.cartridge}
              src="/art/cartridge-hero.svg"
              alt={`The ${brand.name} cartridge: an orange game cartridge with a cyan label plate showing a rising candlestick chart, a GME LINK sticker, and gold connector pins.`}
              width={260}
              height={300}
              /* The only asset that is genuinely above the fold on every screen. */
              fetchPriority="high"
              decoding="async"
            />
            <span className={`${styles.sticker} ${styles.stickerA}`}>
              CARTRIDGE
              <br />
              VERIFIED
            </span>
            <span className={`${styles.sticker} ${styles.stickerB}`}>
              NO
              <br />
              PUBLISHER
            </span>
            <span className={`${styles.sticker} ${styles.stickerC}`}>PLAYER ONE</span>
            <img className={styles.player} src="/art/player-one.svg" alt="" width={128} height={160} />
          </div>
        </div>
      </div>

      <div className={styles.summary}>
        <StatCartridge
          label={`${brand.symbol} PRICE`}
          reading={metrics}
          value={value ? formatPriceWad(value.priceInQuoteWad, value.quoteSymbol) : null}
          sub="Pool price, denominated in GME"
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
          label="GRADUATION"
          reading={metrics}
          value={value?.graduationBps != null ? `${(value.graduationBps / 100).toFixed(1)}%` : null}
          sub="Curve progress toward 369 GME"
          spine="acid"
        />
      </div>
    </section>
  )
}
