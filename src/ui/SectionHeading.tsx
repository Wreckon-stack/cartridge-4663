import type { ReactNode } from 'react'
import styles from './SectionHeading.module.css'

export interface SectionHeadingProps {
  /** Small chip, e.g. "STAGE 02". */
  stage: string
  title: string
  blurb?: ReactNode
  accent?: 'cyan' | 'magenta' | 'acid' | 'coin' | 'cart' | 'danger'
  /** Heading level. Every section on the page is an h2 under the hero's h1. */
  as?: 'h2' | 'h3'
  id?: string
}

export function SectionHeading({
  stage,
  title,
  blurb,
  accent = 'cyan',
  as: Tag = 'h2',
  id,
}: SectionHeadingProps) {
  return (
    <div className={styles.head} data-accent={accent}>
      <span className={styles.stage}>{stage}</span>
      <Tag className={styles.title} id={id}>
        {title}
      </Tag>
      {blurb ? <p className={styles.blurb}>{blurb}</p> : null}
    </div>
  )
}
