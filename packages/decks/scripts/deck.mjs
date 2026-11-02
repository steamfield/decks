#!/usr/bin/env bun
// Parameterized deck runner. Replaces per-deck dev:/build:/export: script triplets.
//
//   decks dev <alias>        dev server with --open
//   decks build <alias>      build to outDir (decks.json _config, default dist/<name>)
//   decks build --all        build every deck
//   decks export <alias>     PDF export (flags depend on `animated` in decks.json)
//   decks new <alias> <dir>  scaffold a deck into decksDir + register it
//   decks new <alias> <dir> --story   same, on the story engine (stage, data, provenance)
//       [--author "Name"]   fill the cover byline
//       [--brand "Name"] [--url example.com]   write the deck's theme.json brand
//   decks list               show the registry
//   decks check              orphaned pages (on disk but absent from src: manifest)
//
// The deck registry is decks.json in the current directory. Its `_config`
// entry sets `decksDir` (where `new` scaffolds), `outDir` and `base` (both
// may contain `{name}`); a deck entry may override `outDir` and `base`.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = process.cwd()
const templatesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'templates')
const registryPath = join(rootDir, 'decks.json')
if (!existsSync(registryPath)) {
  console.error(`No decks.json in ${rootDir}. Run decks from the directory that holds the deck registry.`)
  process.exit(1)
}
const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
const decks = Object.fromEntries(Object.entries(registry).filter(([k]) => !k.startsWith('_')))
const config = {
  decksDir: 'decks',
  outDir: 'dist/{name}',
  base: '/',
  ...(registry._config ?? {}),
}

const [cmd, ...rest] = process.argv.slice(2)

function die(msg) {
  console.error(msg)
  process.exit(1)
}

function deckFor(alias) {
  const deck = decks[alias]
  if (!deck) die(`Unknown deck "${alias}". Known: ${Object.keys(decks).join(', ')}`)
  return deck
}

/** The Slidev CLI entry, resolved from the registry's directory rather than via `bun slidev`. */
function slidevBin() {
  const require = createRequire(join(rootDir, 'package.json'))
  let pkgPath
  try {
    pkgPath = require.resolve('@slidev/cli/package.json')
  } catch {
    die(`@slidev/cli is not installed under ${rootDir}.`)
  }
  const { bin } = JSON.parse(readFileSync(pkgPath, 'utf8'))
  return join(dirname(pkgPath), typeof bin === 'string' ? bin : bin.slidev)
}

// Slidev runs on Node, not on the runtime this script happens to run under:
// under Bun, Vite's file watcher reports no events, so the dev server never
// hot-reloads a slide or a theme.json edit.
function slidev(args) {
  const res = spawnSync('node', [slidevBin(), ...args], { cwd: rootDir, stdio: 'inherit' })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

function outDir(deck) {
  return resolve(rootDir, (deck.outDir ?? config.outDir).replaceAll('{name}', deck.name))
}

function baseFor(deck) {
  return (deck.base ?? config.base).replaceAll('{name}', deck.name)
}

async function checkManifests() {
  let bad = 0
  const registered = new Set(Object.values(decks).map((d) => d.entry))
  const skip = new Set(['node_modules', 'packages', 'dist'])
  const dirs = (base) =>
    readdirSync(join(rootDir, base), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !skip.has(e.name) && !e.name.startsWith('.'))
      .map((e) => (base ? `${base}/${e.name}` : e.name))
  for (const dir of dirs('').flatMap((d) => [d, ...dirs(d)])) {
    const entry = `${dir}/slides.md`
    if (existsSync(join(rootDir, entry)) && !registered.has(entry)) {
      console.log(`unregistered: ${entry} (deck exists on disk but has no decks.json entry)`)
      bad++
    }
  }
  for (const [alias, { entry }] of Object.entries(decks)) {
    const pagesDir = join(rootDir, dirname(entry), 'pages')
    if (!existsSync(pagesDir)) continue
    const manifest = readFileSync(join(rootDir, entry), 'utf8')
    const listed = new Set([...manifest.matchAll(/^src: \.\/pages\/(.+\.md)\s*$/gm)].map((m) => m[1]))
    for (const f of readdirSync(pagesDir).filter((f) => f.endsWith('.md'))) {
      if (!listed.has(f)) {
        console.log(`orphan: ${alias} pages/${f} (not in ${entry} manifest)`)
        bad++
      }
    }
    for (const f of listed) {
      if (!existsSync(join(pagesDir, f))) {
        console.log(`missing: ${alias} pages/${f} (in manifest but not on disk)`)
        bad++
      }
    }
  }
  return bad
}

/** Copy one template tree into the new deck, filling `{{key}}` placeholders. */
function copyTemplate(kind, vars, write) {
  const root = join(templatesDir, kind)
  const walk = (rel) => {
    for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
      const path = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(path)
      else write(path, fill(readFileSync(join(root, path), 'utf8'), vars))
    }
  }
  walk('')
}

function fill(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in vars ? vars[key] : match))
}

/** The conventional deck: one cover page in flow layout, no story engine. */
function scaffoldConventional(vars, write) {
  copyTemplate('conventional', vars, write)
}

/** The template's inline series, which the scaffold swaps for the data module. */
const INLINE_SERIES = /\/\*\* Illustrative series[\s\S]*?\nconst SERIES = \[[\s\S]*?\n\]\n/

/**
 * Rewrite one part of the copied template, and stop if the template moved on.
 *
 * The swap is string surgery on a file this script does not own, so a rename
 * in the template would otherwise scaffold a deck that never reads its data
 * module, with no error.
 */
function substitute(text, from, to, what) {
  const next = text.replace(from, to)
  if (next === text) die(`Story scaffold: ${what} no longer matches the stage template.`)
  return next
}

/**
 * The story deck: the headmatter that turns the story engine on, a cover in
 * cover chrome, and one stage with its data module and its provenance row.
 *
 * The stage is `templates/StoryMinimalStage.vue`, the same minimal stage the
 * template galleries carry (`templates.test.ts` keeps the copies identical),
 * so there is one definition of the smallest correct stage. One thing changes
 * on the way in: the template's inline series becomes an import from
 * `data/first.ts`, so the scaffolded deck reads its own data module.
 */
function scaffoldStory(vars, write) {
  copyTemplate('story', vars, write)
  let stage = readFileSync(join(templatesDir, 'StoryMinimalStage.vue'), 'utf8')
  stage = substitute(
    stage,
    INLINE_SERIES,
    `/** Slide 2: the figures this stage draws. Sourced in data-sources.md. */\nimport { FIRST_SERIES as SERIES } from '../data/first'\n`,
    'the inline series',
  )
  write('components/FirstStage.vue', stage)
}

switch (cmd) {
  case 'dev': {
    const { entry } = deckFor(rest[0] ?? die('Usage: decks dev <alias>'))
    slidev([entry, '--open'])
    break
  }
  case 'build': {
    const all = rest[0] === '--all'
    if (all && (await checkManifests()) > 0) die('Manifest drift; fix before building all decks.')
    const targets = all
      ? Object.values(decks).filter((d) => !d.skipAll)
      : [deckFor(rest[0] ?? die('Usage: decks build <alias>|--all'))]
    for (const deck of targets) {
      console.log(`\n== build ${deck.name}`)
      slidev(['build', deck.entry, '--base', baseFor(deck), '--out', outDir(deck)])
    }
    break
  }
  case 'export': {
    const deck = deckFor(rest[0] ?? die('Usage: decks export <alias>'))
    // Animated decks: no --with-toc (errors on HTML-only slides) and no
    // --per-slide (its click-walk recursion doesn't expand click states here,
    // measured 10/10 pages vs 19 with the one-piece exporter).
    const flags = deck.animated
      ? ['--dark', '--with-clicks', '--wait', '1500']
      : ['--dark', '--with-clicks', '--with-toc']
    slidev(['export', deck.entry, ...flags])
    break
  }
  case 'new': {
    const args = [...rest]
    const flag = (name, fallback) => {
      const i = args.indexOf(name)
      if (i === -1) return fallback
      const [, value] = args.splice(i, 2)
      if (!value) die(`${name} needs a value`)
      return value
    }
    const author = flag('--author', 'Your Name')
    const brandName = flag('--brand', undefined)
    const brandUrl = flag('--url', undefined)
    const story = args.includes('--story')
    const [alias, dir] = args.filter((arg) => arg !== '--story')
    if (!alias || !dir)
      die(
        'Usage: decks new <alias> <dir-name> [--story] [--author "Name"] [--brand "Name"] [--url example.com]' +
          '  (e.g. decks new growth q3-growth-story)',
      )
    if (dir.includes('/'))
      die(`Deck dirs are direct children of ${config.decksDir}/; pass a bare name, no slashes.`)
    if (decks[alias]) die(`Alias "${alias}" already registered`)
    const relDir = `${config.decksDir}/${dir}`
    const deckDir = join(rootDir, relDir)
    if (existsSync(deckDir)) die(`${relDir}/ already exists`)
    mkdirSync(join(deckDir, 'pages'), { recursive: true })
    const write = (rel, body) => {
      const path = join(deckDir, rel)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, body)
    }
    const vars = { dir, author }
    if (story) scaffoldStory(vars, write)
    else scaffoldConventional(vars, write)
    // The cover and footer read the brand from the theme; without flags the
    // deck keeps the default theme's brand until its theme.json says otherwise.
    if (brandName || brandUrl) {
      const brand = { ...(brandName && { name: brandName }), ...(brandUrl && { url: brandUrl }) }
      write('theme.json', JSON.stringify({ brand }, null, 2) + '\n')
    }
    registry[alias] = { entry: `${relDir}/slides.md`, name: dir, ...(story ? { animated: true } : {}) }
    writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n')
    console.log(`Scaffolded ${relDir}/ and registered alias "${alias}".`)
    if (story) {
      console.log(
        'Next: read .claude/rules/talks-patterns.md and slidev-addon-decks/story/README.md, then write' +
          ` the stage in ${relDir}/components/ and its figures in ${relDir}/data/.`,
      )
      console.log(
        'Restart the dev server after adding a component file: Slidev builds its' +
          ' auto-import list at startup, so a new .vue renders as an empty slot until it does.',
      )
    } else {
      console.log('Next: read .claude/rules/talks-patterns.md, add pages, set animated:true in decks.json if the deck uses OpenChart/scripted demos.')
    }
    break
  }
  case 'check': {
    if ((await checkManifests()) > 0) process.exit(1)
    console.log('All page files match their manifests.')
    break
  }
  case 'list': {
    for (const [alias, d] of Object.entries(decks))
      console.log(`${alias.padEnd(12)} ${d.entry.padEnd(45)} ${d.animated ? 'animated' : 'static'}`)
    break
  }
  default:
    die('Usage: decks {dev|build|export|new|list|check} ...')
}
