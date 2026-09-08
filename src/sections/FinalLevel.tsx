import { brand, features, onchain } from '@/config/project.config'
import { SOCIAL_LINKS } from '@/config/content/socials'
import { NOT_A_SHARE } from '@/config/content/disclosures'
import { ContractCopyField } from '@/ui/ContractCopyField'
import { PixelButton } from '@/ui/PixelButton'
import { PrimaryAction } from '@/ui/PrimaryAction'
import { SectionHeading } from '@/ui/SectionHeading'
import { splitWordmark, wordmarkStyle } from '@/lib/wordmark'
import { CoinDrop } from './CoinDrop'
import styles from './FinalLevel.module.css'

/**
 * FINAL LEVEL — the payoff.
 *
 * The manifesto is the one place the site is allowed to be sincere. It makes no
 * promise about price, liquidity, listings or returns, because those are the
 * promises that turn a joke into a liability.
 */
export function FinalLevel() {
  const mark = splitWordmark(brand.name)

  return (
    <section className={styles.final} id="final" aria-labelledby="final-title">
      <img className={styles.skyline} src="/art/skyline.svg" alt="" width={1600} height={360} />

      <div className={`${styles.inner} shell`}>
        <div style={{ textAlign: 'start' }}>
          <SectionHeading
            stage="FINAL LEVEL"
            title="Game Over? Never."
            id="final-title"
            accent="magenta"
            blurb="You have reached the end of the website. There is no boss here, only a manifesto and a link."
          />
        </div>

        <p className={styles.bigMark} style={wordmarkStyle(brand.name)}>
          {mark.first}
          {mark.rest ? <span className={styles.bigMarkSub}>{mark.rest}</span> : null}
        </p>

        <div className={styles.manifesto}>
          <p className={styles.manifestoTitle}>POWER TO THE PLAYERS WHO NEVER LEFT THE ARCADE</p>
          <div className={styles.manifestoBody}>
            <p>
              Somewhere between the last cartridge shop closing and the first stock becoming a blockchain
              token, the fun leaked out of markets. Everything got a dashboard. Everything got a risk
              disclosure written by a committee. Everything got extremely, professionally, catastrophically
              boring.
            </p>
            <p>
              This is a coin about a game that was never released, priced in a share you cannot hang on your
              wall, running on a network built by a brokerage. It is deeply stupid. It is also, structurally,
              completely real — the contracts are public, the numbers on this page are read from them while
              you watch, and nothing here is pretending to be something it is not.
            </p>
            <p>
              We are not promising you anything. Not a price, not a listing, not liquidity, not a future.{' '}
              <strong>{NOT_A_SHARE}</strong> What is on offer is a very silly object, honestly described, that
              does exactly what it says on the label.
            </p>
            <p>Insert coin. Or don&rsquo;t. The cabinet stays plugged in either way.</p>
          </div>
        </div>

        <div className={styles.actions}>
          <PrimaryAction size="lg" />
          {SOCIAL_LINKS.filter((link) => link.id !== 'trade').map((link) => (
            <PixelButton
              key={link.id}
              as="a"
              href={link.href}
              tone={link.accent === 'cyan' ? 'cyan' : 'magenta'}
              size="lg"
              sound="select"
              disabledReason={`No ${link.label.toLowerCase()} link is configured yet`}
            >
              {link.label}
            </PixelButton>
          ))}
          <PixelButton as="a" href="#welcome" external={false} tone="slate" size="lg" sound="select">
            ▲ BACK TO TOP
          </PixelButton>
        </div>

        <div className={styles.contract}>
          <ContractCopyField
            label={`${brand.symbol} CONTRACT`}
            address={onchain.tokenAddress ?? null}
            emptyText="NOT DEPLOYED YET — there is nothing to copy"
            note="When this fills in, check it against an official post before you trade. Anyone can deploy a token with the same name."
          />
        </div>

        {features.miniGame ? <CoinDrop /> : null}
      </div>
    </section>
  )
}
