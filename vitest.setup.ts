import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

/*
 * Pin the RPC endpoint for every test.
 *
 * Vitest loads .env.local like any other Vite process, so without this a test
 * inherits whatever the developer has configured. That has bitten this project
 * twice: once when VITE_RPC_URL became the relative "/api/rpc" (which jsdom
 * cannot resolve), and once when live chain data made visual baselines depend
 * on the current block.
 *
 * An absolute, obviously-fake URL keeps adapter tests deterministic and makes
 * an unmocked network call fail loudly instead of silently hitting a real
 * provider. Individual tests may still override it with vi.stubEnv.
 */
beforeEach(() => {
  vi.stubEnv('VITE_RPC_URL', 'https://rpc.test.invalid/jsonrpc')
  /*
   * Default every test to the UNLAUNCHED state.
   *
   * Once a real token address landed in .env.local, three tests asserting the
   * pre-launch defaults started failing — the same leak as the RPC URL above.
   * Tests that want a launched token stub this explicitly (see
   * src/config/launch-status.test.ts), which is clearer than depending on
   * whatever the developer happens to have configured.
   */
  vi.stubEnv('VITE_TOKEN_ADDRESS', '')
  vi.stubEnv('VITE_PONS_POOL_OR_LAUNCH_ID', '')
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllEnvs()
})

// jsdom implements neither of these; several components depend on them.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: readonly number[] = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

if (!window.ResizeObserver) {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
}
