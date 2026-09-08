import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * The single most important safety property in this codebase:
 * a PRODUCTION build must never serve mock market data.
 *
 * `marketDataSource` is computed at module load from import.meta.env, so each
 * case resets the module registry and stubs the environment before importing.
 */
afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

async function loadConfig() {
  vi.resetModules()
  return import('./project.config')
}

describe('mock data in production', () => {
  it('is downgraded to "none" when PROD is true', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_MARKET_DATA_SOURCE', 'mock')
    const config = await loadConfig()
    expect(config.marketDataSource).toBe('none')
  })

  it('raises the mockDataWasBlocked flag so the UI can say what happened', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_MARKET_DATA_SOURCE', 'mock')
    const config = await loadConfig()
    expect(config.mockDataWasBlocked).toBe(true)
  })

  it('is allowed in development, where fixtures are the point', async () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_MARKET_DATA_SOURCE', 'mock')
    const config = await loadConfig()
    expect(config.marketDataSource).toBe('mock')
    expect(config.mockDataWasBlocked).toBe(false)
  })

  it('leaves a real chain source alone in production', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_MARKET_DATA_SOURCE', 'chain')
    const config = await loadConfig()
    expect(config.marketDataSource).toBe('chain')
    expect(config.mockDataWasBlocked).toBe(false)
  })

  it('falls back to "none" for an unrecognised source rather than guessing', async () => {
    vi.stubEnv('VITE_MARKET_DATA_SOURCE', 'coingecko-maybe')
    const config = await loadConfig()
    expect(config.marketDataSource).toBe('none')
  })

  it('defaults to "none" when nothing is configured', async () => {
    vi.stubEnv('VITE_MARKET_DATA_SOURCE', '')
    const config = await loadConfig()
    expect(config.marketDataSource).toBe('none')
  })
})

describe('placeholder rejection', () => {
  it.each(['TODO', 'TBD', 'CHANGEME', 'PLACEHOLDER', '0x0000000000000000000000000000000000000000'])(
    'treats %s as "not configured" rather than as a real address',
    async (placeholder) => {
      vi.stubEnv('VITE_TOKEN_ADDRESS', placeholder)
      const config = await loadConfig()
      expect(config.onchain.tokenAddress).toBeUndefined()
    },
  )

  it('trims whitespace-only values to undefined', async () => {
    vi.stubEnv('VITE_OFFICIAL_X_URL', '   ')
    const config = await loadConfig()
    expect(config.links.x).toBeUndefined()
  })

  it('keeps a genuinely configured address', async () => {
    vi.stubEnv('VITE_TOKEN_ADDRESS', '0x1b0E319c6A659F002271B69dB8A7df2F911c153E')
    const config = await loadConfig()
    expect(config.onchain.tokenAddress).toBe('0x1b0E319c6A659F002271B69dB8A7df2F911c153E')
  })
})

describe('defaults that keep the site honest', () => {
  it('defaults the chain to Robinhood Chain mainnet', async () => {
    const config = await loadConfig()
    expect(config.onchain.chainId).toBe(4663)
  })

  it('defaults the GME address to the canonical stock token', async () => {
    const config = await loadConfig()
    expect(config.onchain.gmeStockTokenAddress).toBe('0x1b0E319c6A659F002271B69dB8A7df2F911c153E')
  })

  it('leaves the project token undefined by default', async () => {
    const config = await loadConfig()
    expect(config.onchain.tokenAddress).toBeUndefined()
  })

  it('has wallet support off by default', async () => {
    const config = await loadConfig()
    expect(config.features.wallet).toBe(false)
  })

  it('treats branding as provisional unless explicitly finalised', async () => {
    // Pinned rather than inherited: this asserts the DEFAULT, so it must not
    // depend on whether the developer has set the flag in their own .env.local.
    vi.stubEnv('VITE_BRANDING_FINAL', '')
    const config = await loadConfig()
    expect(config.brand.brandingFinal).toBe(false)
  })

  it('honours the flag once it is explicitly set', async () => {
    vi.stubEnv('VITE_BRANDING_FINAL', 'true')
    const config = await loadConfig()
    expect(config.brand.brandingFinal).toBe(true)
  })

  it('only accepts the exact string "true"', async () => {
    for (const value of ['TRUE', 'yes', '1', 'false', 'truthy']) {
      vi.stubEnv('VITE_BRANDING_FINAL', value)
      const config = await loadConfig()
      expect(config.brand.brandingFinal).toBe(false)
    }
  })

  it('strips a trailing slash from the site URL so canonical tags are stable', async () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com/')
    const config = await loadConfig()
    expect(config.brand.siteUrl).toBe('https://example.com')
  })
})
