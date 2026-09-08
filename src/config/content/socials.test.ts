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

describe('the trade venue is different', () => {
  it('always renders, even unconfigured, because its absence is information', async () => {
    const { SOCIAL_LINKS } = await loadSocials({
      VITE_OFFICIAL_X_URL: '',
      VITE_OFFICIAL_TELEGRAM_URL: '',
      VITE_DEX_OR_LAUNCH_URL: '',
    })
    const trade = SOCIAL_LINKS.find((l) => l.id === 'trade')
    expect(trade).toBeDefined()
    expect(trade?.href).toBeNull()
  })

  it('is the only entry when nothing at all is configured', async () => {
    const { SOCIAL_LINKS } = await loadSocials({
      VITE_OFFICIAL_X_URL: '',
      VITE_OFFICIAL_TELEGRAM_URL: '',
      VITE_DEX_OR_LAUNCH_URL: '',
    })
    expect(ids(SOCIAL_LINKS)).toEqual(['trade'])
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
