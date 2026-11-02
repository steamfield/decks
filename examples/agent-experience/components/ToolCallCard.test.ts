// Characterization tests for ToolCallCard, the one tool-call card in the repo.
// They pin the rendered structure, the optional props call sites use, the
// default slot, and the absence of motion and interactivity, so the card can
// move onto a shared component without changing the slide.
import { readFileSync } from 'node:fs'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
// @ts-expect-error .vue modules have no type shim; vitest compiles this one with the Vue plugin
import ToolCallCard from './ToolCallCard.vue'

const render = (props: Record<string, string>, slot?: () => unknown) =>
  renderToString(createSSRApp({ render: () => h(ToolCallCard, props, slot ? { default: slot } : undefined) }))

/** Drop the scoped-style attribute and Vue's SSR comment markers so the assertions read as plain markup. */
const plain = (html: string) => html.replace(/ data-v-[a-z0-9]+/g, '').replace(/<!--.*?-->/g, '')

describe('ToolCallCard', () => {
  it('renders the call exactly as slide 9 uses it', async () => {
    const html = plain(
      await render({ server: 'opendata', tool: 'openchart', args: 'ChartSpec', time: '1 call' }, () =>
        h('pre', { class: 'ax-spec' }, 'mark: bar'),
      ),
    )
    expect(html).toBe(
      '<div class="ax-call"><div class="ax-call-head">' +
        '<span class="ax-call-pip" aria-hidden="true"></span>' +
        '<span class="ax-call-name"><span class="ax-call-server">opendata ·</span> openchart</span>' +
        '<span class="ax-call-args">(ChartSpec)</span>' +
        '<span class="ax-call-spacer"></span>' +
        '<span class="ax-call-time">1 call</span></div>' +
        '<pre class="ax-spec">mark: bar</pre></div>',
    )
  })

  it('shows only the tool name when the optional props are left out', async () => {
    const html = plain(await render({ tool: 'search' }))
    expect(html).toContain('search')
    expect(html).not.toContain('ax-call-server')
    expect(html).not.toContain('ax-call-args')
    expect(html).not.toContain('ax-call-time')
    // The spacer stays so the header layout doesn't depend on the optional parts.
    expect(html).toContain('ax-call-spacer')
  })

  it('wraps each optional prop in its own element', async () => {
    const html = plain(await render({ tool: 't', server: 's', args: 'a', time: '2s' }))
    expect(html).toContain('<span class="ax-call-server">s ·</span>')
    expect(html).toContain('<span class="ax-call-args">(a)</span>')
    expect(html).toContain('<span class="ax-call-time">2s</span>')
  })

  it('renders the default slot after the header, as the call body', async () => {
    const html = plain(await render({ tool: 't' }, () => h('p', { class: 'body' }, 'result')))
    expect(html.indexOf('ax-call-head')).toBeLessThan(html.indexOf('class="body"'))
    expect(html.endsWith('<p class="body">result</p></div>')).toBe(true)
  })

  it('hides the status pip from assistive tech and adds no interactive elements', async () => {
    const html = plain(await render({ tool: 't', server: 's', args: 'a', time: '1' }))
    expect(html).toContain('<span class="ax-call-pip" aria-hidden="true">')
    expect(html).not.toMatch(/<(button|a|input)\b|tabindex|role=/)
  })

  it('has no animation or transition, so reduced motion changes nothing', () => {
    const src = readFileSync(new URL('./ToolCallCard.vue', import.meta.url), 'utf8')
    expect(src).not.toMatch(/animation|transition|@keyframes/)
  })
})
