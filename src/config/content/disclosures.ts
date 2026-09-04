/**
 * Legal disclosures.
 *
 * Wording is deliberately plain — this is the one part of the site that does
 * not do a bit. `SHORT` sits next to the pairing explanation, `FULL` in the
 * footer. Adjust after legal review, but do not remove the distinctions:
 * not-equity, not-affiliated, transfer-restrictions, volatility.
 */
export const DISCLOSURE_SHORT =
  'This is an independent project. It is not affiliated with, endorsed by, or sponsored by GameStop, Robinhood, Nintendo, or any other company named on this page. The project token is not GameStop stock and grants no shares, dividends, voting rights, or ownership of anything.'

export const DISCLOSURE_FULL: readonly string[] = [
  'This independent project is not affiliated with, endorsed by or sponsored by GameStop, Robinhood, Nintendo, Sega, Sony, or any other referenced company. All company names, tickers, and network names appear for factual identification only and imply no partnership, endorsement, or ownership.',
  'The project token is not GameStop stock. Holding it does not provide shares, equity, dividends, voting rights, revenue, or ownership of GameStop Corp. or of any other entity. It is not a security offering and nothing here is an offer to sell one.',
  'The GME stock token is a separate asset issued by a third party. Its availability, redemption, and transfer eligibility may depend on the network, the issuer, and your jurisdiction. This site does not issue, custody, redeem, or control it.',
  'Prices shown on this page are read from public on-chain sources and describe a token pool. They are not official exchange quotes for GameStop shares and should never be read as one.',
  'Crypto assets are volatile and may lose all of their value. Nothing on this site is financial, investment, legal, or tax advice. No return, liquidity, listing, or price outcome is promised or implied.',
  'Always verify contract addresses against an official source before transacting. Many unrelated contracts reuse well-known tickers.',
]

/** The single most important sentence on the site. Repeated by design. */
export const NOT_A_SHARE = 'THE PROJECT TOKEN IS NOT GAMESTOP STOCK.'
