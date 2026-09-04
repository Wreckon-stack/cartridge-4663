/**
 * THE ARCHIVES — the obsessive evidence board.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT: this file must only ever contain things that ACTUALLY HAPPENED.
 *
 * The project has not launched, so most slots are deliberately empty. An empty
 * slot renders as "ARCHIVE SLOT EMPTY" — it is part of the aesthetic and it is
 * honest. Do not fill these in with invented history to make the section look
 * busier. Add an exhibit when there is a real artefact to point at.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ExhibitStatus =
  /** Independently checkable right now — has a source link. */
  | 'CONFIRMED'
  /** True, but not externally verifiable (e.g. a design decision). */
  | 'ON RECORD'
  /** Reserved slot with nothing in it yet. */
  | 'EMPTY'

export interface Exhibit {
  readonly id: string
  /** Exhibit number shown on the card, e.g. "EX-004". */
  readonly ref: string
  readonly title: string
  /** ISO date, or null for an unfilled slot. */
  readonly date: string | null
  readonly status: ExhibitStatus
  /** Body copy. Empty slots use `null`. */
  readonly body: string | null
  /** Where a reader can check the claim themselves. */
  readonly source?: { readonly label: string; readonly href: string }
  /** Optional artwork from public/art. */
  readonly image?: { readonly src: string; readonly alt: string }
}

export const EXHIBITS: readonly Exhibit[] = [
  {
    id: 'chain-id',
    ref: 'EX-001',
    title: 'The network answers to 4663',
    date: '2026-09-04',
    status: 'CONFIRMED',
    body: 'Robinhood Chain mainnet reports chain ID 0x1237 — decimal 4663 — over its public JSON-RPC endpoint. The number on the cartridge label is the network it lives on. That is the entire joke and it is checkable in one request.',
    source: {
      label: 'docs.robinhood.com — connecting to Robinhood Chain',
      href: 'https://docs.robinhood.com/chain/connecting',
    },
  },
  {
    id: 'gme-contract',
    ref: 'EX-002',
    title: 'The GME stock token identifies itself',
    date: '2026-09-04',
    status: 'CONFIRMED',
    body: 'Calling name() on 0x1b0E319c6A659F002271B69dB8A7df2F911c153E returns "GameStop • Robinhood Token". symbol() returns GME. decimals() returns 18. It is a beacon proxy pointing at an implementation named Stock. Hundreds of other contracts on this chain also call themselves GME. This is the one that is real.',
    source: {
      label: 'Blockscout — GME stock token contract',
      href: 'https://robinhoodchain.blockscout.com/address/0x1b0E319c6A659F002271B69dB8A7df2F911c153E',
    },
  },
  {
    id: 'approved-pair',
    ref: 'EX-003',
    title: 'GME is an approved pair asset',
    date: '2026-09-04',
    status: 'CONFIRMED',
    body: 'The live Pons V2 launch factory returns true for approvedPairTokens(GME), and pairTokenEconomics(GME) reports a graduation threshold of 369 GME against 147.6 GME of virtual reserve. Nobody had to ask permission for this to be possible. It was just sitting there, switched on.',
    source: {
      label: 'Blockscout — PonsV2LaunchFactory (verified source)',
      href: 'https://robinhoodchain.blockscout.com/address/0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e',
    },
  },
  {
    id: 'the-shell',
    ref: 'EX-004',
    title: 'Cartridge shell, revision A',
    date: '2026-09-04',
    status: 'ON RECORD',
    body: 'Orange shell, cyan label plate, fifteen contacts along the bottom edge. Drawn as a pixel grid rather than a photograph because no such cartridge has ever physically existed. Anyone claiming to own one is lying to you.',
    image: {
      src: '/art/cartridge-hero.svg',
      alt: 'The Cartridge 4663 shell: an orange game cartridge with a cyan label plate showing a rising candlestick chart.',
    },
  },
  {
    id: 'token-deploy',
    ref: 'EX-005',
    title: 'Token deployment',
    date: null,
    status: 'EMPTY',
    body: null,
  },
  {
    id: 'pool-open',
    ref: 'EX-006',
    title: 'Curve opens against GME',
    date: null,
    status: 'EMPTY',
    body: null,
  },
  {
    id: 'graduation',
    ref: 'EX-007',
    title: 'Graduation to Uniswap v4',
    date: null,
    status: 'EMPTY',
    body: null,
  },
  {
    id: 'first-sighting',
    ref: 'EX-008',
    title: 'First community sighting',
    date: null,
    status: 'EMPTY',
    body: null,
  },
]

/**
 * HIGH SCORES — milestone board.
 *
 * Same rule as the archive: `value: null` renders NO SCORE RECORDED. These are
 * project milestones, never wallet rankings — we do not publish leaderboards of
 * holders, because that is how people get targeted.
 */
export interface HighScore {
  readonly id: string
  readonly label: string
  /** Pre-formatted display value, or null when nothing has been recorded. */
  readonly value: string | null
  readonly note: string
}

export const HIGH_SCORES: readonly HighScore[] = [
  { id: 'days', label: 'DAYS ONLINE', value: null, note: 'Counts from the day the site goes live.' },
  {
    id: 'exhibits',
    label: 'ARCHIVE EXHIBITS',
    value: null,
    note: 'Filled automatically from the archive above.',
  },
  {
    id: 'holders',
    label: 'HOLDERS',
    value: null,
    note: 'Requires a launched token and a trustworthy indexer.',
  },
  {
    id: 'mcap-peak',
    label: 'PEAK MARKET CAP',
    value: null,
    note: 'Recorded only from verified market data.',
  },
  {
    id: 'volume-day',
    label: 'BEST 24H VOLUME',
    value: null,
    note: 'Recorded only from verified market data.',
  },
  { id: 'art', label: 'COMMUNITY ART', value: null, note: 'Counts submissions we have actually received.' },
]
