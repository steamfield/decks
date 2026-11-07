#!/usr/bin/env node
// Renders the repo's agent setup into packages/decks/agent/, the copy that
// `decks init` installs into a user's project.
//
//   node packages/decks/scripts/render-agent.mjs           write templates/ and exemplars/
//   node packages/decks/scripts/render-agent.mjs --check   exit 1 if the shipped copy is stale
//
// Sources are the repo's own .claude/ agent, skills and rules, which stay the
// files repo development reads. Rendering them for a user's project:
//
//   1. drops every `<!-- decks:repo-only -->…<!-- /decks:repo-only -->` block;
//   2. unwraps every `<!-- decks:user: … -->` comment (the user-project wording
//      for a passage the repo-only block removed);
//   3. drops `examples/` and `packages/` globs from a rule's `paths:` frontmatter;
//   4. rewrites repo-only references (MAPPINGS below) to template variables that
//      `decks init` fills in: {{decks}} (the CLI command), {{decksDir}},
//      {{pkg}} (the installed package) and {{exemplars}};
//   5. refuses to write if a repo-only reference survives (LEFTOVER).
//
// Exemplars are copies of two example decks: tides (story) verbatim apart from
// three repo-path comments, and agent-experience (conventional) with its brand,
// cover, byline and tool-call server neutralized, and its data-sources.md marked
// illustrative (its citations point into a private repo). EXEMPLAR_FORBIDDEN
// fails the render if a brand string survives. packages/decks/agent/INVENTORY.md is the table
// of every mapping and why.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOURCES } from './agent-sources.mjs'

const here = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(here, '..', '..', '..')
export const AGENT_DIR = resolve(here, '..', 'agent')

/** Rendered from `.claude/<path>` into `agent/templates/<path>`; `decks init` writes each to `.claude/<path>`. */
export { SOURCES }

/** Ordered: the specific CLI shapes run before the generic `bun run <cmd>` rule. */
const MAPPINGS = [
  // CLI commands.
  [/bun run build:all\b/g, '{{decks}} build --all'],
  [/bun run (new|dev|build|export|list|check|lint|fact-extract|shot|snap)\b/g, '{{decks}} $1'],
  // Exemplar decks. opendata-pitch is not bundled; tides is the story exemplar.
  [/examples\/(agent-experience|tides)\b/g, '{{exemplars}}/$1'],
  [/examples\/opendata-pitch(?=\/?`|\/data-sources\.md)/g, '{{exemplars}}/tides'],
  [/`opendata-pitch`/g, '`tides`'],
  // Directories. A user project has one deck directory and no examples/.
  [/\(decks\/ or examples\/\)/g, '(decks/)'],
  [/`examples\/` (?:or|and) `decks\/`/g, '`decks/`'],
  [/packages\/decks\//g, '{{pkg}}/'],
  [/(?<![\w./-])decks\//g, '{{decksDir}}/'],
  // Wording.
  [/\bin this repo\b/g, 'in this project'],
  [/\bin the repo\b/g, 'in the project'],
  [/\brepo(\s+)root\b/g, 'project$1root'],
]

/** A repo-only reference that must not reach a user's project. */
const LEFTOVER =
  /bun run|bun tools|examples\/|packages\/decks|\.test\.ts|test-decks|tools\/|opendata-pitch|od-(?:story-)?templates|decks:repo-only|decks:user|\brepo\b/

/** Render one `.claude/` source for a user's project. Throws on a surviving repo-only reference. */
export function renderSource(text, name = 'source') {
  let out = text
    // Whole-line blocks go with their line ending, so no blank line is left behind.
    .replace(/^<!-- decks:repo-only -->\n[\s\S]*?\n<!-- \/decks:repo-only -->\n/gm, '')
    .replace(/<!-- decks:repo-only -->[\s\S]*?<!-- \/decks:repo-only -->/g, '')
    .replace(/<!-- decks:user: ([\s\S]*?) -->/g, '$1')
  out = renderFrontmatter(out)
  for (const [re, to] of MAPPINGS) out = out.replace(re, to)
  const bad = out
    .split('\n')
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => LEFTOVER.test(line))
  if (bad.length) {
    throw new Error(
      `${name}: repo-only reference survived rendering. Wrap it in <!-- decks:repo-only --> or add a mapping:\n` +
        bad.map(([n, line]) => `  ${n}: ${line}`).join('\n'),
    )
  }
  return out
}

/** Drop `examples/` and `packages/` globs from a rule's `paths:` list. */
function renderFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text)
  if (!m) return text
  const head = m[1]
    .split('\n')
    .filter((line) => !/^\s*-\s*"(?:examples|packages)\//.test(line))
    .join('\n')
  return `---\n${head}\n---\n` + text.slice(m[0].length)
}

/** What each exemplar copies from its example deck. */
const EXEMPLAR_ENTRIES = new Set(['slides.md', 'pages', 'components', 'data', 'data-sources.md', 'theme.json', 'styles'])

/**
 * Exact edits per exemplar file: [old, new]. Each `old` must occur exactly
 * once, so an edit to the example deck that moves the text fails the render
 * instead of shipping an un-neutralized copy.
 */
const EXEMPLARS = {
  tides: {
    'slides.md': [
      [
        '# Cross slide view transitions are run by packages/decks/setup/main.ts, not by',
        '# Cross slide view transitions are run by slidev-addon-decks/setup/main.ts, not by',
      ],
      [
        "# and data-od-story opts this deck into the addon's guard, the document level\n" +
          '# view-transition rules in packages/decks/styles/story-frame.css, and the story guard\n' +
          '# tests.',
        "# and data-od-story opts this deck into the addon's guard and the document level\n" +
          '# view-transition rules in slidev-addon-decks/styles/story-frame.css.',
      ],
      [
        "# One stanza per slide. `clicks` is the stage's beat count minus one, and\n" +
          "# `beats.test.ts` fails if it disagrees with the stage's COPY array.",
        "# One stanza per slide. `clicks` is the stage's beat count minus one, so it\n" +
          "# has to agree with the stage's COPY array.",
      ],
    ],
  },
  'agent-experience': {
    'theme.json': [[/^[\s\S]*$/, JSON.stringify({ brand: { name: 'Your Team', url: 'example.com', logo: null } }, null, 2) + '\n']],
    'slides.md': [
      [
        'info: "How we built OpenData agent-first, treating LLM agents as the primary user cohort and letting their friction shape the API, the MCP server, and OpenChart."',
        'info: "How we built an API agent-first, treating LLM agents as the primary user cohort and letting their friction shape the API, the MCP server, and OpenChart."',
      ],
      ['author: Riley Hilliard', 'author: Your Name'],
    ],
    'pages/01-cover.md': [
      ['<OdCoverHead url="labs.tryopendata.ai" />', '<OdCoverHead url="example.com" />'],
      ['<span>Riley Hilliard</span>', '<span>Your Name</span>'],
      ['<span>Founder, OpenData</span>', '<span>Your role</span>'],
    ],
    'pages/10-closing.md': [
      ['<OdCoverHead url="labs.tryopendata.ai" />', '<OdCoverHead url="example.com" />'],
      [
        '<OdQrCard url="https://labs.tryopendata.ai/designing-an-api-for-llms" label="the write-up" sublabel="labs.tryopendata.ai" />',
        '<OdQrCard url="https://example.com/write-up" label="the write-up" sublabel="example.com" />',
      ],
      ['<span>Riley Hilliard</span>', '<span>Your Name</span>'],
      ['<span>tryopendata.ai</span>', '<span>example.com</span>'],
    ],
    'pages/09-openchart.md': [['server="opendata"', 'server="data-api"']],
    'data-sources.md': [
      [
        '# Agent Experience deck — data provenance\n',
        '# Agent Experience deck: data provenance\n\n' +
          "> Illustrative. This deck was built in a private repository, so the file paths, line numbers,\n" +
          "> commits and articles cited below don't resolve in your project. They show the shape of a\n" +
          '> provenance entry: every figure names the artifact it came from.\n',
      ],
      [/^(##? .*?) — /gm, '$1: '],
      ["\"Data: OpenData's own MCP server, API, and OpenChart\"", '"Data: our own MCP server, API, and OpenChart"'],
      ['(server `opendata`, tool `openchart`)', '(server `data-api`, tool `openchart`)'],
      [
        '- QR code points at https://labs.tryopendata.ai/designing-an-api-for-llms, the article this',
        '- QR code points at https://example.com/write-up, standing in for the article this',
      ],
      [
        '- Slide 1 byline is now `Riley Hilliard · Founder, OpenData · August 2026`.',
        '- Slide 1 byline is now `Your Name · Your role · August 2026`.',
      ],
    ],
  },
}

/**
 * Strings that must not survive in an exemplar copy: the agent-experience deck
 * is neutralized, so a brand or byline left in it is a missed edit. (tides
 * keeps its byline on purpose and has no entry.)
 */
const EXEMPLAR_FORBIDDEN = {
  'agent-experience': [/open-?data|tryopendata/i, /Riley Hilliard/, /^#.*—/m],
}

function applyEdits(text, edits, name) {
  let out = text
  for (const [from, to] of edits) {
    if (typeof from === 'string') {
      const n = out.split(from).length - 1
      if (n !== 1) throw new Error(`${name}: expected one occurrence of ${JSON.stringify(from)}, found ${n}`)
    }
    out = out.replace(from, to)
  }
  return out
}

function listFiles(root, rel = '') {
  return readdirSync(join(root, rel), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((e) => {
      const path = rel ? `${rel}/${e.name}` : e.name
      return e.isDirectory() ? listFiles(root, path) : [path]
    })
}

/**
 * Every shipped file under packages/decks/agent/templates/ and exemplars/,
 * keyed by its path relative to packages/decks/agent/.
 */
export function renderAgent(repoRoot = REPO_ROOT) {
  const out = new Map()
  for (const src of SOURCES) {
    const text = readFileSync(join(repoRoot, '.claude', src), 'utf8')
    out.set(`templates/${src}`, renderSource(text, `.claude/${src}`))
  }
  for (const [deck, edits] of Object.entries(EXEMPLARS)) {
    const from = join(repoRoot, 'examples', deck)
    const used = new Set()
    for (const file of listFiles(from).filter((f) => EXEMPLAR_ENTRIES.has(f.split('/')[0]))) {
      let text = readFileSync(join(from, file), 'utf8')
      if (edits[file]) {
        text = applyEdits(text, edits[file], `examples/${deck}/${file}`)
        used.add(file)
      }
      for (const re of EXEMPLAR_FORBIDDEN[deck] ?? []) {
        const m = re.exec(text)
        if (m) throw new Error(`examples/${deck}/${file}: ${JSON.stringify(m[0])} survived neutralizing; add an edit in EXEMPLARS`)
      }
      out.set(`exemplars/${deck}/${file}`, text)
    }
    const missing = Object.keys(edits).filter((f) => !used.has(f))
    if (missing.length) throw new Error(`examples/${deck}: edited files not found: ${missing.join(', ')}`)
  }
  return out
}

/** Paths that differ between a fresh render and what is on disk under agentDir (missing, changed, or extra). */
export function staleFiles(rendered, agentDir = AGENT_DIR) {
  const stale = []
  for (const [path, text] of rendered) {
    const file = join(agentDir, path)
    if (!existsSync(file) || readFileSync(file, 'utf8') !== text) stale.push(path)
  }
  for (const dir of ['templates', 'exemplars']) {
    if (!existsSync(join(agentDir, dir))) continue
    for (const f of listFiles(join(agentDir, dir))) {
      if (!rendered.has(`${dir}/${f}`)) stale.push(`${dir}/${f}`)
    }
  }
  return stale
}

function main() {
  const rendered = renderAgent()
  if (process.argv.includes('--check')) {
    const stale = staleFiles(rendered)
    if (stale.length) {
      console.error(`packages/decks/agent is stale; run render-agent.mjs:\n  ${stale.join('\n  ')}`)
      process.exit(1)
    }
    console.log(`packages/decks/agent is current (${rendered.size} files).`)
    return
  }
  for (const dir of ['templates', 'exemplars']) rmSync(join(AGENT_DIR, dir), { recursive: true, force: true })
  for (const [path, text] of rendered) {
    const file = join(AGENT_DIR, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  console.log(`wrote ${rendered.size} files under ${relative(process.cwd(), AGENT_DIR) || '.'}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
