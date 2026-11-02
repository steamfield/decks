import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import defaults from './theme/default.json'
import { resolveTheme, themeCss } from './theme/resolve'

const THEME_ID = '#decks/theme'
const TOKENS_ID = 'virtual:decks/tokens.css'
const RESOLVED_THEME = '\0decks:theme'
const RESOLVED_TOKENS = '\0decks:tokens.css'

/**
 * Serves the deck's theme: `#decks/theme` is the resolved theme object and
 * `virtual:decks/tokens.css` its CSS custom properties, both from the deck's
 * `theme.json` merged over `theme/default.json`. The deck root is only known
 * once Slidev has resolved the config (it loads addon configs first), which is
 * why this is a plugin rather than a static alias.
 */
function decksTheme(): Plugin {
  let themePath = ''
  const load = () => {
    const override = existsSync(themePath)
      ? JSON.parse(readFileSync(themePath, 'utf8'))
      : undefined
    return resolveTheme(defaults, override)
  }
  return {
    name: 'decks-theme',
    enforce: 'pre',
    configResolved(config) {
      themePath = join(config.root, 'theme.json')
    },
    resolveId(id) {
      if (id === THEME_ID) return RESOLVED_THEME
      if (id === TOKENS_ID) return RESOLVED_TOKENS
    },
    load(id) {
      if (id === RESOLVED_THEME) return `export default ${JSON.stringify(load())}`
      if (id === RESOLVED_TOKENS) return themeCss(load())
    },
    configureServer(server: ViteDevServer) {
      server.watcher.add(themePath)
      const reload = (file: string) => {
        if (file !== themePath) return
        for (const id of [RESOLVED_THEME, RESOLVED_TOKENS]) {
          const mod = server.moduleGraph.getModuleById(id)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('change', reload)
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

// Merged into every deck's Vite config by Slidev (addon root). Pre-bundling the
// 3D graph entry and gsap keeps the dev server from discovering three.js on the
// first 3D mount mid-talk and forcing a full reload.
export default defineConfig({
  plugins: [decksTheme()],
  // Linked OpenChart must share Slidev's Vue instance for lifecycle hooks.
  resolve: { dedupe: ['vue'] },
  optimizeDeps: {
    include: ['@opendata-ai/openchart-vue/graph-3d', 'gsap'],
    // Decks import the addon by package name while its own files import each
    // other relatively; pre-bundling it would give the two paths separate
    // module instances, and view-transition.ts holds module state.
    exclude: ['slidev-addon-decks'],
  },
})
