import { describe, expect, it } from 'vitest'
import { DEFS_ID, FILTER_IDS, ensureStoryDefs, filterUrl, storyDefsMarkup } from './filters'

describe('filters', () => {
  it('names the six marker filters and the glow', () => {
    expect(Object.values(FILTER_IDS)).toEqual([
      'mk-marker',
      'mk-marker-lite',
      'mk-dry',
      'mk-dry-lite',
      'mk-rule',
      'mk-rule-lite',
      'mk-glow',
    ])
  })

  it('builds a url reference', () => {
    expect(filterUrl(FILTER_IDS.marker)).toBe('url(#mk-marker)')
  })

  it('defines every filter exactly once', () => {
    const markup = storyDefsMarkup()
    for (const id of Object.values(FILTER_IDS)) {
      expect(markup.split(`id="${id}"`).length - 1).toBe(1)
    }
  })

  it('carries the dryness dial and fixed seeds', () => {
    const markup = storyDefsMarkup()
    expect(markup).toContain('k3="-0.12"')
    expect(markup).toContain('k3="-0.3"')
    expect(markup).toContain('k3="-0.55"')
    expect(markup).toContain('type="luminanceToAlpha"')
    expect(markup).not.toContain('seed=""')
  })

  it('warps only the non lite variants', () => {
    const parts = storyDefsMarkup().split('<filter ')
    const byId = new Map<string, string>()
    for (const part of parts.slice(1)) {
      const id = /id="([^"]+)"/.exec(part)?.[1]
      if (id) byId.set(id, part)
    }
    expect(byId.get(FILTER_IDS.marker)).toContain('scale="2.6"')
    expect(byId.get(FILTER_IDS.dry)).toContain('scale="1.8"')
    expect(byId.get(FILTER_IDS.rule)).toContain('scale="0.6"')
    expect(byId.get(FILTER_IDS.markerLite)).not.toContain('feDisplacementMap')
    expect(byId.get(FILTER_IDS.dryLite)).not.toContain('feDisplacementMap')
    expect(byId.get(FILTER_IDS.ruleLite)).not.toContain('feDisplacementMap')
  })

  it('is a no op without a document', () => {
    expect(typeof document).toBe('undefined')
    expect(() => ensureStoryDefs()).not.toThrow()
    expect(DEFS_ID).toBe('od-story-defs')
  })
})
