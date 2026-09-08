import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

/**
 * Fills SEO placeholders in index.html from the same env vars the app reads,
 * so the <title>, canonical URL and social card cannot drift away from
 * src/config/project.config.ts.
 *
 * Vite's built-in %VITE_X% substitution only covers variables that are
 * actually defined; this supplies the documented defaults too.
 */
function htmlSeo(env: Record<string, string | undefined>): Plugin {
  const name = env.VITE_PROJECT_NAME?.trim() || 'CARTRIDGE'
  const description =
    env.VITE_PROJECT_DESCRIPTION?.trim() ||
    'A bootleg cartridge that boots a stock exchange instead of a game. Paired against the GME stock token on Robinhood Chain.'
  const siteUrl = (env.VITE_SITE_URL?.trim() || 'https://www.cartridgehood.xyz').replace(/\/$/, '')
  const title = `${name} — a cartridge that boots a stock market`
  // Describes public/social-card.png, which is generated from the same name.
  const ogAlt =
    `${name} in pixel lettering beside an orange game cartridge, over a neon grid. ` +
    'A green bar reads PAIRED WITH THE GME STOCK TOKEN, and a line below reads ' +
    'NOT GAMESTOP STOCK. NOT AFFILIATED.'

  return {
    name: 'html-seo',
    transformIndexHtml(html) {
      return html
        .replace(/%SITE_NAME%/g, name)
        .replace(/%SITE_TITLE%/g, title)
        .replace(/%SITE_DESCRIPTION%/g, description)
        .replace(/%SITE_URL%/g, siteUrl)
        .replace(/%SITE_OG_ALT%/g, ogAlt)
    },
  }
}

/**
 * Development-only proxy for /api/rpc.
 *
 * Takes RPC_URL, which has no VITE_ prefix and so is never inlined into a
 * bundle. Returns undefined when unset, in which case the app falls back to the
 * public endpoint exactly as it does in production.
 */
function devRpcProxy(upstream: string | undefined): Record<string, ProxyOptions> | undefined {
  if (!upstream) return undefined
  const target = new URL(upstream)
  return {
    '/api/rpc': {
      target: target.origin,
      changeOrigin: true,
      rewrite: () => target.pathname + target.search,
    },
  }
}

export default defineConfig(({ mode }) => {
  // Only VITE_* values are read here; nothing else from the shell reaches the
  // client bundle.
  const env = process.env as Record<string, string | undefined>

  /*
   * Loaded with an empty prefix so it picks up RPC_URL from .env.local, which
   * Vite would otherwise ignore for having no VITE_ prefix. This value is used
   * ONLY to configure the dev proxy below — it is never passed to `define`,
   * never reaches a plugin that touches the bundle, and so cannot leak into
   * client code.
   */
  const serverOnlyEnv = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), htmlSeo(env)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/viem') || id.includes('node_modules/abitype')) return 'web3'
            if (id.includes('node_modules/@tanstack')) return 'query'
            if (id.includes('node_modules/react')) return 'react'
            return undefined
          },
        },
      },
    },
    server: {
    port: 5173,
    strictPort: false,
    /*
     * `vercel dev` serves api/rpc.ts for us, but plain `npm run dev` does not.
     * Forward /api/rpc straight to the upstream provider in development so the
     * app behaves identically either way. RPC_URL is a server-only variable and
     * never reaches the browser bundle.
     */
    proxy: devRpcProxy(serverOnlyEnv.RPC_URL),
  },
    preview: { port: 4173, strictPort: false },
  }
})
