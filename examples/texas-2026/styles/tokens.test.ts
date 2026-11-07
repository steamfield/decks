/** Browser regression for deck tokens overriding shared component styles. */
import { existsSync, readFileSync } from 'node:fs'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { chromium } from 'playwright-chromium'
import { expect, it, vi } from 'vitest'
// @ts-expect-error The repo has no Vue type shim; Vitest uses the Vue plugin.
import InkNumber from '../../../packages/decks/components/InkNumber.vue'

// The story barrel imports Slidev's virtual host modules. InkNumber needs
// none of their APIs; an empty host fails if it starts using one later.
vi.mock('@slidev/client', () => ({}))

const css = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
  .replace(/^@import[^;]+;/gm, '')

// A machine without Playwright's browser download skips this instead of failing
// the suite; `bunx playwright install chromium` fetches it.
const hasChromium = existsSync(chromium.executablePath())
if (!hasChromium) console.warn(`tokens.test.ts: skipped, no Chromium at ${chromium.executablePath()}`)

it.runIf(hasChromium)('resizes an InkNumber when the deck figure-size token changes', async () => {
  const markup = await renderToString(createSSRApp({
    render: () => h(InkNumber, { value: '120', count: false }),
  }))
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(`<style>${css('./tokens.css')}\n${css('./index.css')}</style>
      <div class="od-slide is-story" style="--sw:19.2px;--sh:10.8px">${markup}</div>`)
    const figure = page.locator('.od-bignum-figure')
    await page.locator('.od-slide').evaluate(el => {
      (el as HTMLElement).style.setProperty('--tx-figure-size', '120px')
    })
    expect(await figure.evaluate(el => getComputedStyle(el).fontSize)).toBe('120px')
    const before = await figure.boundingBox()
    await page.locator('.od-slide').evaluate(el => {
      (el as HTMLElement).style.setProperty('--tx-figure-size', '240px')
    })
    expect(await figure.evaluate(el => getComputedStyle(el).fontSize)).toBe('240px')
    const after = await figure.boundingBox()
    expect(after!.height).toBeGreaterThan(before!.height)
  } finally {
    await browser.close()
  }
})
