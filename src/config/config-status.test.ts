import { describe, expect, it, vi } from 'vitest'
import { allChecks, buildChainChecks, buildProjectChecks, getSiteStatus } from './config-status'
import { GME_STOCK_TOKEN_ADDRESS, ROBINHOOD_CHAIN_ID } from './chain.config'

/**
 * These tests run against the DEFAULT (unconfigured) environment, which is the
 * state the site actually ships in before launch. That is deliberate: the most
 * important property to lock down is that an empty config produces PRE_LAUNCH
 * and never a green light.
 */
describe('chain checks', () => {
  it('verifies the chain id against 4663', () => {
    const check = buildChainChecks().find((c) => c.id === 'chain-id')
    expect(check?.status).toBe('VERIFIED')
    expect(check?.value).toContain(String(ROBINHOOD_CHAIN_ID))
  })

  it('verifies the canonical GME stock token', () => {
    const check = buildChainChecks().find((c) => c.id === 'gme-token')
    expect(check?.status).toBe('VERIFIED')
    expect(check?.value).toBe(GME_STOCK_TOKEN_ADDRESS)
    expect(check?.href).toContain(GME_STOCK_TOKEN_ADDRESS)
  })
})

describe('project checks in the pre-launch state', () => {
  it('reports the project token as UNCONFIGURED, not VERIFIED', async () => {
    // project.config.ts reads env at module scope, so the module has to be
    // re-imported under the stub — a static import would have captured the
    // developer's real .env.local before beforeEach ran.
    vi.resetModules()
    vi.stubEnv('VITE_TOKEN_ADDRESS', '')
    const { buildProjectChecks: fresh } = await import('./config-status')
    const check = fresh().find((c) => c.id === 'project-token')
    expect(check?.status).toBe('UNCONFIGURED')
    expect(check?.value).toBeNull()
  })

  it('reports the project token as PENDING once an address is configured', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_TOKEN_ADDRESS', '0xeed10aCca2EEd5d0e0080A831439F62363Ed38d6')
    const { buildProjectChecks: fresh } = await import('./config-status')
    const check = fresh().find((c) => c.id === 'project-token')
    // PENDING, not VERIFIED: config shape alone cannot confirm a launch. Only
    // the runtime chain read in launch-status.ts can do that.
    expect(check?.status).toBe('PENDING')
    expect(check?.value).toBe('0xeed10aCca2EEd5d0e0080A831439F62363Ed38d6')
  })

  it('does NOT try to judge the Pons launch from config alone', () => {
    // The launch record (curve, pair token, threshold, phase) can only be
    // confirmed against the chain, so it lives in launch-status.ts and is
    // covered by launch-status.test.ts. Asserting its absence here keeps the
    // two modules from drifting back into overlapping responsibilities.
    const ids = buildProjectChecks().map((c) => c.id)
    expect(ids).not.toContain('pons-launch')
    expect(ids).not.toContain('gme-pair')
  })

  it('still verifies GME as an approved quote asset — that is true regardless', () => {
    const check = buildProjectChecks().find((c) => c.id === 'quote-asset')
    expect(check?.status).toBe('VERIFIED')
  })
})

describe('getSiteStatus', () => {
  it('is PRE_LAUNCH with the default configuration', () => {
    expect(getSiteStatus().mode).toBe('PRE_LAUNCH')
  })

  it('shows the preview banner whenever the mode is not LIVE', () => {
    const status = getSiteStatus()
    expect(status.showPreviewBanner).toBe(true)
  })

  it('names the unconfigured items in its summary so QA can read it', () => {
    const summary = getSiteStatus().summary
    expect(summary).toContain('Not yet configured')
    expect(summary).toMatch(/CONTRACT|LAUNCH|FEED|VENUE/)
    // Must not hard-code "pre-launch": the same summary is shown after launch
    // while other config is still missing.
    expect(summary.toLowerCase()).not.toContain('pre-launch')
  })

  it('never reports LIVE while a required value is missing', () => {
    const status = getSiteStatus()
    const unconfigured = status.checks.filter((c) => c.status === 'UNCONFIGURED')
    expect(unconfigured.length).toBeGreaterThan(0)
    expect(status.mode).not.toBe('LIVE')
  })

  it('reports branding provisionality from the flag, not from ambient env', async () => {
    // getSiteStatus reads module-level config, so the module has to be
    // re-imported under each stubbed value for this to mean anything.
    vi.resetModules()
    vi.stubEnv('VITE_BRANDING_FINAL', '')
    const provisional = await import('./config-status')
    expect(provisional.getSiteStatus().brandingProvisional).toBe(true)

    vi.resetModules()
    vi.stubEnv('VITE_BRANDING_FINAL', 'true')
    const finalised = await import('./config-status')
    expect(finalised.getSiteStatus().brandingProvisional).toBe(false)

    vi.resetModules()
    vi.unstubAllEnvs()
  })
})

describe('the whole check list', () => {
  it('gives every check a stable id, a label and a detail string', () => {
    for (const check of allChecks()) {
      expect(check.id).toBeTruthy()
      expect(check.label).toBeTruthy()
      expect(check.detail.length).toBeGreaterThan(10)
    }
  })

  it('has no duplicate ids', () => {
    const ids = allChecks().map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('never returns a VERIFIED check with a null value', () => {
    for (const check of allChecks()) {
      if (check.status === 'VERIFIED') expect(check.value).not.toBeNull()
    }
  })
})
