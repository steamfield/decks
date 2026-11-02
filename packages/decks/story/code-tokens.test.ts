import { describe, expect, it } from 'vitest'
import { tokenizeSql } from './code-tokens'

describe('tokenizeSql', () => {
  it('round trips every character', () => {
    const line = `SELECT year, school FROM "isbe/report-card:all" WHERE city = 'AURORA'`
    expect(
      tokenizeSql(line)
        .map((t) => t.text)
        .join(''),
    ).toBe(line)
  })

  it('marks keywords, literals and the rest apart', () => {
    const tokens = tokenizeSql(`SELECT year FROM "d" WHERE city = 'AURORA'`)
    const of = (kind: string) =>
      tokens.filter((t) => t.kind === kind && t.text.trim()).map((t) => t.text)
    expect(of('keyword')).toEqual(['SELECT', 'FROM', 'WHERE'])
    expect(of('literal')).toEqual(['"d"', "'AURORA'"])
    expect(of('plain')).toEqual(['year', 'city', '='])
  })

  it('does not colour a keyword that is part of an identifier', () => {
    const tokens = tokenizeSql('SELECT order_total FROM t')
    expect(tokens.find((t) => t.text === 'order_total')?.kind).toBe('plain')
  })

  it('leaves a keyword inside a string alone', () => {
    const tokens = tokenizeSql(`WHERE city = 'FROM'`)
    expect(tokens.find((t) => t.text === "'FROM'")?.kind).toBe('literal')
  })

  it('is case insensitive on keywords', () => {
    expect(tokenizeSql('select 1')[0].kind).toBe('keyword')
  })
})
