// Characterization tests for ToolCallCard, the one tool-call card in the repo.
// They pin the rendered text and structure, the optional props call sites use,
// the default slot, and the absence of motion and interactivity.
//
// The card is a wrapper over the library's StaticTranscript, so the markup is
// asserted through the library's data-part hooks instead of the old ax-call-*
// classes; the text, order and slot behavior are what the slide depends on.
import { readFileSync } from 'node:fs'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
// @ts-expect-error .vue modules have no type shim; vitest compiles this one with the Vue plugin
import ToolCallCard from './ToolCallCard.vue'

const render = (props: Record<string, string>, slot?: () => unknown) =>
  renderToString(createSSRApp({ render: () => h(ToolCallCard, props, slot ? { default: slot } : undefined) }))

/** Drop Vue's SSR comment markers so the assertions read as plain markup. */
const plain = (html: string) => html.replace(/<!--.*?-->/g, '')

const part = (html: string, name: string) =>
  [...html.matchAll(new RegExp(`<span data-part="${name}"[^>]*>(.*?)</span>`, 'g'))].map((m) => m[1])

describe('ToolCallCard', () => {
  it('renders the call as slide 9 uses it: header text in order, then the body', async () => {
    const html = plain(
      await render({ server: 'opendata', tool: 'openchart', args: 'ChartSpec', time: '1 call' }, () =>
        h('pre', { class: 'ax-spec' }, 'mark: bar'),
      ),
    )
    expect(part(html, 'tool-label')).toEqual(['opendata openchart'])
    expect(part(html, 'tool-args')).toEqual(['(ChartSpec)'])
    expect(part(html, 'tool-meta')).toEqual(['1 call'])
    expect(html.indexOf('tool-header')).toBeLessThan(html.indexOf('tool-body'))
    expect(html).toContain('<pre class="ax-spec">mark: bar</pre>')
    expect(html).toContain('class="ax-call"')
  })

  it('shows only the tool name when the optional props are left out', async () => {
    const html = plain(await render({ tool: 'search' }))
    expect(part(html, 'tool-label')).toEqual(['search'])
    expect(html).not.toContain('data-part="tool-args"')
    expect(html).not.toContain('data-part="tool-meta"')
  })

  it('wraps each optional prop in its own element', async () => {
    const html = plain(await render({ tool: 't', server: 's', args: 'a', time: '2s' }))
    expect(part(html, 'tool-label')).toEqual(['s t'])
    expect(part(html, 'tool-args')).toEqual(['(a)'])
    expect(part(html, 'tool-meta')).toEqual(['2s'])
  })

  it('renders the default slot inside the call body, after the header', async () => {
    const html = plain(await render({ tool: 't' }, () => h('p', { class: 'body' }, 'result')))
    expect(html.indexOf('data-part="tool-header"')).toBeLessThan(html.indexOf('class="body"'))
    expect(html).toContain('<div data-part="tool-content"><p class="body">result</p></div>')
  })

  it('renders as a finished call and adds no controls', async () => {
    const html = plain(await render({ tool: 't', server: 's', args: 'a', time: '1' }))
    expect(html).toContain('data-status="done"')
    expect(html).toContain('data-static')
    expect(html).not.toMatch(/<(button|a|input)\b/)
  })

  it('has no animation or transition, so reduced motion changes nothing', () => {
    const src = readFileSync(new URL('./ToolCallCard.vue', import.meta.url), 'utf8')
    expect(src).not.toMatch(/animation|transition|@keyframes/)
  })
})
