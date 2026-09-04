import { GME_STOCK_TOKEN_ADDRESS, PONS_V2, ROBINHOOD_CHAIN_ID } from '@/config/chain.config'
import { getSiteStatus, type CheckStatus } from '@/config/config-status'
import { buildLaunchChecks } from '@/config/launch-status'
import { brand, onchain } from '@/config/project.config'
import { useLaunchFacts, usePairingFacts } from '@/data/queries'
import { formatCompactWad, formatRelativeTime, NO_VALUE } from '@/lib/format'
import { EXTERNAL_LINK_PROPS } from '@/lib/links'
import { ContractCopyField } from '@/ui/ContractCopyField'
import { DataStatusBadge } from '@/ui/DataStatusBadge'
import { SectionHeading } from '@/ui/SectionHeading'
import styles from './PairEvidence.module.css'

/** Glyph per status, so the stamp never relies on colour. */
const STAMP_GLYPH: Record<CheckStatus, string> = {
  VERIFIED: '✓',
  PENDING: '◌',
  UNCONFIGURED: '○',
  MISMATCH: '✕',
}

/**
 * THE EVIDENCE BOARD.
 *
 * This is the section that has to earn trust, so it is built so that it cannot
 * lie: the top panel shows values read live from the Pons V2 factory on every
 * page load, and the board below renders whatever `config-status` reports.
 * There is no code path that stamps VERIFIED on an unchecked value.
 */
export function PairEvidence() {
  const status = getSiteStatus()
  const pairing = usePairingFacts()
  const launch = useLaunchFacts()
  const facts = pairing.value

  /*
   * The board is the config-shape checks with the runtime launch checks merged
   * in. Where both describe the same row (the token contract), the runtime
   * answer wins — it is the one backed by an actual chain read.
   */
  const launchChecks = buildLaunchChecks(launch, pairing)
  const launchIds = new Set(launchChecks.map((c) => c.id))
  const boardChecks = [...status.checks.filter((c) => !launchIds.has(c.id)), ...launchChecks]

  return (
    <section className="section shell" id="gme-link" aria-labelledby="evidence-title">
      <SectionHeading
        stage="STAGE 02"
        title="GME Link Established"
        id="evidence-title"
        accent="acid"
        blurb="Everything below is read from public contracts on Robinhood Chain while this page loads. Every row links to a block explorer so you can check it without trusting us."
      />

      {/* ── Live protocol readout ── */}
      <div className={styles.livePanel}>
        <div className={styles.liveHead}>
          <span className={styles.liveTitle}>LIVE FROM THE PONS V2 FACTORY</span>
          <DataStatusBadge reading={pairing} size="lg" />
        </div>

        <div className={styles.fact}>
          <span className={styles.factKey}>GME APPROVED AS QUOTE ASSET</span>
          <span className={styles.factVal}>{facts ? (facts.gmeApproved ? 'YES' : 'NO') : NO_VALUE}</span>
          <span className={styles.factSub}>approvedPairTokens(GME)</span>
        </div>

        <div className={styles.fact}>
          <span className={styles.factKey}>GRADUATION THRESHOLD</span>
          <span className={styles.factVal}>
            {facts ? formatCompactWad(facts.economics.graduationThreshold, 'GME') : NO_VALUE}
          </span>
          <span className={styles.factSub}>quote required to graduate the curve</span>
        </div>

        <div className={styles.fact}>
          <span className={styles.factKey}>VIRTUAL RESERVE</span>
          <span className={styles.factVal}>
            {facts ? formatCompactWad(facts.economics.phantomQuote, 'GME') : NO_VALUE}
          </span>
          <span className={styles.factSub}>phantom quote seeding the curve</span>
        </div>

        <div className={styles.fact}>
          <span className={styles.factKey}>LAUNCHES ENABLED</span>
          <span className={styles.factVal}>
            {facts ? (facts.launchEnabled ? 'OPEN' : 'CLOSED') : NO_VALUE}
          </span>
          <span className={styles.factSub}>launchEnabled()</span>
        </div>

        <div className={styles.fact}>
          <span className={styles.factKey}>HOOK AGREES WITH FACTORY</span>
          <span className={styles.factVal}>
            {facts ? (facts.hookMatchesConfig ? 'MATCH' : 'MISMATCH') : NO_VALUE}
          </span>
          <span className={styles.factSub}>factory.memeHook() vs configured hook</span>
        </div>

        <div className={styles.fact}>
          <span className={styles.factKey}>LAST READ</span>
          <span className={styles.factVal}>{formatRelativeTime(pairing.fetchedAt)}</span>
          <span className={styles.factSub}>
            {pairing.status === 'ERROR' ? (pairing.error ?? 'read failed') : 'refreshes every 5 minutes'}
          </span>
        </div>
      </div>

      {/* ── The configuration board ── */}
      <div className={styles.board}>
        {boardChecks.map((check) => (
          <article className={styles.row} key={check.id} data-status={check.status}>
            <div className={styles.rowHead}>
              <span className={styles.label}>{check.label}</span>
              <span className={styles.stamp}>
                <span aria-hidden="true">{STAMP_GLYPH[check.status]}</span>
                {check.status}
              </span>
            </div>

            <code className={styles.value} data-empty={check.value ? 'false' : 'true'}>
              {check.value ?? 'NOT CONFIGURED'}
            </code>

            <p className={styles.detail}>{check.detail}</p>

            {check.href ? (
              <a className={styles.sourceLink} href={check.href} {...EXTERNAL_LINK_PROPS}>
                Check it yourself on Blockscout ↗
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            ) : null}
          </article>
        ))}
      </div>

      {/* ── Copyable addresses ── */}
      <div className={styles.contracts}>
        <ContractCopyField
          label={`${brand.symbol} CONTRACT`}
          address={onchain.tokenAddress ?? null}
          emptyText="NOT DEPLOYED YET — there is nothing to copy"
          note="Never buy a token from an address you found in a reply. Check it here first."
        />
        <ContractCopyField
          label="GME STOCK TOKEN (QUOTE ASSET)"
          address={GME_STOCK_TOKEN_ADDRESS}
          note="Issued by a third party, not by us. Hundreds of unrelated contracts on this chain also use the ticker GME."
        />
        <ContractCopyField
          label="PONS V2 LAUNCH FACTORY"
          address={PONS_V2.factory}
          note="The contract that decides which assets may be used as a quote. Source is verified on Blockscout."
        />
        <ContractCopyField
          label="UNISWAP V4 HOOK (V2MemeHook)"
          address={PONS_V2.hook}
          note="Where a graduated pool lives. Registered by the factory above."
        />
      </div>

      <p className={styles.updated}>
        Network: Robinhood Chain, chain ID {ROBINHOOD_CHAIN_ID}. Configuration summary: {status.summary}
      </p>
    </section>
  )
}
