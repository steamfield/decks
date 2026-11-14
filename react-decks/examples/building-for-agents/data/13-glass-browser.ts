/**
 * Slide 13: StatGlass in a browser tab. Sourced in
 * data/sources/13-glass-browser.md. Read 2026-11-13 from ~/Projects/statglass
 * at commit 5db8622a.
 *
 * DEMO_URL: docs-site/src/lib/demo.ts, `dashboardDemoUrl` (line 44 builds
 *   "/demo/index.html?window=dashboard" and appends `&scenario=`), with the
 *   scenario "multi-host" from KNOWN_SCENARIOS (line 38), on the site's origin
 *   (docs-site/astro.config.mjs line 11). Fetched 2026-11-13: the host answers
 *   308 to /demo/ with the same query, then 200.
 * LINT_RULE: biome.json, the `noRestrictedImports` override for `src/app/**`
 *   (pattern group "@tauri-apps/**", message "Go through @core/transport so
 *   the mock transport can stand in."). AGENTS.md lines 49 to 53 state the rule.
 * The two implementations: src/core/transport/contracts.ts lines 1 to 9.
 */

export const DEMO_ORIGIN = 'https://statglass.steamfield.io'
export const DEMO_SCENARIO = 'multi-host'
export const DEMO_PATH = `/demo/index.html?window=dashboard&scenario=${DEMO_SCENARIO}`
export const DEMO_URL = `${DEMO_ORIGIN}${DEMO_PATH}`
/** What the frame's address bar shows. */
export const DEMO_ADDRESS = DEMO_URL.replace('https://', '')

/**
 * The width the embedded dashboard is laid out at, in CSS pixels, whatever the
 * projector's resolution; the frame scales it to fit. The dashboard window's
 * minimum width is 1024 (docs-site/src/lib/demo.ts line 18).
 */
export const DEMO_LAYOUT_WIDTH = 1200

export const UI = { name: 'React UI', path: 'src/app' } as const
export const INTERFACE = { name: 'Transport', path: 'src/core/transport/contracts.ts' } as const
export const LINT_RULE = ['biome noRestrictedImports:', 'no @tauri-apps/** in src/app/**'] as const

export const IMPLEMENTATIONS = [
  { id: 'tauri', name: 'Tauri', note: 'commands and Channels', path: 'src/core/transport/native.ts' },
  { id: 'mock', name: 'Mock', note: 'in-browser fake backend', path: 'src/core/mock-transport.ts' },
] as const
