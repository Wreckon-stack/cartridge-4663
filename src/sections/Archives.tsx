import { EXHIBITS } from '@/config/content/archive'
import { EXTERNAL_LINK_PROPS } from '@/lib/links'
import { SectionHeading } from '@/ui/SectionHeading'
import styles from './Archives.module.css'

const STAMP_GLYPH = { CONFIRMED: '✓', 'ON RECORD': '◆', EMPTY: '○' } as const

/**
 * THE ARCHIVES.
 *
 * Deliberately over-serious presentation of a small number of true things.
 * Empty slots are rendered as empty slots — the section does not pad itself
 * with invented history to look busier, and the empty cards are part of the
 * joke rather than a gap in it.
 */
export function Archives() {
  const filled = EXHIBITS.filter((e) => e.status !== 'EMPTY').length

  return (
    <section className="section shell" id="archives" aria-labelledby="archives-title">
      <SectionHeading
        stage="STAGE 05"
        title="The Archives"
        id="archives-title"
        accent="cyan"
        blurb={`${filled} of ${EXHIBITS.length} slots filled. The empty ones stay empty until something actually happens — we would rather show you a gap than make one up.`}
      />

      <div className={styles.grid}>
        {EXHIBITS.map((exhibit) => {
          if (exhibit.status === 'EMPTY') {
            return (
              <article className={styles.card} key={exhibit.id} data-status="EMPTY">
                <span className={styles.ref}>{exhibit.ref}</span>
                <p className={styles.emptyMark}>ARCHIVE SLOT EMPTY</p>
                <p className={styles.emptyNote}>
                  Reserved for: {exhibit.title.toLowerCase()}. Nothing to file yet.
                </p>
              </article>
            )
          }

          return (
            <article className={styles.card} key={exhibit.id} data-status={exhibit.status}>
              <div className={styles.head}>
                <span className={styles.ref}>{exhibit.ref}</span>
                <span className={styles.stamp}>
                  <span aria-hidden="true">{STAMP_GLYPH[exhibit.status]}</span>
                  {exhibit.status}
                </span>
              </div>

              <h3 className={styles.title}>{exhibit.title}</h3>
              {exhibit.date ? (
                <time className={styles.date} dateTime={exhibit.date}>
                  FILED {exhibit.date}
                </time>
              ) : null}

              {exhibit.image ? (
                <img
                  className={styles.thumb}
                  src={exhibit.image.src}
                  alt={exhibit.image.alt}
                  loading="lazy"
                  decoding="async"
                  width={260}
                  height={300}
                />
              ) : null}

              {exhibit.body ? <p className={styles.body}>{exhibit.body}</p> : null}

              {exhibit.source ? (
                <a className={styles.source} href={exhibit.source.href} {...EXTERNAL_LINK_PROPS}>
                  SOURCE: {exhibit.source.label} ↗
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
