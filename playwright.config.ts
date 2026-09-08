import { defineConfig, devices } from '@playwright/test'

/**
 * E2E runs against the PRODUCTION BUILD (`vite preview`), not the dev server,
 * so the suite exercises what actually ships — including the production guard
 * that blocks mock market data.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // The page is full of neon glow and CRT gradients; a tiny amount of
      // antialiasing drift between runs is expected and is not a regression.
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    /*
     * Pin the data layer for the test build.
     *
     * Without this the server inherits whatever is in .env.local — including a
     * live RPC endpoint — which makes every visual baseline depend on real
     * market data that changes with each block. The suite would be flaky by
     * construction and its screenshots would be meaningless.
     *
     * 'none' is the deterministic state: every metric renders NO SIGNAL. It is
     * also what the committed baselines were captured under. Populated states
     * are covered by the component and integration tests, which supply their
     * own fixtures rather than depending on the network.
     *
     * ('mock' is not an option here: `npm run build` is a production build, and
     * production builds deliberately force mock data back to 'none'.)
     */
    env: {
      VITE_MARKET_DATA_SOURCE: 'none',
      VITE_RPC_URL: '',
      VITE_TOKEN_ADDRESS: '',
      VITE_PROJECT_NAME: 'CARTRIDGE',
      VITE_TOKEN_SYMBOL: 'CART',
      VITE_BRANDING_FINAL: 'true',
      /*
       * Outbound links are pinned to the real production values rather than
       * left blank. They change what renders — a configured account shows a
       * button, an unconfigured one is omitted — so leaving them to be
       * inherited from .env.local made the baselines depend on the developer's
       * local setup. Pinning them to what actually ships means the visual
       * suite guards the real appearance, and a genuine link change correctly
       * shows up as a snapshot diff to review.
       */
      VITE_OFFICIAL_X_URL: 'https://x.com/cartridge_rh',
      VITE_OFFICIAL_TELEGRAM_URL: '',
      VITE_DEX_OR_LAUNCH_URL: '',
    },
  },
})
