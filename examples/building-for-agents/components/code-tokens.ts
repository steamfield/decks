/**
 * A small synchronous tokenizer for the code on the slides. It runs in the
 * browser and in export alike, with no highlighter to load. It knows comments,
 * strings, numbers, keywords and capitalised type names, which is what a code
 * pane read from the back of a room needs.
 */
export type TokenKind = 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'punct'
export interface Token {
  text: string
  kind: TokenKind
}
export type Lang = 'ts' | 'rust' | 'json' | 'sh' | 'yaml' | 'text'

const KEYWORDS: Record<Lang, ReadonlySet<string>> = {
  ts: new Set(
    'import export from const let var function return if else for of in while new class extends implements interface type as satisfies yield await async static readonly override true false null undefined void this throw try catch finally typeof keyof'.split(
      ' ',
    ),
  ),
  rust: new Set(
    'pub fn let mut use mod struct enum impl trait for in if else match return async await move where as crate self Self super const static ref dyn true false loop while unsafe type'.split(
      ' ',
    ),
  ),
  json: new Set(['true', 'false', 'null']),
  sh: new Set(['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'export', 'cd', 'echo']),
  yaml: new Set(['true', 'false', 'null']),
  text: new Set(),
}

const LINE_COMMENT: Record<Lang, RegExp | null> = {
  ts: /^\/\/.*/,
  rust: /^\/\/.*/,
  json: null,
  sh: /^#.*/,
  yaml: /^#.*/,
  text: null,
}

const STRING = /^(?:"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?)/
const NUMBER = /^\d[\d_.]*(?:[a-z]+\d*)?/
const WORD = /^[A-Za-z_$][\w$]*/
const SPACE = /^\s+/

/** One line of code as colored tokens. */
export function tokenizeLine(line: string, lang: Lang): Token[] {
  if (lang === 'text') return [{ text: line, kind: 'plain' }]
  const out: Token[] = []
  const push = (text: string, kind: TokenKind) => {
    const last = out[out.length - 1]
    if (last && last.kind === kind) last.text += text
    else out.push({ text, kind })
  }
  let rest = line
  while (rest.length > 0) {
    const comment = LINE_COMMENT[lang]?.exec(rest)
    // A shell or yaml "#" only starts a comment at the line start or after a space.
    const commentOk = comment && (lang === 'ts' || lang === 'rust' || rest.length === line.length || /\s$/.test(line.slice(0, line.length - rest.length)))
    if (comment && commentOk) {
      push(comment[0], 'comment')
      break
    }
    const m = SPACE.exec(rest) ?? null
    if (m) {
      push(m[0], 'plain')
      rest = rest.slice(m[0].length)
      continue
    }
    const str = STRING.exec(rest)
    if (str && str[0].length > 0) {
      push(str[0], 'string')
      rest = rest.slice(str[0].length)
      continue
    }
    const num = NUMBER.exec(rest)
    if (num) {
      push(num[0], 'number')
      rest = rest.slice(num[0].length)
      continue
    }
    const word = WORD.exec(rest)
    if (word) {
      const w = word[0]
      push(w, KEYWORDS[lang].has(w) ? 'keyword' : /^[A-Z]/.test(w) && lang !== 'sh' ? 'type' : 'plain')
      rest = rest.slice(w.length)
      continue
    }
    push(rest[0], 'punct')
    rest = rest.slice(1)
  }
  return out
}
