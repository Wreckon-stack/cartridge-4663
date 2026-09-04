import { brand } from '@/config/project.config'
import { NAV_ITEMS } from '@/config/content/nav'
import { SOCIAL_LINKS } from '@/config/content/socials'
import { DISCLOSURE_FULL } from '@/config/content/disclosures'
import { ROBINHOOD_CHAIN_ID } from '@/config/chain.config'
import { EXTERNAL_LINK_PROPS } from '@/lib/links'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="shell">
        <div className={styles.top}>
          <div className={styles.brand}>
            <img className={styles.mark} src="/art/logo-mark.svg" alt="" width={56} height={56} />
            <div>
              <p className={styles.brandName}>{brand.name}</p>
              <p className={styles.brandTag}>{brand.tagline}</p>
              <p className={styles.brandTag}>Robinhood Chain · chain ID {ROBINHOOD_CHAIN_ID}</p>
            </div>
          </div>

          <nav aria-label="Footer">
            <p className={styles.colTitle}>SECTIONS</p>
            <ul className={styles.linkList}>
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a className={styles.link} href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={styles.colTitle}>OFFICIAL LINKS</p>
            <ul className={styles.linkList}>
              {SOCIAL_LINKS.map((link) => (
                <li key={link.id}>
                  {link.href ? (
                    <a className={styles.link} href={link.href} {...EXTERNAL_LINK_PROPS}>
                      {link.label} ↗<span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span className={styles.link} aria-disabled="true">
                      {link.label} — not configured
                    </span>
                  )}
                </li>
              ))}
              <li>
                <a
                  className={styles.link}
                  href="https://robinhoodchain.blockscout.com"
                  {...EXTERNAL_LINK_PROPS}
                >
                  BLOCK EXPLORER ↗<span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <section className={styles.disclosure} aria-labelledby="disclosure-title">
          <h2 className={styles.disclosureTitle} id="disclosure-title">
            ⚠ RISK DISCLOSURE AND LEGAL NOTICE
          </h2>
          <div className={styles.disclosureBody}>
            {DISCLOSURE_FULL.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        </section>

        <p className={styles.colophon}>
          <span>
            © {new Date().getFullYear()} {brand.name}. An independent project.
          </span>
          <span>All artwork on this site was generated from original pixel grids in this repository.</span>
          <span>No third-party game, console, or brand assets are used.</span>
        </p>
      </div>
    </footer>
  )
}
