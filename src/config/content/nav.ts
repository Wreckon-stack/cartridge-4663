/** Navigation. Order here is the order in the strip and the drawer. */
export interface NavItem {
  readonly id: string
  readonly label: string
  /** In-page anchor. */
  readonly href: string
  /** Accent used for the link colour in the messy nav strip. */
  readonly accent: 'cyan' | 'magenta' | 'acid' | 'coin' | 'cart' | 'paper'
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'welcome', label: 'WELCOME', href: '#welcome', accent: 'cyan' },
  { id: 'cartridge', label: 'THE CARTRIDGE', href: '#cartridge', accent: 'cart' },
  { id: 'gme-link', label: 'GME LINK', href: '#gme-link', accent: 'acid' },
  { id: 'market', label: 'MARKET ARCADE', href: '#market', accent: 'coin' },
  { id: 'how', label: 'HOW IT PAIRS', href: '#how', accent: 'magenta' },
  { id: 'archives', label: 'THE ARCHIVES', href: '#archives', accent: 'paper' },
  { id: 'gallery', label: 'EVIDENCE REEL', href: '#gallery', accent: 'cyan' },
  { id: 'scores', label: 'HIGH SCORES', href: '#scores', accent: 'acid' },
  { id: 'final', label: 'FINAL LEVEL', href: '#final', accent: 'magenta' },
]

/**
 * Phrases for a hazard strip.
 *
 * NOT CURRENTLY RENDERED — the strip above the navigation was removed at the
 * operator's request. Kept so it can be restored in one line if wanted:
 *   <WarningMarquee items={TICKER_PHRASES} tone="danger" />
 * at the top of NavBar's returned fragment.
 */
export const TICKER_PHRASES: readonly string[] = [
  'CARTRIDGE SERIAL 4663 DETECTED IN AISLE SEVEN',
  'THIS IS NOT GAMESTOP STOCK',
  'QUOTE ASSET: GME STOCK TOKEN',
  'ROBINHOOD CHAIN · ID 4663',
  'THE ATTENDANT HAS SEEN THINGS',
  'NO PUBLISHER · NO BOX · NO REFUNDS',
  'GRADUATION THRESHOLD 369 GME',
  'PLEASE DO NOT LICK THE CONTACTS',
]
