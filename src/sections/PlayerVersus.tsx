import { brand } from '@/config/project.config'
import { GME_STOCK_TOKEN_ADDRESS, ROBINHOOD_CHAIN_ID } from '@/config/chain.config'
import { NOT_A_SHARE } from '@/config/content/disclosures'
import { shortenAddress } from '@/lib/address'
import { SectionHeading } from '@/ui/SectionHeading'
import styles from './PlayerVersus.module.css'

/**
 * PLAYER ONE vs PLAYER TWO.
 *
 * The three-column set piece. The middle column is the arcade attendant, whose
 * only job is to say — in plain language, in the middle of the loudest part of
 * the page — that one of these is a memecoin and the other is not.
 */
export function PlayerVersus() {
  return (
    <section className="section shell" id="cartridge" aria-labelledby="versus-title">
      <SectionHeading
        stage="STAGE 01"
        title="Player One vs Player Two"
        id="versus-title"
        accent="cart"
        blurb="Two tokens on the same network, in the same pool, doing completely different jobs. The attendant will explain."
      />

      <div className={styles.grid}>
        {/* ── PLAYER ONE ── */}
        <div className={styles.column}>
          <article className={styles.card} data-side="p1">
            <span className={styles.role}>PLAYER ONE</span>
            <span className={styles.ticker}>${brand.symbol}</span>
            <span className={styles.subtitle}>{brand.name} — the thing this website is about</span>
            <img className={styles.sprite} src="/art/player-one.svg" alt="" width={128} height={160} />
            <dl className={styles.statList}>
              <div className={styles.stat}>
                <dt className={styles.statKey}>TYPE</dt>
                <dd className={styles.statVal}>Memecoin</dd>
              </div>
              <div className={styles.stat}>
                <dt className={styles.statKey}>BACKED BY</dt>
                <dd className={styles.statVal}>Nothing. Genuinely nothing.</dd>
              </div>
              <div className={styles.stat}>
                <dt className={styles.statKey}>CONTRACT</dt>
                <dd className={styles.statVal}>Not deployed yet</dd>
              </div>
              <div className={styles.stat}>
                <dt className={styles.statKey}>GRANTS YOU</dt>
                <dd className={styles.statVal}>A token. That is the whole list.</dd>
              </div>
            </dl>
          </article>
        </div>

        {/* ── THE ATTENDANT ── */}
        <div className={styles.column}>
          <article className={`${styles.card} ${styles.witness}`} data-side="mid">
            <span className={styles.role}>THE ATTENDANT</span>
            <img className={styles.sprite} src="/art/attendant.svg" alt="" width={128} height={160} />
            <p className={styles.witnessQuote}>
              “One of these is a joke about a stock. The other is a token that tracks a real one. They trade
              against each other. Neither one turns into the other. I have explained this eleven thousand
              times.”
            </p>
            <p className={styles.witnessAttrib}>— the arcade attendant, who has stopped being surprised</p>
          </article>
        </div>

        {/* ── PLAYER TWO ── */}
        <div className={styles.column}>
          <article className={styles.card} data-side="p2">
            <span className={styles.role}>PLAYER TWO — THE QUOTE ASSET</span>
            <span className={styles.ticker}>GME</span>
            <span className={styles.subtitle}>GameStop • Robinhood Token — a tokenised equity</span>
            <img className={styles.sprite} src="/art/market-boss.svg" alt="" width={176} height={192} />
            <dl className={styles.statList}>
              <div className={styles.stat}>
                <dt className={styles.statKey}>TYPE</dt>
                <dd className={styles.statVal}>Stock token (third-party issued)</dd>
              </div>
              <div className={styles.stat}>
                <dt className={styles.statKey}>CONTRACT</dt>
                <dd className={styles.statVal}>{shortenAddress(GME_STOCK_TOKEN_ADDRESS)}</dd>
              </div>
              <div className={styles.stat}>
                <dt className={styles.statKey}>DECIMALS</dt>
                <dd className={styles.statVal}>18</dd>
              </div>
              <div className={styles.stat}>
                <dt className={styles.statKey}>NETWORK</dt>
                <dd className={styles.statVal}>Robinhood Chain · {ROBINHOOD_CHAIN_ID}</dd>
              </div>
            </dl>
          </article>
        </div>
      </div>

      <div className={styles.notice}>
        <p className={styles.noticeTitle}>{NOT_A_SHARE}</p>
        <p className={styles.noticeBody}>
          Buying {brand.symbol ? `$${brand.symbol}` : 'this token'} does not give you a GameStop share, a
          fraction of one, a claim on one, a dividend, a vote, or any relationship with GameStop Corp.
          whatsoever. GME is simply the asset the pool prices us against — the way a shop might price things
          in a currency it does not own. We are not affiliated with GameStop or Robinhood, and nobody has
          endorsed this.
        </p>
      </div>
    </section>
  )
}
