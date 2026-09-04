import { brand } from '@/config/project.config'
import { DISCLOSURE_SHORT } from '@/config/content/disclosures'
import { EXTERNAL_LINK_PROPS } from '@/lib/links'
import { SectionHeading } from '@/ui/SectionHeading'
import styles from './HowPairing.module.css'

/**
 * The cartridge manual: how the pairing actually works.
 *
 * Written for someone with no Web3 background. Jargon is either avoided or
 * immediately defined, and the diagram is an inline SVG so it inherits the
 * page's colours and needs no image request.
 */
export function HowPairing() {
  return (
    <section className="section shell" id="how" aria-labelledby="how-title">
      <SectionHeading
        stage="STAGE 04"
        title="How the pairing works"
        id="how-title"
        accent="magenta"
        blurb="The instruction manual nobody kept. Five steps, one diagram, and a warning label."
      />

      <div className={styles.manual}>
        <div className={styles.manualHead}>
          <h3 className={styles.manualTitle}>
            {brand.name} — Owner&rsquo;s Manual
            <br />
            Section 4: The Two-Player Cable
          </h3>
          <span className={styles.manualMeta}>PART NO. 4663-GME · REV. A · PRINTED IN A HURRY</span>
        </div>

        {/*
          This panel scrolls horizontally on narrow screens. A scrollable region
          has to be keyboard-reachable, so it is focusable and named — otherwise
          a keyboard user cannot pan it to see the right-hand side.
        */}
        <div
          className={styles.diagram}
          tabIndex={0}
          role="group"
          aria-label="Diagram: how the token and the GME stock token connect. Scrollable horizontally."
        >
          <PairingDiagram />
        </div>

        <ol className={styles.steps}>
          <li className={styles.step}>
            <h4 className={styles.stepTitle}>THE TOKEN IS CREATED</h4>
            <p className={styles.stepBody}>
              A new token is issued through <strong>Pons V2</strong>, a launchpad on Robinhood Chain. Its
              total supply is fixed at creation. Nobody can mint more of it later.
            </p>
          </li>

          <li className={styles.step}>
            <h4 className={styles.stepTitle}>GME IS CHOSEN AS THE QUOTE</h4>
            <p className={styles.stepBody}>
              Every market prices one thing in terms of another. This one is priced in the{' '}
              <strong>GME stock token</strong> rather than in ETH. The launchpad allows this because its
              factory contract lists GME as an approved quote asset — you can see that check running live in
              the section above.
            </p>
          </li>

          <li className={styles.step}>
            <h4 className={styles.stepTitle}>BUYS AND SELLS USE GME</h4>
            <p className={styles.stepBody}>
              To buy, you hand over GME stock tokens and receive{' '}
              {brand.symbol ? `$${brand.symbol}` : 'the token'}. To sell, the reverse. The price is set by a{' '}
              <strong>bonding curve</strong>: a formula where each purchase makes the next one slightly more
              expensive, and each sale slightly cheaper. There is no order book and no counterparty.
            </p>
          </li>

          <li className={styles.step}>
            <h4 className={styles.stepTitle}>THE CURVE GRADUATES</h4>
            <p className={styles.stepBody}>
              Once the curve has taken in <code>369 GME</code>, it graduates: the accumulated liquidity moves
              into a permanently locked <strong>Uniswap v4</strong> pool behind a custom hook contract, and
              trading continues there instead.
            </p>
          </li>

          <li className={styles.step}>
            <h4 className={styles.stepTitle}>THE TWO STAY SEPARATE</h4>
            <p className={styles.stepBody}>
              They are two different contracts that never merge. GME&rsquo;s price moves with whatever the
              stock token tracks. This token&rsquo;s price moves with whatever people are willing to pay for
              it. Trading one against the other does not make either of them become the other.
            </p>
          </li>
        </ol>

        <div className={styles.warn}>
          <p className={styles.warnTitle}>⚠ WARNING — READ BEFORE OPERATING</p>
          <p className={styles.warnBody}>{DISCLOSURE_SHORT}</p>
        </div>

        <div className={styles.sources}>
          <strong>Check any of this yourself:</strong>
          <ul>
            <li>
              <a href="https://docs.robinhood.com/chain/connecting" {...EXTERNAL_LINK_PROPS}>
                Robinhood Chain network configuration (chain ID 4663) ↗
              </a>
            </li>
            <li>
              <a href="https://docs.robinhood.com/chain/stock-tokens/" {...EXTERNAL_LINK_PROPS}>
                How Robinhood stock tokens work ↗
              </a>
            </li>
            <li>
              <a
                href="https://robinhoodchain.blockscout.com/address/0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e"
                {...EXTERNAL_LINK_PROPS}
              >
                PonsV2LaunchFactory — verified source on Blockscout ↗
              </a>
            </li>
            <li>
              <a
                href="https://robinhoodchain.blockscout.com/address/0x1b0E319c6A659F002271B69dB8A7df2F911c153E"
                {...EXTERNAL_LINK_PROPS}
              >
                The GME stock token contract ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/**
 * Inline flow diagram.
 *
 * Given a title + desc and role="img" so it is announced as a single labelled
 * graphic instead of a pile of unlabelled shapes.
 */
function PairingDiagram() {
  return (
    <svg
      className={styles.diagramSvg}
      viewBox="0 0 720 266"
      role="img"
      aria-labelledby="diagram-title diagram-desc"
    >
      <title id="diagram-title">How the token and the GME stock token connect</title>
      <desc id="diagram-desc">
        A flow diagram. On the left, a buyer sends GME stock tokens into a Pons V2 bonding curve. The curve
        returns project tokens. Once the curve has collected 369 GME it graduates, moving the liquidity into a
        locked Uniswap v4 pool. A separate note underneath states that the two tokens remain distinct
        contracts and that the project token is not GameStop equity.
      </desc>

      {[
        { x: 8, label: 'YOU', sub: 'holding GME', fill: '#00f5ff' },
        { x: 196, label: 'BONDING CURVE', sub: 'Pons V2', fill: '#ffe600' },
        { x: 384, label: '369 GME', sub: 'graduation', fill: '#39ff14' },
        { x: 560, label: 'UNISWAP V4', sub: 'locked pool', fill: '#ff00d4' },
      ].map((box) => (
        <g key={box.label}>
          <rect x={box.x} y={54} width={152} height={78} fill={box.fill} stroke="#14140c" strokeWidth={4} />
          <text
            x={box.x + 76}
            y={88}
            textAnchor="middle"
            fontFamily="'Press Start 2P', monospace"
            fontSize={11}
            fill="#14140c"
          >
            {box.label}
          </text>
          <text
            x={box.x + 76}
            y={112}
            textAnchor="middle"
            fontFamily="'IBM Plex Mono', monospace"
            fontSize={12}
            fill="#33332a"
          >
            {box.sub}
          </text>
        </g>
      ))}

      {/* Arrows between the boxes. */}
      {[168, 356, 532].map((x) => (
        <g key={x}>
          <line x1={x} y1={93} x2={x + 22} y2={93} stroke="#14140c" strokeWidth={5} />
          <polygon points={`${x + 28},93 ${x + 14},85 ${x + 14},101`} fill="#14140c" />
        </g>
      ))}

      <text x={8} y={30} fontFamily="'Press Start 2P', monospace" fontSize={11} fill="#14140c">
        BUY / SELL FLOW
      </text>

      <rect x={8} y={162} width={704} height={86} fill="#14140c" />
      <text x={24} y={190} fontFamily="'Press Start 2P', monospace" fontSize={10} fill="#ff2134">
        THESE REMAIN TWO SEPARATE CONTRACTS
      </text>
      {/* Split across two lines: one line at 13px overflowed the 704-unit panel
          and was clipped mid-word. */}
      <text x={24} y={214} fontFamily="'IBM Plex Mono', monospace" fontSize={12} fill="#f4f0dd">
        The project token is not GameStop stock.
      </text>
      <text x={24} y={234} fontFamily="'IBM Plex Mono', monospace" fontSize={12} fill="#f4f0dd">
        It grants no shares, dividends, votes or ownership.
      </text>
    </svg>
  )
}
