/**
 * Slide 14: why the StatGlass CLI is Rust, in the RFC's own words. Read
 * 2026-11-13 from ~/Projects/statglass at commit 5db8622a. Checked by
 * excerpts.test.ts, so the quote on the slide cannot drift from the document.
 */
import type { Excerpt } from './types'

/** The four lines of the RFC that give the reason. Shown joined, as a quote. */
export const WHY_RUST: Excerpt = {
  repo: 'statglass',
  commit: '5db8622a',
  lang: 'text',
  path: 'plan/rfc-agent-cli.md',
  start: 106,
  end: 109,
  code: [
    'Rust was chosen over an Effect TypeScript CLI like stacks. A self-contained TS binary',
    '(`bun build --compile`) is about 55 to 60 MB per architecture against a 36 MB app, needs the',
    'JIT entitlement under hardened runtime, and would hand-mirror types Rust already owns. The',
    'helper binary this CLI sits next to is 550 KB.',
  ].join('\n'),
}
