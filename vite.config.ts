import { defineConfig, type Plugin } from 'vite'
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
  const name = env.VITE_PROJECT_NAME?.trim() || 'CARTRIDGE 4663'
  const description =
    env.VITE_PROJECT_DESCRIPTION?.trim() ||
    'A bootleg cartridge that boots a stock exchange instead of a game. Paired against the GME stock token on Robinhood Chain.'
  const siteUrl = (env.VITE_SITE_URL?.trim() || 'https://cartridge4663.example').replace(/\/$/, '')
  const title = `${name} — a cartridge that boots a stock market`

  return {
    name: 'html-seo',
    transformIndexHtml(html) {
      return html
        .replace(/%SITE_NAME%/g, name)
        .replace(/%SITE_TITLE%/g, title)
        .replace(/%SITE_DESCRIPTION%/g, description)
        .replace(/%SITE_URL%/g, siteUrl)
    },
  }
}

export default defineConfig(({ mode }) => {
  // Only VITE_* values are read here; nothing else from the shell reaches the
  // client bundle.
  const env = process.env as Record<string, string | undefined>
  void mode

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
    server: { port: 5173, strictPort: false },
    preview: { port: 4173, strictPort: false },
  }
})
