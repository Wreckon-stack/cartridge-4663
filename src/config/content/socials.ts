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
   * Currently false for everything: a link with no destination is omitted
   * rather than shown disabled, because this project has no hosted trade page
   * and a permanently dead button is worse than no button. The flag is kept
   * because the distinction is real — if a venue is ever configured, that entry
   * reappears automatically.
   *
   * The hero's primary call to action is handled separately by
   * `src/ui/PrimaryAction.tsx`, which falls back to copying the contract.
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
    alwaysShow: false,
  },
]

/** Links to actually render: everything configured, plus the trade venue. */
export const SOCIAL_LINKS: readonly SocialLink[] = ALL_LINKS.filter(
  (link) => link.href !== null || link.alwaysShow,
)

export const TRADE_LINK = safeExternalUrl(links.dexOrLaunch)

/** The official X account, for the header. Null when unconfigured. */
export const X_LINK = safeExternalUrl(links.x)
