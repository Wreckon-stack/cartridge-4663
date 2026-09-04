import { getSiteStatus } from '@/config/config-status'
import { buildLaunchChecks, isLaunchConfirmed } from '@/config/launch-status'
import { useLaunchFacts, usePairingFacts } from '@/data/queries'
import { brand } from '@/config/project.config'
import styles from './PreviewBanner.module.css'

/**
 * The honesty banner.
 *
 * Two jobs:
 *  1. Before launch — make it impossible to mistake a preview for a live site.
 *  2. On launch day — shout if the configured token is not actually a
 *     GME-paired Pons V2 launch. That is the failure mode that matters: an
 *     address typo would otherwise leave the page quietly claiming a pairing
 *     that does not exist.
 *
 * Not dismissible, by design.
 */
export function PreviewBanner() {
  const status = getSiteStatus()
  const launch = useLaunchFacts()
  const pairing = usePairingFacts()

  // A runtime MISMATCH always outranks the static config state.
  const launchProblems = buildLaunchChecks(launch, pairing).filter((c) => c.status === 'MISMATCH')

  if (launchProblems.length > 0) {
    return (
      <aside
        className={styles.banner}
        data-mode="MISCONFIGURED"
        data-testid="preview-banner"
        aria-label="Site configuration status"
      >
        <span className={styles.tag}>✕ LAUNCH VERIFICATION FAILED</span>
        <span className={styles.text}>
          <strong>The chain disagrees with this build&rsquo;s configuration.</strong>{' '}
          {launchProblems.map((p) => p.detail).join(' ')}
        </span>
      </aside>
    )
  }

  if (!status.showPreviewBanner) return null

  /*
   * Once the chain confirms the launch, "has not launched" is simply false —
   * and a banner that contradicts the VERIFIED board directly beneath it is
   * worse than no banner. Switch to naming what is genuinely still missing.
   */
  const launched = isLaunchConfirmed(launch)
  if (launched && status.mode === 'PRE_LAUNCH') {
    return (
      <aside
        className={styles.banner}
        data-mode="PRE_LAUNCH"
        data-testid="preview-banner"
        aria-label="Site configuration status"
      >
        <span className={styles.tag}>◆ SETUP INCOMPLETE</span>
        <span className={styles.text}>
          <strong>{brand.symbol} is launched and confirmed paired to GME on chain.</strong> Some site
          configuration is still missing, so parts of this page are not live yet. {status.summary}
        </span>
      </aside>
    )
  }

  return (
    <aside
      className={styles.banner}
      data-mode={status.mode}
      data-testid="preview-banner"
      aria-label="Site configuration status"
    >
      <span className={styles.tag}>
        {status.mode === 'MISCONFIGURED' ? '✕ CONFIGURATION ERROR' : '◆ PRE-LAUNCH PREVIEW'}
      </span>
      <span className={styles.text}>
        {status.mode === 'MISCONFIGURED' ? (
          <>
            <strong>This build is misconfigured.</strong> {status.summary}
          </>
        ) : (
          <>
            <strong>{brand.symbol} has not launched.</strong> No contract address, pool, or market data exists
            yet, so every metric below reads NO SIGNAL rather than showing a placeholder number.{' '}
            {status.summary}
          </>
        )}
      </span>
    </aside>
  )
}
