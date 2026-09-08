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
  /** Null when unconfigured. See `alwaysShow` for what that means visually. */
  readonly href: string | null
  readonly accent: 'cyan' | 'magenta' | 'acid' | 'coin' | 'cart'
  /**
   * Whether to keep rendering the control when it has no URL.
   *
   * The distinction matters:
   *  - A social account with no URL means the project does not have that
   *    channel. Advertising a permanently dead TELEGRAM button would be
   *    misleading, so it is omitted entirely.
   *  - The trade venue always renders, disabled, because pre-launch its absence
   *    is information: the venue exists conceptually and is not open yet.
   */
  readonly alwaysShow: boolean
}

const ALL_LINKS: readonly SocialLink[] = [
  { id: 'x', label: 'OFFICIAL X', href: safeExternalUrl(links.x), accent: 'cyan', alwaysShow: false },
  {
    id: 'telegram',
    label: 'TELEGRAM',
    href: safeExternalUrl(links.telegram),
    accent: 'magenta',
    alwaysShow: false,
  },
  {
    id: 'trade',
    label: 'TRADE / LAUNCH',
    href: safeExternalUrl(links.dexOrLaunch),
    accent: 'coin',
    alwaysShow: true,
  },
]

/** Links to actually render: everything configured, plus the trade venue. */
export const SOCIAL_LINKS: readonly SocialLink[] = ALL_LINKS.filter(
  (link) => link.href !== null || link.alwaysShow,
)

export const TRADE_LINK = safeExternalUrl(links.dexOrLaunch)
