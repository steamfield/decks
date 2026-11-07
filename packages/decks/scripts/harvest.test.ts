/**
 * harvestText against a fixed page in real Chromium: what counts as visible
 * text, which kind each string gets, and how text is grouped. A machine
 * without Playwright's browser download skips this instead of failing the
 * suite; `bunx playwright install chromium` fetches it.
 */
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-chromium'
import { describe, expect, it } from 'vitest'
import { harvestText } from './browser.mjs'

const hasChromium = existsSync(chromium.executablePath())
if (!hasChromium) console.warn(`harvest.test.ts: skipped, no Chromium at ${chromium.executablePath()}`)

const FIXTURE = `<!doctype html><html><body>
<div class="slidev-page-1">
  <h2 class="od-story-head">Rows arrive <strong>clean</strong>.</h2>
  <div class="od-story-card" data-lead="The card lead." data-body="The card body."><p>Rendered card copy.</p></div>
  <span class="od-inkchip">Chip label</span>
  <svg width="300" height="60"><text x="0" y="20">First line<tspan x="0" dy="20">second line</tspan></text></svg>
  <p>A sentence with <strong>bold</strong> inside.</p>
  <p style="opacity: 0.04">Faded below the floor.</p>
  <div style="opacity: 0.5"><p style="opacity: 0.09">Faded through its parent.</p></div>
  <p style="opacity: 0.06">Just above the floor.</p>
  <span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0)">Screen reader only.</span>
  <div class="od-story-foot"><p>Footer source line.</p></div>
  <p>42</p>
</div>
<p>Another slide's text.</p>
</body></html>`

describe.skipIf(!hasChromium)('harvestText', () => {
  it('reads each visible string as its kind, in document order', async () => {
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
      await page.setContent(FIXTURE)
      const { entries, heads } = await harvestText(page, 1)
      expect(entries).toEqual([
        { kind: 'head', text: 'Rows arrive clean.' },
        { kind: 'lead', text: 'The card lead.' },
        { kind: 'body', text: 'The card body.' },
        { kind: 'chip', text: 'Chip label' },
        // A tspan placed with x/dy is a new line, joined with a space.
        { kind: 'svg', text: 'First line second line' },
        // The inline <strong> stays inside its block's sentence.
        { kind: 'text', text: 'A sentence with bold inside.' },
        // 0.04 and 0.5 * 0.09 fall under the 5% floor; 0.06 clears it.
        { kind: 'text', text: 'Just above the floor.' },
      ])
      expect(heads).toEqual([{ text: 'Rows arrive clean.', lines: 1 }])
    } finally {
      await browser.close()
    }
  }, 30_000)
})
