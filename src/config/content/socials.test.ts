import { afterEach, describe, expect, it, vi } from 'vitest'

/** Re-import the module under a given env so module-level config is rebuilt. */
async function loadSocials(env: Record<string, string>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('./socials')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

const ids = (links: readonly { id: string }[]) => links.map((l) => l.id)

describe('social accounts the project does not have', () => {
  it('omits Telegram entirely when it is not configured', async () => {
    const { SOCIAL_LINKS } = await loadSocials({
      VITE_OFFICIAL_X_URL: 'https://x.com/cartridge_rh',
      VITE_OFFICIAL_TELEGRAM_URL: '',
    })
    // A channel the project does not have must not appear as a dead button.
    expect(ids(SOCIAL_LINKS)).not.toContain('telegram')
    expect(ids(SOCIAL_LINKS)).toContain('x')
  })

  it('omits X too if it is the one missing', async () => {
    const { SOCIAL_LINKS } = await loadSocials({
      VITE_OFFICIAL_X_URL: '',
      VITE_OFFICIAL_TELEGRAM_URL: 'https://t.me/example',
    })
    expect(ids(SOCIAL_LINKS)).not.toContain('x')
    expect(ids(SOCIAL_LINKS)).toContain('telegram')
  })

  it('shows both when both are configured', async () => {
    const { SOCIAL_LINKS } = await loadSocials({
      VITE_OFFICIAL_X_URL: 'https://x.com/cartridge_rh',
      VITE_OFFICIAL_TELEGRAM_URL: 'https://t.me/example',
    })
    expect(ids(SOCIAL_LINKS)).toEqual(expect.arrayContaining(['x', 'telegram']))
  })
})

describe('the trade venue', () => {
  it('is omitted when unconfigured, like any other dead link', async () => {
    // This project ships without a hosted trade page. A permanently disabled
    // TRADE / LAUNCH button would be indistinguishable from a broken one, so
    // the entry is dropped and PrimaryAction offers the contract instead.
    const { SOCIAL_LINKS } = await loadSocials({
      VITE_OFFICIAL_X_URL: '',
      VITE_OFFICIAL_TELEGRAM_URL: '',
      VITE_DEX_OR_LAUNCH_URL: '',
    })
    expect(ids(SOCIAL_LINKS)).toEqual([])
  })

  it('reappears if a venue is ever configured', async () => {
    const { SOCIAL_LINKS, TRADE_LINK } = await loadSocials({
      VITE_OFFICIAL_X_URL: '',
      VITE_OFFICIAL_TELEGRAM_URL: '',
      VITE_DEX_OR_LAUNCH_URL: 'https://example.com/token/0xabc',
    })
    expect(ids(SOCIAL_LINKS)).toEqual(['trade'])
    expect(TRADE_LINK).toBe('https://example.com/token/0xabc')
  })
})

describe('URL safety still applies', () => {
  it('rejects a non-http scheme rather than putting it in an href', async () => {
    const { SOCIAL_LINKS } = await loadSocials({
      // eslint-disable-next-line no-script-url
      VITE_OFFICIAL_X_URL: 'javascript:alert(1)',
    })
    // Rejected by safeExternalUrl -> href null -> omitted as unconfigured.
    expect(ids(SOCIAL_LINKS)).not.toContain('x')
  })

  it('rejects a malformed URL', async () => {
    const { SOCIAL_LINKS } = await loadSocials({ VITE_OFFICIAL_X_URL: 'not a url' })
    expect(ids(SOCIAL_LINKS)).not.toContain('x')
  })

  it('keeps a valid https URL intact', async () => {
    const { SOCIAL_LINKS } = await loadSocials({
      VITE_OFFICIAL_X_URL: 'https://x.com/cartridge_rh',
    })
    expect(SOCIAL_LINKS.find((l) => l.id === 'x')?.href).toBe('https://x.com/cartridge_rh')
  })
})
