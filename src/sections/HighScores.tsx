import { EXHIBITS, HIGH_SCORES } from '@/config/content/archive'
import { SectionHeading } from '@/ui/SectionHeading'
import styles from './HighScores.module.css'

/**
 * HIGH SCORES.
 *
 * Project milestones, not a holder leaderboard — we do not publish rankings of
 * wallets, because that is how individual holders get targeted.
 *
 * The only row with a value is the one we can compute honestly from data
 * already in the repo (the archive count). Everything else reads NO SCORE
 * RECORDED until there is something real to put there.
 */
export function HighScores() {
  const filledExhibits = EXHIBITS.filter((e) => e.status !== 'EMPTY').length

  const rows = HIGH_SCORES.map((score) =>
    score.id === 'exhibits' ? { ...score, value: String(filledExhibits) } : score,
  )

  return (
    <section className="section shell" id="scores" aria-labelledby="scores-title">
      <SectionHeading
        stage="STAGE 07"
        title="High Scores"
        id="scores-title"
        accent="acid"
        blurb="Milestones only. No wallet rankings — nobody gets put on a leaderboard for holding a token."
      />

      <div className={styles.board}>
        <p className={styles.boardTitle}>★ ALL-TIME BEST ★</p>

        <table className={styles.table}>
          <caption>
            Project milestones. A row reads NO SCORE RECORDED until there is a verified value for it.
          </caption>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Record</th>
              <th scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((score, index) => (
              <tr key={score.id}>
                <td className={styles.rank}>{String(index + 1).padStart(2, '0')}</td>
                <td>
                  {score.label}
                  <span className={styles.note}>{score.note}</span>
                </td>
                <td>{score.value ?? <span className={styles.noScore}>NO SCORE RECORDED</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={styles.foot}>
          Market-derived records stay blank until a launched token and a trustworthy data source both exist.
          An empty scoreboard is more useful than a made-up one.
        </p>
      </div>
    </section>
  )
}
