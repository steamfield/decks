/**
 * A small SQL tokenizer, for highlighting the query CodeInk draws.
 *
 * Slidev ships shiki, but shiki highlights asynchronously and returns HTML,
 * and CodeInk's whole aesthetic is that the code is typeset text inside a
 * drawn frame rather than injected markup. The deck shows four lines of SQL,
 * so a synchronous tokenizer over three token kinds is the smaller thing that
 * works, and it renders identically on every load and in the PDF export.
 *
 * Every character of the input survives into exactly one token, so joining a
 * line's token text reproduces the line.
 */

export type SqlTokenKind = 'keyword' | 'literal' | 'plain'

export interface SqlToken {
  text: string
  kind: SqlTokenKind
}

/**
 * Only the keywords the decks actually use. An unknown word renders plain,
 * which is the right failure: a missed keyword reads as ordinary text rather
 * than as the wrong colour.
 */
const KEYWORDS = new Set([
  'ALL',
  'AND',
  'AS',
  'ASC',
  'AVG',
  'BY',
  'CASE',
  'COUNT',
  'CROSS',
  'DESC',
  'DISTINCT',
  'ELSE',
  'END',
  'FROM',
  'FULL',
  'GROUP',
  'HAVING',
  'IN',
  'INNER',
  'IS',
  'JOIN',
  'LEFT',
  'LIKE',
  'LIMIT',
  'MAX',
  'MIN',
  'NOT',
  'NULL',
  'OFFSET',
  'ON',
  'OR',
  'ORDER',
  'OUTER',
  'RIGHT',
  'SELECT',
  'SUM',
  'THEN',
  'UNION',
  'USING',
  'WHEN',
  'WHERE',
  'WITH',
])

/**
 * Single quoted strings and double quoted identifiers both read as literal:
 * they are the values and the dataset references, and colouring them apart
 * would put a third accent on a stage that allows one.
 */
const TOKEN = /('[^']*'|"[^"]*"|[A-Za-z_][A-Za-z0-9_]*|\s+|[^\sA-Za-z_'"]+)/g

export function tokenizeSql(line: string): SqlToken[] {
  const tokens: SqlToken[] = []
  for (const [text] of line.matchAll(TOKEN)) {
    if (text.startsWith("'") || text.startsWith('"')) {
      tokens.push({ text, kind: 'literal' })
    } else if (KEYWORDS.has(text.toUpperCase())) {
      tokens.push({ text, kind: 'keyword' })
    } else {
      tokens.push({ text, kind: 'plain' })
    }
  }
  return tokens
}
