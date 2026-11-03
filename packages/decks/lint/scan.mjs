// The AI-rhetoric prose scanner behind `decks lint`, `decks check` and the
// `decks hook lint` write hook. One implementation: tools/content-lint.sh and
// story/beats.test.ts both call into this module.
//
// Two surfaces are scanned:
//   - prose: a deck's slides.md, pages/*.md and components/*.vue outside
//     <script>/<style>, frontmatter (except description:), fences and comments;
//   - card copy: the lead/body strings of a story stage's `const COPY = [...]`,
//     which sits inside <script setup> where the prose extractor never looks.
//
// Patterns are ai-rhetoric-patterns.tsv next to this file: id, severity
// (error|warn), a POSIX ERE, a message. A line carrying `lint-allow` is exempt
// from every pattern; `lint-allow: id, id` exempts those ids only.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const PATTERNS_FILE = fileURLToPath(new URL('./ai-rhetoric-patterns.tsv', import.meta.url))

/**
 * The pattern rows as JS regexes. The file is POSIX ERE (it was written for
 * grep); the only construct in it that JS reads differently is the bracket
 * class `[[:space:]]`. Throws when the file is missing, a row will not
 * compile, a row's severity is not error or warn, or no error row loads (an
 * empty or truncated file), so a caller that must fail closed can.
 */
export function loadPatterns(file = PATTERNS_FILE) {
  // CRLF, blank and whitespace-only lines are tolerated, so a Windows checkout
  // or a trailing blank line does not read as a broken row.
  const patterns = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => line.replace(/\r$/, '').split('\t'))
    .filter(([id]) => id)
    .map(([id, severity, ere, message]) => {
      if (severity !== 'error' && severity !== 'warn')
        throw new Error(`${file}: pattern "${id}" has severity "${severity}", not error or warn`)
      if (!ere) throw new Error(`${file}: pattern "${id}" has no regex`)
      return {
        id,
        severity,
        message,
        re: new RegExp(ere.replaceAll('[[:space:]]', '\\s')),
        context: new RegExp(`.{0,30}(?:${ere.replaceAll('[[:space:]]', '\\s')}).{0,30}`),
      }
    })
  if (!patterns.some((p) => p.severity === 'error'))
    throw new Error(`${file} has no error-severity patterns (empty or truncated?)`)
  return patterns
}

/** The ids a line exempts: '*' for all, a list, or none. */
function allowOf(line) {
  if (!line.includes('lint-allow')) return []
  if (/lint-allow\s*([}*]|-->|$)/.test(line)) return '*'
  const m = /lint-allow:\s*/.exec(line)
  if (!m) return []
  const ids = line
    .slice(m.index + m[0].length)
    .replace(/\s*\*\/.*/, '')
    .replace(/\s*-->.*/, '')
    .replace(/\s*}.*/, '')
    .replace(/\s/g, '')
  return ids ? ids.split(',') : []
}

/**
 * The prose lines of a page or component, as `{ line, allow, text }`.
 *
 * A line-by-line port of the awk extractor content-lint.sh carried: it skips
 * frontmatter (except description:, which is user-facing card copy), fences,
 * <script>/<style>, HTML and JSX comments, imports, link lists, <Disclosure>
 * blocks and lines opening with `{`. A one-line comment is cut out of its line
 * and the rest is scanned. A line that opens with a tag keeps the text between
 * tags, since slide text sits inline in markup.
 *
 * `fragment: true` is for a piece cut from the middle of a file (an Edit's
 * new_string): its first line is not a frontmatter fence, since a `---` there
 * is as likely a Slidev slide separator.
 */
export function proseLines(src, { fragment = false } = {}) {
  const out = []
  let fm = false
  let fc = false
  let sc = false
  let cm = false
  let dl = false
  let dfm = false
  const lines = src.split('\n')
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  lines.forEach((raw, i) => {
    let text = raw
    const nr = i + 1
    const emit = (t, allow = allowOf(t)) => out.push({ line: nr, allow, text: t })
    if (nr === 1 && !fragment && /^---\s*$/.test(text)) return void (fm = true)
    if (fm && /^---\s*$/.test(text)) return void (fm = false)
    if (fm && /^description:\s*[>|]/.test(text)) return void (dfm = true)
    if (fm && dfm && /^\s/.test(text)) return emit(text)
    if (fm && dfm) dfm = false
    if (fm && /^description:/.test(text)) return emit(text)
    if (fm) return
    if (/^\s*(```|~~~)/.test(text)) return void (fc = !fc)
    if (fc) return
    if (/^\s*<script/.test(text)) return void (sc = true)
    if (/^\s*<\/script>/.test(text)) return void (sc = false)
    if (/^\s*<style/.test(text)) return void (sc = true)
    if (/^\s*<\/style>/.test(text)) return void (sc = false)
    if (sc) return
    if (cm) {
      // The comment ends on this line: what follows its terminator is scanned.
      const close = /\*\/\}|-->/.exec(text)
      if (!close) return
      cm = false
      text = text.slice(close.index + close[0].length)
    }
    // Allow ids are read before the comment carrying them is cut out.
    const allow = allowOf(raw)
    text = text.replace(/<!--.*?-->/g, '').replace(/\{\/\*.*?\*\/\}/g, '')
    if (!/\S/.test(text)) return
    if (/^\s*\{\/\*/.test(text)) return void (cm = true)
    if (/^\s*<!--/.test(text)) return void (cm = true)
    if (/^\s*(import |export )/.test(text)) return
    if (/^\s*-\s+\[/.test(text)) return
    if (/<Disclosure/.test(text)) return void (dl = true)
    if (/<\/Disclosure/.test(text)) return void (dl = false)
    if (dl) return
    if (/^\s*<[A-Za-z/]/.test(text)) {
      text = text
        .replace(/<[^>]*>/g, '')
        .replace(/<[^>]*$/, '')
        .replace(/\{\{[^}]*\}\}/g, '')
      if (!/\S/.test(text)) return
      return emit(text, allow)
    }
    if (/description=/.test(text)) return
    if (/<\/a>/.test(text)) text = text.replace(/<a( [^>]*)?>/g, '').replace(/<\/a>/g, '')
    if (/^\s*\{/.test(text)) return
    emit(text, allow)
  })
  return out
}

/** The `[ ... ]` after `const COPY =`, by bracket depth, with its offset; or null. */
export function copyLiteral(src) {
  const start = src.search(/^const COPY(?::[^=]+)? = \[/m)
  if (start < 0) return null
  const open = src.indexOf('[', start)
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++
    else if (src[i] === ']' && --depth === 0) return { text: src.slice(open, i + 1), offset: open }
  }
  return null
}

export const FIELD = /\b(lead|body):\s*('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")/g

/**
 * Every lead/body string in `src` between `from` and `to`, as `{ line, allow,
 * text, raw }`: `line` is 1-based in `src`, `allow` comes from the line the
 * string sits on, `raw` keeps the quotes.
 */
export function fieldStrings(src, from = 0, to = src.length) {
  return [...src.slice(from, to).matchAll(FIELD)].map((m) => {
    const at = from + m.index
    const lineStart = src.lastIndexOf('\n', at) + 1
    const lineEnd = src.indexOf('\n', at)
    const line = src.slice(lineStart, lineEnd < 0 ? undefined : lineEnd)
    return {
      line: src.slice(0, at).split('\n').length,
      allow: allowOf(line),
      text: m[2].slice(1, -1),
      raw: m[2],
    }
  })
}

/** The strings of a stage's COPY array (see fieldStrings); empty without one. */
export function copyStrings(src) {
  const literal = copyLiteral(src)
  return literal ? fieldStrings(src, literal.offset, literal.offset + literal.text.length) : []
}

/**
 * Pattern hits over a list of `{ line, allow, text }` entries, in pattern
 * order then line order (the order content-lint.sh printed).
 */
export function scanEntries(entries, patterns, { errorsOnly = false } = {}) {
  const hits = []
  for (const p of patterns) {
    if (errorsOnly && p.severity === 'warn') continue
    for (const e of entries) {
      if (e.allow === '*' || e.allow.includes(p.id)) continue
      if (!p.re.test(e.text)) continue
      hits.push({
        id: p.id,
        severity: p.severity,
        message: p.message,
        line: e.line,
        match: p.context.exec(e.text)?.[0] ?? e.text,
        text: e.text,
      })
    }
  }
  return hits
}

/**
 * Every hit in one file's source: its prose, plus its COPY strings when it is
 * a .vue component. `name` decides which surfaces apply.
 */
export function scanSource(name, src, patterns, opts) {
  const hits = scanEntries(proseLines(src), patterns, opts)
  if (name.endsWith('.vue')) hits.push(...scanEntries(copyStrings(src), patterns, opts))
  return hits
}

/** One hit as content-lint.sh printed it. */
export function formatHit(file, hit) {
  return `${file}:${hit.line} [${hit.id}] "${hit.match}" -> ${hit.message}`
}
