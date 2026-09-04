import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { ContractCopyField } from './ContractCopyField'
import { GME_STOCK_TOKEN_ADDRESS } from '@/config/chain.config'

/**
 * jsdom exposes navigator.clipboard as a getter-only property, so it has to be
 * replaced with defineProperty rather than Object.assign.
 *
 * IMPORTANT: userEvent.setup() installs its own clipboard stub, so this must be
 * called AFTER setup() or our mock is silently replaced and the component ends
 * up talking to userEvent's clipboard instead.
 */
function stubClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
    writable: true,
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('with an address', () => {
  it('shows the FULL address, never a truncated one', () => {
    renderWithProviders(<ContractCopyField label="GME" address={GME_STOCK_TOKEN_ADDRESS} />)
    expect(screen.getByText(GME_STOCK_TOKEN_ADDRESS)).toBeInTheDocument()
  })

  it('copies to the clipboard and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    stubClipboard({ writeText })
    renderWithProviders(<ContractCopyField label="GME" address={GME_STOCK_TOKEN_ADDRESS} />)

    await user.click(screen.getByRole('button', { name: /copy/i }))
    expect(writeText).toHaveBeenCalledWith(GME_STOCK_TOKEN_ADDRESS)
    expect(await screen.findByText('COPIED')).toBeInTheDocument()
  })

  it('announces the copy to screen readers', async () => {
    const user = userEvent.setup()
    stubClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    renderWithProviders(<ContractCopyField label="GME" address={GME_STOCK_TOKEN_ADDRESS} />)
    await user.click(screen.getByRole('button', { name: /copy/i }))
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument()
  })

  it('reports failure instead of falsely claiming success', async () => {
    const user = userEvent.setup()
    stubClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    // Also make the legacy fallback fail.
    document.execCommand = vi.fn().mockReturnValue(false)
    renderWithProviders(<ContractCopyField label="GME" address={GME_STOCK_TOKEN_ADDRESS} />)

    await user.click(screen.getByRole('button', { name: /copy/i }))
    expect(await screen.findByText('FAILED')).toBeInTheDocument()
    expect(screen.queryByText('COPIED')).not.toBeInTheDocument()
  })

  it('falls back to execCommand when the Clipboard API is unavailable', async () => {
    const user = userEvent.setup()
    stubClipboard(undefined)
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand
    renderWithProviders(<ContractCopyField label="GME" address={GME_STOCK_TOKEN_ADDRESS} />)

    await user.click(screen.getByRole('button', { name: /copy/i }))
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(await screen.findByText('COPIED')).toBeInTheDocument()
  })

  it('offers an explorer link with the anti-tabnabbing attributes', () => {
    renderWithProviders(<ContractCopyField label="GME" address={GME_STOCK_TOKEN_ADDRESS} />)
    const link = screen.getByRole('link', { name: /explorer/i })
    expect(link).toHaveAttribute('href', expect.stringContaining(GME_STOCK_TOKEN_ADDRESS))
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAttribute('target', '_blank')
  })
})

describe('without an address (pre-launch)', () => {
  it('says there is nothing to copy rather than showing a blank box', () => {
    renderWithProviders(<ContractCopyField label="CART" address={null} />)
    expect(screen.getByText(/NOT DEPLOYED YET/i)).toBeInTheDocument()
  })

  it('disables the copy control — a dead button is not acceptable', () => {
    renderWithProviders(<ContractCopyField label="CART" address={null} />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeDisabled()
  })

  it('renders no explorer link, rather than one pointing nowhere', () => {
    renderWithProviders(<ContractCopyField label="CART" address={null} />)
    expect(screen.queryByRole('link', { name: /explorer/i })).not.toBeInTheDocument()
  })

  it('does nothing at all when the disabled control is clicked', async () => {
    const writeText = vi.fn()
    const user = userEvent.setup()
    stubClipboard({ writeText })
    renderWithProviders(<ContractCopyField label="CART" address={null} />)
    await user.click(screen.getByRole('button', { name: /copy/i }))
    expect(writeText).not.toHaveBeenCalled()
  })
})
