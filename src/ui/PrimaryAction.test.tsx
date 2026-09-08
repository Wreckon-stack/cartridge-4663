import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
const TOKEN = '0xe4a0D07F2c2cF083cC715333ea0F16fBB7087e86'

/**
 * Load the component under a given env and render it.
 *
 * PrefsProvider must be imported from the SAME module graph as the component:
 * vi.resetModules() creates a fresh React context object, so a statically
 * imported provider would not satisfy the component's useContext and every
 * test would fail with "usePrefs must be used inside <PrefsProvider>".
 */
async function draw(env: Record<string, string>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  const [{ PrimaryAction }, { PrefsProvider }] = await Promise.all([
    import('./PrimaryAction'),
    import('./PrefsProvider'),
  ])
  return render(
    <PrefsProvider>
      <PrimaryAction />
    </PrefsProvider>,
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.restoreAllMocks()
})

describe('with no trade venue (this project)', () => {
  it('offers to copy the contract rather than showing a dead trade button', async () => {
    await draw({ VITE_DEX_OR_LAUNCH_URL: '', VITE_TOKEN_ADDRESS: TOKEN })
    expect(screen.getByRole('button', { name: /copy contract/i })).toBeEnabled()
    expect(screen.queryByText(/insert coin/i)).not.toBeInTheDocument()
  })

  it('copies the address to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    await draw({ VITE_DEX_OR_LAUNCH_URL: '', VITE_TOKEN_ADDRESS: TOKEN })
    await userEvent.click(screen.getByRole('button', { name: /copy contract/i }))
    expect(writeText).toHaveBeenCalledWith(TOKEN)
    // Both the button label and the aria-live status say "copied"; assert each.
    expect(await screen.findByRole('button', { name: /✓ COPIED/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/copied to clipboard/i)
  })

  it('reports a failure instead of falsely claiming success', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('nope')) } })
    // jsdom does not implement execCommand, so define it before stubbing.
    Object.defineProperty(document, 'execCommand', { value: vi.fn(() => false), configurable: true })
    await draw({ VITE_DEX_OR_LAUNCH_URL: '', VITE_TOKEN_ADDRESS: TOKEN })
    await userEvent.click(screen.getByRole('button', { name: /copy contract/i }))
    expect(await screen.findByRole('button', { name: /copy failed/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/could not copy/i)
  })

  it('falls back to execCommand when the clipboard API is unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined })
    const exec = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true })
    await draw({ VITE_DEX_OR_LAUNCH_URL: '', VITE_TOKEN_ADDRESS: TOKEN })
    await userEvent.click(screen.getByRole('button', { name: /copy contract/i }))
    expect(exec).toHaveBeenCalledWith('copy')
    expect(await screen.findByRole('button', { name: /✓ COPIED/i })).toBeInTheDocument()
  })
})

describe('before the token is deployed', () => {
  it('is disabled with an explicit, temporary reason', async () => {
    await draw({ VITE_DEX_OR_LAUNCH_URL: '', VITE_TOKEN_ADDRESS: '' })
    const button = screen.getByRole('button', { name: /copy contract/i })
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/copy contract/i)
    expect(button.textContent).toBeTruthy()
  })

  it('states why it is disabled for screen reader users', async () => {
    await draw({ VITE_DEX_OR_LAUNCH_URL: '', VITE_TOKEN_ADDRESS: '' })
    expect(screen.getByRole('button', { name: /has not been deployed yet/i })).toBeInTheDocument()
  })

  it('does not copy anything when disabled', async () => {
    const writeText = vi.fn()
    Object.assign(navigator, { clipboard: { writeText } })
    await draw({ VITE_DEX_OR_LAUNCH_URL: '', VITE_TOKEN_ADDRESS: '' })
    await userEvent.click(screen.getByRole('button', { name: /copy contract/i })).catch(() => {})
    expect(writeText).not.toHaveBeenCalled()
  })

  it('rejects a malformed configured address rather than copying it', async () => {
    const writeText = vi.fn()
    Object.assign(navigator, { clipboard: { writeText } })
    await draw({ VITE_DEX_OR_LAUNCH_URL: '', VITE_TOKEN_ADDRESS: '0xnope' })
    expect(screen.getByRole('button', { name: /copy contract/i })).toBeDisabled()
  })
})

describe('if a trade venue is configured later', () => {
  it('becomes an INSERT COIN link without any code change', async () => {
    await draw({
      VITE_DEX_OR_LAUNCH_URL: 'https://example.com/token/0xabc',
      VITE_TOKEN_ADDRESS: TOKEN,
    })
    const link = screen.getByRole('link', { name: /insert coin/i })
    expect(link).toHaveAttribute('href', 'https://example.com/token/0xabc')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(screen.queryByRole('button', { name: /copy contract/i })).not.toBeInTheDocument()
  })

  it('ignores a non-http venue URL and falls back to copying', async () => {
    await draw({
      // eslint-disable-next-line no-script-url
      VITE_DEX_OR_LAUNCH_URL: 'javascript:alert(1)',
      VITE_TOKEN_ADDRESS: TOKEN,
    })
    expect(screen.getByRole('button', { name: /copy contract/i })).toBeInTheDocument()
  })
})
