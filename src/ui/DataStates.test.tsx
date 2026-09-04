import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { StatCartridge } from './StatCartridge'
import { ArcadeGauge } from './ArcadeGauge'
import { DataStatusBadge } from './DataStatusBadge'
import { failed, live, noSignal, type Reading } from '@/lib/data-health'
import { WAD } from '@/lib/units'

const loadingReading: Reading<number> = { status: 'LOADING', value: null, fetchedAt: null }
const staleReading: Reading<number> = { status: 'STALE', value: 1, fetchedAt: 0 }

describe('StatCartridge honesty rules', () => {
  it('renders a dash, not a zero, when there is no value', () => {
    renderWithProviders(<StatCartridge label="PRICE" reading={noSignal()} value={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows NO SIGNAL when no source is configured', () => {
    renderWithProviders(<StatCartridge label="PRICE" reading={noSignal()} value={null} />)
    expect(screen.getByText('NO SIGNAL')).toBeInTheDocument()
  })

  it('refuses to display a value when the reading holds none, even if given one', () => {
    // Guards against a caller formatting a stale variable and passing it in.
    renderWithProviders(<StatCartridge label="PRICE" reading={noSignal()} value="9.99 GME" />)
    expect(screen.queryByText('9.99 GME')).not.toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows a loading slot rather than a fake number', () => {
    renderWithProviders(<StatCartridge label="PRICE" reading={loadingReading} value={null} />)
    // "READING…" appears twice — once in the skeleton slot, once in the status
    // badge — so target the live region specifically.
    expect(screen.getByRole('status')).toHaveTextContent('READING…')
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('shows the value once it is genuinely live', () => {
    renderWithProviders(<StatCartridge label="PRICE" reading={live(1)} value="0.0369 GME" />)
    expect(screen.getByText('0.0369 GME')).toBeInTheDocument()
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('keeps showing the last value with a FEED LOST badge on error', () => {
    const reading = failed<number>(new Error('rpc down'), live(1, 1000))
    renderWithProviders(<StatCartridge label="PRICE" reading={reading} value="0.0369 GME" />)
    expect(screen.getByText('0.0369 GME')).toBeInTheDocument()
    expect(screen.getByText('FEED LOST')).toBeInTheDocument()
  })

  it('labels a stale reading as stale', () => {
    renderWithProviders(<StatCartridge label="PRICE" reading={staleReading} value="0.0369 GME" />)
    expect(screen.getByText('STALE')).toBeInTheDocument()
  })

  it('describes direction in text, not only in colour', () => {
    renderWithProviders(<StatCartridge label="PRICE" reading={live(1)} value="1 GME" changeWad={5n * WAD} />)
    expect(screen.getByText(/\+5\.00%/)).toBeInTheDocument()
    expect(screen.getByText(/up over 24 hours/i)).toBeInTheDocument()
  })
})

describe('DataStatusBadge', () => {
  it('carries a text label alongside the colour for every state', () => {
    const states: Reading<number>[] = [
      live(1),
      staleReading,
      failed(new Error('x')),
      loadingReading,
      noSignal(),
    ]
    const expected = ['LIVE', 'STALE', 'FEED LOST', 'READING…', 'NO SIGNAL']
    states.forEach((reading, index) => {
      const { unmount } = renderWithProviders(<DataStatusBadge reading={reading} />)
      expect(screen.getByText(expected[index]!)).toBeInTheDocument()
      unmount()
    })
  })

  it('gives assistive tech a full description', () => {
    renderWithProviders(<DataStatusBadge reading={noSignal()} />)
    expect(screen.getByText(/no market data source is configured/i)).toBeInTheDocument()
  })
})

describe('ArcadeGauge', () => {
  it('is a real progressbar with a numeric value', () => {
    renderWithProviders(<ArcadeGauge label="CURVE" bps={5813} />)
    const bar = screen.getByRole('progressbar', { name: 'CURVE' })
    expect(bar).toHaveAttribute('aria-valuenow', '58.1')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('renders the number visibly too — the bar is never the only readout', () => {
    renderWithProviders(<ArcadeGauge label="CURVE" bps={5813} />)
    expect(screen.getByText('58.1%')).toBeInTheDocument()
  })

  it('says UNKNOWN rather than silently showing 0% when there is no data', () => {
    renderWithProviders(<ArcadeGauge label="CURVE" bps={null} />)
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    const bar = screen.getByRole('progressbar', { name: 'CURVE' })
    expect(bar).toHaveAttribute('aria-valuetext', expect.stringContaining('Unknown'))
    expect(bar).not.toHaveAttribute('aria-valuenow')
  })

  it('clamps out-of-range progress', () => {
    renderWithProviders(<ArcadeGauge label="CURVE" bps={99_999} />)
    expect(screen.getByText('100.0%')).toBeInTheDocument()
  })

  it('shows the floor and ceiling labels', () => {
    renderWithProviders(<ArcadeGauge label="CURVE" bps={5000} floor="214.5 GME" ceiling="369 GME" />)
    expect(screen.getByText('214.5 GME')).toBeInTheDocument()
    expect(screen.getByText('369 GME')).toBeInTheDocument()
  })
})
