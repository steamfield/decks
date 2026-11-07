// `decks review-prose <alias>`: the prompt for a prose review by a model that
// did not write the deck. The regex lint catches fixed phrases; the shapes it
// cannot see (balanced antithesis, a result characterized instead of stated,
// abstract nouns standing in for facts, cards that describe the visual) need a
// reader, and this builds that reader's brief. It takes no model dependency:
// it prints the prompt and stops.
//
// The strings come from where they render. deck.mjs walks the deck through
// snap.mjs's `walk` (browser.mjs `harvestText`), so interpolations arrive
// resolved and labels kept in data/*.ts objects arrive as the audience reads
// them. Each string is mapped back to a file and line by searching the deck's
// sources, and marked unmapped when the search fails. Presenter notes come
// from each slide (its `src:` page, or slides.md for a slide written inline)
// through lint/scan.mjs `presenterNotes`, free-form notes included.
//
// The rules are deck-writing.md and prose-patterns.md: the project's
// .claude/rules/ copies (this repo's sources, or what `decks init` installed),
// falling back to the package's agent/templates/rules/.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { presenterNotes } from '../lint/scan.mjs'
import { decodeEntities } from './server.mjs'

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const RULES = ['deck-writing.md', 'prose-patterns.md']

/** Text as it compares against rendered text: entities decoded, escapes and curly quotes flattened, whitespace squashed. */
export function normalize(text) {
  return decodeEntities(text)
    .replace(/\\(.)/g, '$1')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The deck files a visible string can come from, relative to `deckDir`. */
export function deckSourceFiles(deckDir) {
  const out = []
  const walkDir = (rel, keep) => {
    const dir = join(deckDir, rel)
    if (!existsSync(dir)) return
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const path = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) {
        if (rel) walkDir(path, keep)
      } else if (keep.test(e.name) && !/\.test\.ts$/.test(e.name)) out.push(path)
    }
  }
  walkDir('', /^slides\.md$|\.vue$/)
  walkDir('pages', /\.md$/)
  walkDir('components', /\.(vue|ts)$/)
  walkDir('data', /\.(ts|js|json)$/)
  return out
}

/**
 * The slides of a slides.md in order, split the way Slidev's parser splits
 * them: at a `---` line outside a code fence or HTML comment, a `---` followed
 * by a non-blank line opening a frontmatter block up to the next `---`. Each
 * is `{ src, line, content }`: `src` the page its frontmatter imports (or
 * null for a slide written inline), `content` the text after its frontmatter,
 * and `line` the 1-based slides.md line `content` starts on.
 */
export function deckSlides(slidesMd) {
  const lines = slidesMd.split(/\r?\n/)
  const slides = []
  let start = 0
  let contentStart = 0
  let inComment = false
  const slice = (end) => {
    if (start === end) return
    const src = /^src:\s*(.+?)\s*$/m.exec(lines.slice(start, contentStart).join('\n'))?.[1]
    slides.push({
      src: src ? src.replace(/^["']|["']$/g, '').replace(/^\.\//, '') : null,
      line: contentStart + 1,
      content: lines.slice(contentStart, end).join('\n'),
    })
    start = contentStart = end + 1
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    if (inComment) {
      inComment = line.lastIndexOf('-->') < line.lastIndexOf('<!--') || !line.includes('-->')
      continue
    }
    if (line.startsWith('---')) {
      slice(i)
      if (line[3] !== '-' && lines[i + 1]?.trim()) {
        start = i
        for (i += 1; i < lines.length; i++) if (lines[i].trimEnd() === '---') break
        contentStart = i + 1
      }
    } else if (line.trimStart().startsWith('```')) {
      const fence = /^\s*`+/.exec(line)[0].trimStart()
      let j = i + 1
      while (j < lines.length && !lines[j].trimStart().startsWith(fence)) j++
      if (j < lines.length) i = j
    } else if (line.lastIndexOf('<!--') > line.lastIndexOf('-->')) inComment = true
  }
  if (start <= lines.length - 1) slice(lines.length)
  return slides
}

/** Page files in slide order from a deck's slides.md; index 0 is slide 1, null for an inline slide. */
export function slidePages(slidesMd) {
  return deckSlides(slidesMd).map((s) => s.src)
}

/**
 * The files behind one page, each with its distance from the page: the page
 * (0), the deck components it uses (1), and what those use or import from
 * components/ and data/, three steps out. A data module the stage imports
 * sits nearer than the module that one re-exports from.
 */
export function relatedFiles(deckDir, page) {
  const found = new Map([[page, 0]])
  let frontier = [page]
  for (let depth = 1; depth <= 3 && frontier.length; depth++) {
    const next = []
    for (const rel of frontier) {
      let src
      try {
        src = readFileSync(join(deckDir, rel), 'utf8')
      } catch {
        continue
      }
      const refs = [...src.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map(([, name]) => `components/${name}.vue`)
      for (const [, spec] of src.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
        const base = join(dirname(rel), spec).replaceAll('\\', '/')
        for (const ext of ['', '.ts', '.js', '.vue', '.json']) refs.push(base + ext)
      }
      for (const f of refs) {
        if (found.has(f) || !existsSync(join(deckDir, f))) continue
        found.set(f, depth)
        next.push(f)
      }
    }
    frontier = next
  }
  return found
}

/**
 * One line per source line, normalized, for `locate`. `files` maps a path to
 * its text. HTML comments are blanked (keeping their line breaks): they hold
 * presenter notes and headers, which never render, so a string that also
 * appears in the notes still maps to where it shows.
 */
export function sourceIndex(files) {
  const lines = []
  for (const [file, text] of Object.entries(files))
    text
      .replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ''))
      .split('\n')
      .forEach((raw, i) => lines.push({ file, line: i + 1, text: normalize(raw) }))
  return { lines, all: lines.map((l) => l.text).join('\n') }
}

const quotedIn = (line, frag) =>
  [`'${frag}'`, `"${frag}"`, `\`${frag}\``, `>${frag}<`].some((q) => line.includes(q))

/**
 * Where a rendered string was written: `{ file, line, exact }`, or null when
 * no source line holds enough of it.
 *
 * A string found verbatim maps exactly. Otherwise (or when the verbatim hit
 * only sits inside a longer literal, and every piece below is a whole quoted
 * literal elsewhere) it is split at each word with a digit in it, where an
 * interpolated figure usually sits; the longest run of words from each piece
 * found on a source line counts toward that line, and the line holding the
 * most of those characters wins. Ties go to a line holding the piece as a
 * whole quoted literal, as a label in a data/*.ts object does, then to the
 * file nearest the slide in `related` (`relatedFiles`: its page, stages and
 * data).
 */
export function locate(text, index, related = new Map()) {
  const target = normalize(text)
  if (!target) return null
  const near = (file) => (related.has(file) ? 10 - related.get(file) : 0)
  const rank = (cands) =>
    cands.sort((a, b) => b.score - a.score || b.quoted - a.quoted || near(b.file) - near(a.file))[0]
  let exact = null
  if (index.all.includes(target)) {
    const hits = index.lines
      .filter((l) => l.text.includes(target))
      .map((l) => ({ ...l, score: target.length, quoted: quotedIn(l.text, target) }))
    exact = rank(hits)
    if (exact.quoted || !/\d/.test(target)) return { file: exact.file, line: exact.line, exact: true }
  }
  const partial = assembled(target, index, rank)
  if (exact && !(partial?.quoted && partial.whole)) return { file: exact.file, line: exact.line, exact: true }
  if (!partial || partial.score < Math.max(4, Math.min(10, 0.3 * target.length))) return null
  return { file: partial.file, line: partial.line, exact: false }
}

/** The best line for a string assembled from code, for `locate`; `whole` when it holds every piece. */
function assembled(target, index, rank) {
  const runs = []
  let run = []
  for (const word of target.split(' ')) {
    if (/\d/.test(word)) {
      if (run.length) runs.push(run)
      run = []
    } else run.push(word)
  }
  if (run.length) runs.push(run)
  const windows = []
  for (const words of runs) {
    found: for (let len = words.length; len > 0; len--) {
      for (let s = 0; s + len <= words.length; s++) {
        const joined = words.slice(s, s + len).join(' ')
        if ((joined.match(/\p{L}/gu) ?? []).length < 3) continue
        // "Majority:" renders from `${label}: ${n}`, so retry without the
        // punctuation the template added around the literal.
        const bare = joined.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
        for (const phrase of new Set([joined, bare])) {
          if (phrase && index.all.includes(phrase)) {
            windows.push(phrase)
            break found
          }
        }
      }
    }
  }
  const byLine = new Map()
  for (const phrase of windows) {
    for (const l of index.lines) {
      if (!l.text.includes(phrase)) continue
      const key = `${l.file}:${l.line}`
      const c = byLine.get(key) ?? { ...l, score: 0, pieces: 0, quoted: true }
      c.score += phrase.length
      c.pieces++
      c.quoted &&= quotedIn(l.text, phrase)
      byLine.set(key, c)
    }
  }
  const best = rank([...byLine.values()])
  if (!best) return null
  return { ...best, whole: best.pieces === runs.length && windows.length === runs.length }
}

/**
 * A page's presenter notes cut at their markers: `ABOUT THIS SLIDE`,
 * `SAY (opening)` (click 0) and `IF ASKED` at the start of a line, and each
 * click marker wherever it sits. A plain `[click]` is the click after the
 * previous one and `[click:N]` is click N, as Slidev counts them. Returns
 * `{ click, text, line }` per section, `click` a number or the section's
 * name; notes without the markers come back whole as `notes`.
 */
export function noteSections(src) {
  const notes = presenterNotes(src)
  if (!notes) return []
  const sections = []
  let cur = null
  let click = 0
  const open = (label, line) => sections.push((cur = { click: label, parts: [], line }))
  const HEADINGS = [
    [/^\s*ABOUT THIS SLIDE\b/, 'about'],
    [/^\s*SAY \(opening\)/, 0],
    [/^\s*IF ASKED\b/, 'if asked'],
  ]
  notes.text.split('\n').forEach((raw, i) => {
    const line = notes.line + i
    let rest = raw
    for (const [re, label] of HEADINGS) {
      const m = re.exec(raw)
      if (!m) continue
      open(label, line)
      rest = raw.slice(m[0].length)
      break
    }
    // Odd pieces are the markers the split kept.
    rest.split(/(\[click(?::\d+)?\])/).forEach((piece, j) => {
      if (j % 2) {
        const n = /:(\d+)/.exec(piece)
        click = n ? Number(n[1]) : click + 1
        return open(click, line)
      }
      if (!cur) {
        if (!piece.trim()) return
        open('notes', line)
      }
      cur.parts.push(piece)
    })
  })
  return sections
    .map(({ click, parts, line }) => ({ click, line, text: parts.join(' ').replace(/\s+/g, ' ').trim() }))
    .filter((s) => s.text)
}

/** Click numbers as a short range list: `0-3`, `1, 3`. */
export function clickList(clicks) {
  const sorted = [...new Set(clicks)].sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < sorted.length; i++) {
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++
    out.push(j > i ? `${sorted[i]}-${sorted[j]}` : String(sorted[i]))
    i = j
  }
  return out.join(', ')
}

/**
 * One rule file for the prompt, without its frontmatter. The project's
 * `.claude/rules/<name>` if there is one, else the package's rendered copy
 * with its install-time placeholders filled. Returns `{ from, text }`.
 */
export function ruleText(rootDir, name, { decksDir = 'decks' } = {}) {
  const local = join(rootDir, '.claude', 'rules', name)
  const from = existsSync(local) ? local : join(PKG_DIR, 'agent', 'templates', 'rules', name)
  const pkg = 'node_modules/slidev-addon-decks'
  const vars = { decks: 'decks', pkg, decksDir, exemplars: `${pkg}/agent/exemplars` }
  const text = readFileSync(from, 'utf8')
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    // In the repo's sources: the user-project wording is the alternative to
    // the text around it, so it goes; the repo-only text is true here.
    .replace(/<!-- decks:user: [\s\S]*?-->/g, '')
    .replace(/<!-- \/?decks:repo-only -->\n?/g, '')
    .replace(/\{\{(\w+)\}\}/g, (m, key) => vars[key] ?? m)
    .trim()
  return { from: relative(rootDir, from).replaceAll('\\', '/'), text }
}

const cell = (s) => String(s).replaceAll('|', '\\|')

/**
 * The review prompt for deck `alias` (`deck` is its decks.json entry) from a
 * `walk` harvest (`frames`). Returns the prompt as Markdown text.
 */
export function reviewPrompt({ rootDir, deck, alias, frames, decksDir }) {
  const deckDir = resolve(rootDir, dirname(deck.entry))
  const rel = (f) => relative(rootDir, join(deckDir, f)).replaceAll('\\', '/')
  const fileList = deckSourceFiles(deckDir)
  const texts = Object.fromEntries(fileList.map((f) => [f, readFileSync(join(deckDir, f), 'utf8')]))
  const index = sourceIndex(texts)
  const deckSlideList = deckSlides(texts['slides.md'] ?? '')
  const pages = deckSlideList.map((s) => s.src)

  // Per slide: each distinct visible string with the clicks it shows at.
  const slides = new Map()
  for (const { slide, click, entries } of frames) {
    if (!slides.has(slide)) slides.set(slide, new Map())
    const seen = slides.get(slide)
    for (const { kind, text } of entries) {
      const key = `${kind}\u0000${text}`
      if (!seen.has(key)) seen.set(key, { kind, text, clicks: [] })
      seen.get(key).clicks.push(click)
    }
  }
  const numbers = [...new Set([...slides.keys(), ...pages.map((_, i) => i + 1)])].sort((a, b) => a - b)

  let unmapped = 0
  let strings = 0
  const sections = []
  for (const n of numbers) {
    const slide = deckSlideList[n - 1]
    const page = slide?.src
    const related = page ? relatedFiles(deckDir, page) : new Map([['slides.md', 0]])
    const rows = []
    for (const { kind, text, clicks } of slides.get(n)?.values() ?? []) {
      const at = locate(text, index, related)
      if (!at) unmapped++
      strings++
      const source = at ? `${rel(at.file)}:${at.line}${at.exact ? '' : ' (partial)'}` : 'unmapped'
      rows.push(`| ${clickList(clicks)} | ${kind} | ${cell(text)} | ${source} |`)
    }
    // Notes from the page a slide imports, or from slides.md for one written
    // inline; a page that cannot be read gets a row saying so.
    let notes = []
    let noteFile = 'slides.md'
    let noteLine = (s) => s.line
    if (page) {
      noteFile = page
      try {
        notes = noteSections(texts[page] ?? readFileSync(join(deckDir, page), 'utf8'))
      } catch (err) {
        rows.push(`| - | notes | (notes not read: ${cell(err.code ?? err.message)}) | ${rel(page)} |`)
      }
    } else if (slide) {
      notes = noteSections(slide.content)
      noteLine = (s) => slide.line + s.line - 1
    }
    for (const s of notes) {
      strings++
      rows.push(`| ${s.click} | notes | ${cell(s.text)} | ${rel(noteFile)}:${noteLine(s)} |`)
    }
    if (!rows.length) continue
    sections.push(
      [`### Slide ${n}${page ? ` (${rel(page)})` : ''}`, '', '| Click | Kind | Text | Source |', '|---|---|---|---|', ...rows].join('\n'),
    )
  }

  const rules = RULES.map((name) => ruleText(rootDir, name, { decksDir }))
  return `# Prose review: ${alias}

You are reviewing the prose of the slide deck \`${deck.entry}\`. You did not write it, and your job is to find the sentences that read as machine-written or break the deck's writing rules, then rewrite them.

How to review:

- Check every string under "Strings" against the two rule files under "Rules". Look hardest at the shapes a regex lint cannot catch: balanced antithesis ("X is easy; Y is hard"), a result characterized instead of stated ("the best result the ballot allowed"), abstract nouns standing in for facts ("relief", "the handover of power"), a card that describes the visual instead of the content, and a lede or card that restates the headline.
- \`deck-writing.md\` wins where it and \`prose-patterns.md\` disagree.
- Skip paragraph-level review. Slides have no paragraphs, and \`deck-writing.md\` says the paragraph rules do not apply to a deck ("What does not carry over").
- A rewrite that introduces a figure names the \`data-sources.md\` row or the \`data/*.ts\` constant it comes from. Keep each rewrite in the budget its kind carries: a story card's lead is at most eight words and its body twenty; a headline is one claim ending in a period.
- Presenter notes (kind \`notes\`) are spoken, not shown. Hold them to the sentence-level patterns only.

Kinds: \`head\` is a story headline, \`lead\` and \`body\` a story card, \`chip\` an InkChip, \`svg\` an SVG label, \`foreign\` text inside an SVG foreignObject, \`text\` any other visible text, \`notes\` a section of the presenter notes. Click is the beat (or notes section) the string shows at. Source is where the string was found by search; "(partial)" means the string is assembled from code (an interpolated figure or label) and the line holds the literal part, and "unmapped" means the search found no source. A notes row reading "(notes not read: ...)" means that slide's page could not be read, so its notes are missing from this list.

Reply with one Markdown table, one row per string that breaks a rule, and nothing for strings that pass:

| Slide | Click | String | Source | Pattern matched | Rewrite |
|---|---|---|---|---|---|

Quote the string exactly as listed. Name the pattern by its heading or bold label in the rule file. If nothing breaks a rule, say so in one line.

## Strings

${strings} strings, ${unmapped} visible ones unmapped.

${sections.join('\n\n')}

## Rules

${rules.map((r) => `### ${r.from}\n\n${r.text}`).join('\n\n')}
`
}
