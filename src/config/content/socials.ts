import { links } from '../project.config'
import { safeExternalUrl } from '@/lib/links'

/**
 * Outbound links.
 *
 * Every URL is run through `safeExternalUrl`, which rejects anything that is
 * not http(s). A misconfigured or hostile env var therefore cannot put a
 * `javascript:` URL into an href.
 */
export interface SocialLink {
  readonly id: string
  readonly label: string
  /** Null when unconfigured — renders as a disabled control. */
  readonly href: string | null
  readonly accent: 'cyan' | 'magenta' | 'acid' | 'coin' | 'cart'
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { id: 'x', label: 'OFFICIAL X', href: safeExternalUrl(links.x), accent: 'cyan' },
  { id: 'telegram', label: 'TELEGRAM', href: safeExternalUrl(links.telegram), accent: 'magenta' },
  { id: 'trade', label: 'TRADE / LAUNCH', href: safeExternalUrl(links.dexOrLaunch), accent: 'coin' },
]

export const TRADE_LINK = safeExternalUrl(links.dexOrLaunch)
