// Payload-shape tests for the two deck hooks: `decks hook lint` (PreToolUse on
// Edit/Write/MultiEdit) and `decks hook prompt` (UserPromptSubmit), both in
// packages/decks/scripts/hook.mjs.
//
// Every case feeds the hook the real payload shape (`.tool_input.file_path`,
// `.tool_input.content`, `.prompt`), so a hook that reads the wrong field fails
// here instead of silently no-oping in a session. Node only, no jq.
//
// Run:  bun run test:hooks   (or node .claude/hooks/tests/run-hook-tests.mjs)
// Exit: 0 = all pass, 1 = a failure.

import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const DECK = join(ROOT, 'packages/decks/scripts/deck.mjs')
let pass = 0
let fail = 0
const ok = (name) => (pass++, console.log(`  ok   - ${name}`))
const bad = (name, why) => (fail++, console.log(`  FAIL - ${name}\n     ${why}`))
const check = (cond, name, why) => (cond ? ok(name) : bad(name, why()))
const scratch = (prefix) => mkdtempSync(join(tmpdir(), prefix))

/** Run a hook with `payload` on stdin. Returns `{ rc, out, err, json }`. */
function runHook(kind, payload, { deck = DECK, project = ROOT, raw } = {}) {
  const res = spawnSync('node', [deck, 'hook', kind], {
    cwd: project,
    input: raw ?? JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: project },
  })
  let json = null
  try {
    json = JSON.parse(res.stdout)
  } catch {}
  return { rc: res.status, out: res.stdout, err: res.stderr, json }
}

const write = (file_path, content) => ({
  tool_name: 'Write',
  hook_event_name: 'PreToolUse',
  tool_input: { file_path, content },
})
const edit = (file_path, new_string, old_string = 'old text') => ({
  tool_name: 'Edit',
  hook_event_name: 'PreToolUse',
  tool_input: { file_path, old_string, new_string },
})
const multiedit = (file_path, new_string) => ({
  tool_name: 'MultiEdit',
  hook_event_name: 'PreToolUse',
  tool_input: { file_path, edits: [{ old_string: 'old', new_string }] },
})

function assertDeny(payload, name, opts) {
  const r = runHook('lint', payload, opts)
  const d = r.json?.hookSpecificOutput?.permissionDecision
  check(
    d === 'deny',
    name,
    () =>
      `expected deny, got decision='${d}' rc=${r.rc} out=${r.out.slice(0, 120)} err=${r.err.slice(0, 200)}`,
  )
  return r
}

function assertNotDeny(payload, name, opts) {
  const r = runHook('lint', payload, opts)
  const d = r.json?.hookSpecificOutput?.permissionDecision ?? 'none'
  check(
    d !== 'deny' && r.rc === 0,
    name,
    () =>
      `expected pass, got decision='${d}' rc=${r.rc} out=${r.out.slice(0, 120)} err=${r.err.slice(0, 200)}`,
  )
}

// A user project with one deck, decks/my-talk.
const USER = scratch('decks-hook-user-')
mkdirSync(join(USER, 'decks/my-talk'), { recursive: true })
writeFileSync(join(USER, 'decks/my-talk/slides.md'), '---\nsrc: ./pages/01.md\n---\n')
const inUser = { project: USER }
process.on('exit', () => rmSync(USER, { recursive: true, force: true }))

console.log('== decks hook lint ==')

assertDeny(
  write('examples/agent-experience/pages/03-interview.md', 'This has an em — dash.'),
  'denies em-dash in an example page (Write)',
)
assertDeny(
  edit('decks/my-talk/pages/02-point.md', "Here's the thing about tides."),
  'denies banned phrase in a decks/ page (Edit)',
  inUser,
)
assertDeny(
  multiedit('decks/my-talk/slides.md', 'A seamless data experience.'),
  'denies AI vocab in slides.md (MultiEdit)',
  inUser,
)
assertDeny(
  write(
    'decks/my-talk/components/TideStage.vue',
    '<template>\n  <p class="od-lede">\n    It\'s not just about water.\n  </p>\n</template>',
  ),
  "denies not-just-reveal in a deck component's template text",
  inUser,
)
assertDeny(
  write(join(USER, 'decks/my-talk/pages/01-cover.md'), 'An em — dash.'),
  'denies with an absolute path',
  inUser,
)
assertDeny(
  edit(
    'decks/my-talk/pages/01-cover.md',
    '  <template #lede>Tides are a seamless dance.</template>',
  ),
  'denies prose inline in a one-line tag (StoryCover slot)',
  inUser,
)
assertDeny(
  edit('decks/my-talk/pages/03.md', '<h2 class="od-h2">At its core, the cache wins.</h2>'),
  'denies prose inline in a heading tag',
  inUser,
)
assertNotDeny(
  edit('decks/my-talk/pages/03.md', '<div class="od-twocol" style="gap: 2rem;">'),
  'allows a tag-only line',
  inUser,
)
assertNotDeny(
  edit('decks/my-talk/pages/03.md', '<p>Quoted — verbatim.</p> <!-- lint-allow: em-dash -->'),
  'honors lint-allow on a tag line',
  inUser,
)
assertDeny(
  write('decks/my-talk/pages/02.md', "Here's the thing about tides. <!-- speaker cue -->"),
  'scans the rest of a line that ends in an HTML comment',
  inUser,
)
assertDeny(
  write('decks/my-talk/pages/02.md', '<p>At its core, tides.</p> {/* note */}'),
  'scans the rest of a line that carries a JSX comment',
  inUser,
)
assertDeny(
  edit('decks/my-talk/pages/02.md', '---\n\nAt its core, the moon sets the tide.'),
  'denies a phrase after a leading --- in an Edit fragment (no file to replay)',
  inUser,
)
{
  // A worktree under .claude/worktrees/<name>/ is a checkout of its own: its
  // decks count, judged against its own files.
  const project = scratch('decks-hook-wt-')
  const wt = join(project, '.claude/worktrees/foo')
  mkdirSync(join(wt, 'decks/x'), { recursive: true })
  writeFileSync(join(wt, 'decks/x/slides.md'), '---\n---\n')
  assertDeny(
    write(join(wt, 'decks/x/pages/01.md'), 'An em — dash.'),
    'denies in a deck of a worktree under .claude/worktrees/',
    { project },
  )
  assertDeny(
    write(join(wt, 'decks/y/pages/01.md'), 'An em — dash.'),
    'denies in a worktree deck built pages-first (no slides.md yet)',
    { project },
  )
  assertNotDeny(
    write('/Users/test/.claude/worktrees/foo/decks/x/pages/01.md', 'An em — dash.'),
    'allows a worktree-shaped path outside the project',
    { project },
  )
  rmSync(project, { recursive: true, force: true })
}
{
  // Scope is judged on the path inside the project, so a `decks/` directory
  // above it brings nothing in.
  const parent = scratch('decks-hook-parent-')
  const project = join(parent, 'decks/myapp')
  mkdirSync(join(project, 'src/components'), { recursive: true })
  assertNotDeny(
    write(join(project, 'src/components/Button.vue'), '<template><p>An em — dash.</p></template>'),
    'allows app components in a project that sits under a decks/ directory',
    { project },
  )
  rmSync(parent, { recursive: true, force: true })
}
assertNotDeny(
  write(join(ROOT, 'site/src/components/X.vue'), '<template><p>An em — dash.</p></template>'),
  "allows the site's components in this repo (its own dir is named decks)",
)
assertDeny(
  write('decks/no-slides/pages/01.md', 'An em — dash.'),
  'denies in a deck under decks/ built pages-first (no slides.md yet)',
  inUser,
)
assertDeny(
  write('decks/new-talk/slides.md', '---\n---\n\nAn em — dash.'),
  'denies in the slides.md a Write creates (the file that makes the deck)',
  inUser,
)
assertNotDeny(
  write('decks/my-talk/nested/pages/01.md', 'An em — dash.'),
  'a deck is one directory below the root, not two',
  inUser,
)
{
  // decksDir "." puts the decks at the project root: only top-level
  // directories holding a slides.md are decks.
  for (const spelling of ['.', './']) {
    const project = scratch('decks-hook-rootdir-')
    writeFileSync(join(project, 'decks.json'), JSON.stringify({ _config: { decksDir: spelling } }))
    mkdirSync(join(project, 'talk'), { recursive: true })
    writeFileSync(join(project, 'talk/slides.md'), '---\n---\n')
    assertNotDeny(
      write('src/components/Button.vue', '<template><p>An em — dash.</p></template>'),
      `decksDir "${spelling}": allows src/components (no slides.md)`,
      { project },
    )
    assertNotDeny(
      write('docs/pages/intro.md', 'An em — dash.'),
      `decksDir "${spelling}": allows docs/pages (no slides.md)`,
      { project },
    )
    assertDeny(write('talk/pages/01.md', 'An em — dash.'), `decksDir "${spelling}": denies in a deck at the root`, {
      project,
    })
    rmSync(project, { recursive: true, force: true })
  }
}
{
  const r = assertDeny(
    write(
      'examples/tides/pages/01-cover.md',
      '<p class="od-lede">At its core, the tide is a game-changer.</p>\n',
    ),
    'names every rule it hit',
  )
  const reason = r.json?.hookSpecificOutput?.permissionDecisionReason ?? ''
  check(
    reason.includes('stdin:1 [banned-phrase]') &&
      reason.includes('stdin:1 [ai-vocab]') &&
      reason.includes('lint-allow: pattern-id'),
    'reason lists stdin:<line> [id] hits and the lint-allow hint',
    () => reason.slice(0, 300),
  )
}

assertNotDeny(
  write('packages/decks/components/StoryCard.vue', 'This has an em — dash.'),
  "allows the addon's own components (out of scope)",
)
assertNotDeny(write('README.md', 'This has an em — dash.'), 'allows files outside deck dirs')
assertNotDeny(
  write('decks/node_modules/pkg/pages/x.md', 'leverage everything — seamless'),
  'allows node_modules paths',
)
assertNotDeny(
  write('decks/my-talk/data/tides.ts', 'export const X = 1 // seamless'),
  'allows data modules (not prose)',
  inUser,
)
assertNotDeny(
  write('decks/my-talk/pages/02.md', 'Normal prose.\n```\ncode with — dashes\n```\nMore prose.'),
  'allows em-dash inside a code fence',
  inUser,
)
assertNotDeny(
  write('decks/my-talk/pages/02.md', 'Direct quote with — dash <!-- lint-allow: em-dash -->'),
  'allows em-dash with a lint-allow marker',
  inUser,
)
assertNotDeny(
  write('decks/my-talk/pages/02.md', 'In other words, the cost is high.'),
  'allows warn-only content (colon-reveal)',
  inUser,
)
assertNotDeny(
  write('decks/my-talk/slides.md', '---\ntitle: "A seamless deck"\n---\nClean prose here.'),
  'allows AI vocab in frontmatter (skipped)',
  inUser,
)
assertNotDeny(
  { tool_name: 'Read', tool_input: { file_path: 'decks/x/pages/01.md' } },
  'ignores non-write tools',
)

// Story-card copy lives in <script setup>, which the prose pass skips.
const STAGE = [
  '<script setup lang="ts">',
  "const label = 'seamless — not card copy'",
  'const COPY = [',
  "  { lead: 'High water twice a day.', body: 'The moon pulls the bulge.' },",
  "  { lead: 'Quoted — verbatim.' }, // lint-allow: em-dash",
  ']',
  '</script>',
  '<template><div /></template>',
  '',
].join('\n')
assertDeny(
  write(
    'decks/my-talk/components/TideStage.vue',
    STAGE.replace('High water twice a day.', 'Tides are a seamless dance.'),
  ),
  'denies a planted line in a COPY array (Write)',
  inUser,
)
assertNotDeny(
  write('decks/my-talk/components/TideStage.vue', STAGE),
  'allows clean COPY, lint-allow lines and non-COPY script strings',
  inUser,
)
{
  // An Edit fragment is judged against the file it lands in.
  const project = scratch('decks-hook-')
  mkdirSync(join(project, 'talks/q3/components'), { recursive: true })
  writeFileSync(
    join(project, 'decks.json'),
    JSON.stringify({
      _config: { decksDir: 'talks' },
      q3: { entry: 'talks/q3/slides.md', name: 'q3' },
    }),
  )
  writeFileSync(join(project, 'talks/q3/components/TideStage.vue'), STAGE)
  const file = join(project, 'talks/q3/components/TideStage.vue')
  assertDeny(
    edit(
      file,
      "{ lead: 'The tide is a game-changer.', body: 'The moon pulls the bulge.' }",
      "{ lead: 'High water twice a day.', body: 'The moon pulls the bulge.' }",
    ),
    'denies a planted line in a COPY array (Edit fragment, decksDir from decks.json)',
    { project },
  )
  assertNotDeny(
    edit(file, "const label = 'tide label'", "const label = 'seamless — not card copy'"),
    'allows an Edit to a stage outside its COPY array',
    { project },
  )
  assertDeny(write('talks/q3/pages/01.md', 'An em — dash.'), "denies in the registry's decksDir", {
    project,
  })
  assertNotDeny(write('decks/q3/pages/01.md', 'Clean.'), 'allows clean prose in a user project', {
    project,
  })
  assertNotDeny(
    write('examples/demo/pages/01.md', 'An em — dash.'),
    'examples/ is not a deck root in a user project',
    { project },
  )
  // An Edit is judged in the file it lands in: a `---` slide separator at the
  // top of new_string is not frontmatter there.
  const page = join(project, 'talks/q3/pages/01.md')
  mkdirSync(dirname(page), { recursive: true })
  writeFileSync(page, '---\nlayout: full\n---\n\n# Tides rise twice a day.\n\nEND\n')
  assertDeny(
    edit(page, '---\n\nAt its core, the moon sets the tide.\n\nEND', 'END'),
    'denies a phrase after a leading --- in a replayed Edit',
    { project },
  )
  {
    const r = assertDeny(
      {
        tool_name: 'MultiEdit',
        tool_input: {
          file_path: page,
          edits: [
            { old_string: '# Tides rise twice a day.', new_string: '# Tides rise twice daily.' },
            { old_string: 'END', new_string: 'Clean line.\nThis is a seamless tide.' },
          ],
        },
      },
      'denies a phrase in the second edit of a replayed MultiEdit',
      { project },
    )
    const reason = r.json?.hookSpecificOutput?.permissionDecisionReason ?? ''
    check(
      reason.includes('talks/q3/pages/01.md:8 [ai-vocab]') && !reason.includes(':5 '),
      'a replayed MultiEdit reports file line numbers, only on lines it wrote',
      () => reason.slice(0, 300),
    )
  }
  writeFileSync(page, '---\nlayout: full\n---\n\nThis is a seamless tide. <!-- lint-allow -->\n\nEND\n')
  assertNotDeny(
    edit(page, 'Clean ending.', 'END'),
    'a replayed Edit is not blamed for lines it did not write',
    { project },
  )
  rmSync(project, { recursive: true, force: true })
}
{
  // decksDir spelled "./talks/" in decks.json.
  const project = scratch('decks-hook-dotdir-')
  writeFileSync(join(project, 'decks.json'), JSON.stringify({ _config: { decksDir: './talks/' } }))
  mkdirSync(join(project, 'talks/q4'), { recursive: true })
  writeFileSync(join(project, 'talks/q4/slides.md'), '---\n---\n')
  assertDeny(write('talks/q4/pages/01.md', 'An em — dash.'), 'denies under a ./talks/ decksDir', {
    project,
  })
  assertDeny(
    write(join(project, 'talks/q4/slides.md'), 'An em — dash.'),
    'denies under a ./talks/ decksDir (absolute path)',
    { project },
  )
  writeFileSync(join(project, 'decks.json'), JSON.stringify({ _config: { decksDir: '././talks' } }))
  assertDeny(write('talks/q4/pages/01.md', 'An em — dash.'), 'denies under a ././talks decksDir', {
    project,
  })
  rmSync(project, { recursive: true, force: true })
}
{
  // Edits replayed against the file: deletions, appends and exposed prose.
  const project = scratch('decks-hook-replay-')
  mkdirSync(join(project, 'decks/d/pages'), { recursive: true })
  writeFileSync(join(project, 'decks/d/slides.md'), '---\n---\n')
  const page = join(project, 'decks/d/pages/01.md')
  const fm = '---\nlayout: full\n---\n\n'
  writeFileSync(page, fm + "Here's the XX thing.\n")
  assertDeny(
    edit(page, '', 'XX '),
    'denies an Edit with an empty new_string whose deletion leaves a banned phrase',
    { project },
  )
  writeFileSync(page, fm + '<!--\nLine one.\nIt is worth noting the tide.\n-->\n')
  assertDeny(
    edit(page, '', '<!--\n'),
    'denies an Edit with an empty new_string that un-comments a banned line',
    { project },
  )
  writeFileSync(page, fm + 'Old — bad.\nZ\n')
  assertNotDeny(
    edit(page, '\nZ fine', '\nZ'),
    'allows appending after a line that already has a hit',
    { project },
  )
  writeFileSync(page, '# Head.\nremove me\nLet that sink in.\n')
  assertNotDeny(
    edit(page, '', 'remove me\n'),
    'deleting a whole line does not blame the pre-existing hit on the next line',
    { project },
  )
  const stage = join(project, 'decks/d/components/S.vue')
  mkdirSync(dirname(stage), { recursive: true })
  writeFileSync(
    stage,
    '<script setup>\nconst COPY = [\n  // { lead: "x" },\n  { lead: "Let that sink in." },\n]\n</script>\n',
  )
  assertNotDeny(
    edit(stage, '', '  // { lead: "x" },\n'),
    'deleting a COPY line does not blame the pre-existing hit on the next entry',
    { project },
  )
  writeFileSync(page, fm + 'Old — bad.\n\nGood line.\n')
  assertNotDeny(
    edit(page, 'Better line.\nAnother.', 'Good line.'),
    'a hit that only moved down the file is not new',
    { project },
  )
  rmSync(project, { recursive: true, force: true })
}

// Fail closed: a scanner whose pattern file is missing refuses the write.
{
  const copy = scratch('decks-nopatterns-')
  for (const sub of ['scripts', 'lint']) {
    const from = join(ROOT, 'packages/decks', sub)
    mkdirSync(join(copy, sub), { recursive: true })
    for (const f of readdirSync(from).filter((f) => f.endsWith('.mjs')))
      copyFileSync(join(from, f), join(copy, sub, f))
  }
  const r = runHook('lint', write('decks/my-talk/pages/02.md', 'Clean prose.'), {
    deck: join(copy, 'scripts/deck.mjs'),
    project: USER,
  })
  check(
    r.rc === 2 && r.err.includes('cannot load the AI-rhetoric scanner'),
    'refuses (exit 2) when the patterns file is missing',
    () => `rc=${r.rc} err=${r.err.slice(0, 160)}`,
  )
  for (const [what, tsv] of [
    ['is empty', ''],
    ['holds only comments and warns', '# id\tseverity\tregex\tmessage\nx\twarn\tfoo\tbar\n'],
    ['has an unknown severity', 'x\terror\tfoo\tbar\ny\terorr\tbaz\tqux\n'],
  ]) {
    writeFileSync(join(copy, 'lint/ai-rhetoric-patterns.tsv'), tsv)
    const h = runHook('lint', write('decks/my-talk/pages/02.md', 'Clean prose.'), {
      deck: join(copy, 'scripts/deck.mjs'),
      project: USER,
    })
    check(
      h.rc === 2 && h.err.includes('cannot load the AI-rhetoric scanner'),
      `refuses (exit 2) when the patterns file ${what}`,
      () => `rc=${h.rc} err=${h.err.slice(0, 200)}`,
    )
  }
  rmSync(join(copy, 'lint/ai-rhetoric-patterns.tsv'))
  const outside = runHook('lint', write('README.md', 'Clean prose.'), {
    deck: join(copy, 'scripts/deck.mjs'),
  })
  check(
    outside.rc === 0,
    'a missing patterns file never blocks writes outside decks',
    () => `rc=${outside.rc}`,
  )
  rmSync(copy, { recursive: true, force: true })
}
{
  const r = runHook('lint', null, { raw: '{not json' })
  check(
    r.rc === 2 && r.err.includes('BLOCKED'),
    'refuses (exit 2) on a payload it cannot parse',
    () => `rc=${r.rc} err=${r.err.slice(0, 120)}`,
  )
}

console.log('== decks hook prompt ==')

function runPrompt(prompt, project) {
  const r = runHook(
    'prompt',
    { hook_event_name: 'UserPromptSubmit', prompt },
    project ? { project } : {},
  )
  return { rc: r.rc, ctx: r.json?.hookSpecificOutput?.additionalContext ?? '' }
}
const fires = (prompt, name, project) => {
  const r = runPrompt(prompt, project)
  check(
    r.rc === 0 && r.ctx.includes('Deck writing reminder'),
    name,
    () => `expected reminder, rc=${r.rc} ctx=${r.ctx.slice(0, 80)}`,
  )
  return r
}
const silent = (prompt, name, project) => {
  const r = runPrompt(prompt, project)
  check(r.rc === 0 && !r.ctx, name, () => `expected silence, rc=${r.rc} ctx=${r.ctx.slice(0, 80)}`)
}

fires('make a 5-slide story deck about tides', 'fires on make + deck')
fires('Draft the slides for my talk', 'fires on draft + slides')
fires('the presentation needs a rewrite, can you revise it', 'fires on noun before verb')
silent(
  'why does the dev server log a warning on slide 3',
  'silent on a slide mention with no writing verb',
)
silent('bump vitest to the latest version', 'silent on unrelated work')
silent('', 'silent on an empty prompt')
{
  const r = fires('write a deck', 'reminder points at the deck-writing rule')
  check(
    r.ctx.includes('.claude/rules/deck-writing.md') && r.ctx.includes('`bun run lint`'),
    'in this repo the reminder names `bun run lint`',
    () => r.ctx.slice(0, 200),
  )
}
{
  // Outside the repo: no repo-only paths, the CLI instead of repo scripts, and
  // revision prompts fire only while deck pages have uncommitted changes.
  const project = scratch('decks-prompt-')
  writeFileSync(
    join(project, 'decks.json'),
    JSON.stringify({
      _config: { decksDir: 'talks' },
      q3: { entry: 'talks/q3/slides.md', name: 'q3' },
    }),
  )
  mkdirSync(join(project, 'talks/q3/pages'), { recursive: true })
  writeFileSync(join(project, 'talks/q3/slides.md'), '---\nsrc: ./pages/01.md\n---\n')
  writeFileSync(join(project, 'talks/q3/pages/01.md'), 'One.\n')
  const r = fires('write a deck', 'fires in a user project', project)
  check(
    !/examples\/|packages\/|bun run|beats\.test/.test(r.ctx) &&
      r.ctx.includes('npx -p slidev-addon-decks decks lint') &&
      r.ctx.includes('.claude/rules/deck-writing.md'),
    'outside the repo the reminder names no repo-only path',
    () => r.ctx,
  )
  writeFileSync(join(project, 'bun.lock'), '{}\n')
  check(
    fires('write a deck', 'fires with a bun lockfile', project).ctx.includes(
      'bunx -p slidev-addon-decks decks lint',
    ),
    'with a bun lockfile the reminder names bunx',
    () => '',
  )
  const git = (...args) => spawnSync('git', args, { cwd: project, encoding: 'utf8' })
  git('init', '-q')
  git('add', '-A')
  git('-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-qm', 'init')
  silent('tighten this bullet', 'revision prompt is silent with a clean tree', project)
  writeFileSync(join(project, 'talks/q3/pages/01.md'), 'One, edited.\n')
  fires(
    'tighten this bullet',
    'revision prompt fires while a page in decksDir is modified',
    project,
  )
  rmSync(project, { recursive: true, force: true })
}

{
  // decksDir ".": only top-level directories holding a slides.md are decks, so
  // an uncommitted app component is not deck work in progress.
  const project = scratch('decks-prompt-root-')
  writeFileSync(join(project, 'decks.json'), JSON.stringify({ _config: { decksDir: '.' } }))
  mkdirSync(join(project, 'talk/pages'), { recursive: true })
  mkdirSync(join(project, 'src/components'), { recursive: true })
  writeFileSync(join(project, 'talk/slides.md'), '---\nsrc: ./pages/01.md\n---\n')
  writeFileSync(join(project, 'talk/pages/01.md'), 'One.\n')
  writeFileSync(join(project, 'src/components/Button.vue'), '<template />\n')
  const git = (...args) => spawnSync('git', args, { cwd: project, encoding: 'utf8' })
  git('init', '-q')
  git('add', '-A')
  git('-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-qm', 'init')
  writeFileSync(join(project, 'src/components/Button.vue'), '<template><b /></template>\n')
  silent(
    'tighten this bullet',
    'decksDir ".": a modified app component is not deck work in progress',
    project,
  )
  writeFileSync(join(project, 'talk/pages/01.md'), 'One, edited.\n')
  fires('tighten this bullet', 'decksDir ".": a modified deck page is', project)
  rmSync(project, { recursive: true, force: true })
}

console.log('== decks hook lint: Codex apply_patch ==')

const patch = (...body) => ({
  tool_name: 'apply_patch',
  hook_event_name: 'PreToolUse',
  tool_input: { command: ['*** Begin Patch', ...body, '*** End Patch'].join('\n') },
})
{
  const project = scratch('decks-hook-patch-')
  mkdirSync(join(project, 'decks/talk/pages'), { recursive: true })
  writeFileSync(join(project, 'decks/talk/slides.md'), '---\nsrc: ./pages/01.md\n---\n')
  writeFileSync(
    join(project, 'decks/talk/pages/01.md'),
    '<!--\nSLIDE 1\n-->\n\n<p>Ridership is back.</p>\n<p>An em — dash already here.</p>\n',
  )
  const at = { project }
  assertDeny(
    patch('*** Add File: decks/talk/pages/02.md', '+<p>An em — dash.</p>'),
    'denies an em dash in an added page',
    at,
  )
  const r = assertDeny(
    patch(
      '*** Update File: decks/talk/pages/01.md',
      '@@',
      '-<p>Ridership is back.</p>',
      "+<p>Here's the thing about ridership.</p>",
    ),
    'denies a banned phrase in an updated page',
    at,
  )
  check(
    /decks\/talk\/pages\/01\.md:5\b/.test(r.json?.hookSpecificOutput?.permissionDecisionReason ?? ''),
    'an update reports the hit at its line in the file after the patch',
    () => r.json?.hookSpecificOutput?.permissionDecisionReason,
  )
  assertNotDeny(
    patch(
      '*** Update File: decks/talk/pages/01.md',
      '@@',
      '-<p>Ridership is back.</p>',
      '+<p>Ridership passed 2019 in March.</p>',
    ),
    'allows a clean update next to an existing hit it did not write',
    at,
  )
  assertDeny(
    patch(
      '*** Add File: src/notes.md',
      '+An em — dash outside a deck.',
      '*** Add File: decks/talk/components/TideStage.vue',
      '+<script setup>',
      "+const COPY = [{ lead: 'Tides', body: 'A seamless dance.' }]",
      '+</script>',
    ),
    'a multi-file patch is judged per file (out-of-scope file skipped, card COPY caught)',
    at,
  )
  assertNotDeny(
    patch('*** Add File: src/notes.md', '+An em — dash outside a deck.'),
    'ignores a patch that touches no deck prose',
    at,
  )
  assertNotDeny(
    patch('*** Delete File: decks/talk/pages/01.md'),
    'a delete writes no prose',
    at,
  )
  assertDeny(
    patch(
      '*** Update File: decks/talk/pages/01.md',
      '*** Move to: decks/talk/pages/03.md',
      '@@',
      '-<p>Ridership is back.</p>',
      '+<p>An em — dash.</p>',
    ),
    'a moved page is judged at its new path, replayed from its old one',
    at,
  )
  rmSync(project, { recursive: true, force: true })
}

console.log('== .codex/hooks.json wiring ==')
{
  const codex = JSON.parse(readFileSync(join(ROOT, '.codex/hooks.json'), 'utf8'))
  const lintCmd = codex.hooks?.PreToolUse?.find((h) => h.matcher === '^apply_patch$')?.hooks?.[0]
    ?.command
  const promptCmd = codex.hooks?.UserPromptSubmit?.[0]?.hooks?.[0]?.command
  check(lintCmd?.includes('hook lint'), 'Codex apply_patch runs `decks hook lint`', () =>
    JSON.stringify(codex),
  )
  check(promptCmd?.includes('hook prompt'), 'Codex UserPromptSubmit runs `decks hook prompt`', () =>
    JSON.stringify(codex),
  )
  // Run the way Codex does: no CLAUDE_PROJECT_DIR, cwd at the checkout.
  const { CLAUDE_PROJECT_DIR: _, ...env } = process.env
  const sh = (command, input, cwd = ROOT) =>
    spawnSync('sh', ['-c', command], { cwd, input, encoding: 'utf8', env })
  const planted = JSON.stringify(
    patch('*** Add File: examples/agent-experience/pages/99-x.md', '+An em — dash.'),
  )
  const r = sh(lintCmd, planted)
  check(
    r.status === 0 && r.stdout.includes('"deny"'),
    'the wired Codex command denies a planted line',
    () => `rc=${r.status} ${r.stdout}${r.stderr}`,
  )
  const outside = scratch('decks-hook-nogit-')
  const gone = sh(lintCmd, planted, outside)
  rmSync(outside, { recursive: true, force: true })
  check(
    gone.status === 2,
    'the wired Codex command refuses (exit 2) outside a checkout with the CLI',
    () => `rc=${gone.status} ${gone.stderr}`,
  )
  const p = sh(promptCmd, JSON.stringify({ prompt: 'write a deck about tides', cwd: ROOT }))
  check(
    p.status === 0 && p.stdout.includes('deck-writing.md'),
    'the wired Codex prompt hook adds the reminder',
    () => `rc=${p.status} ${p.stdout}${p.stderr}`,
  )
}

console.log('== settings.json wiring ==')

const settings = JSON.parse(readFileSync(join(ROOT, '.claude/settings.json'), 'utf8'))
const commands = JSON.stringify(settings.hooks ?? {})
const pre = settings.hooks?.PreToolUse?.find((h) => h.matcher === 'Edit|Write|MultiEdit')
  ?.hooks?.[0]?.command
const ups = settings.hooks?.UserPromptSubmit?.[0]?.hooks?.[0]?.command
check(
  pre?.includes('hook lint'),
  'PreToolUse on Edit|Write|MultiEdit runs `decks hook lint`',
  () => commands,
)
check(ups?.includes('hook prompt'), 'UserPromptSubmit runs `decks hook prompt`', () => commands)
check(
  !commands.includes('jq') && !commands.includes('.sh'),
  'no hook needs jq or a shell script',
  () => commands,
)
{
  // The wired command, run the way Claude Code runs it.
  const sh = (command, input) =>
    spawnSync('sh', ['-c', command], {
      cwd: ROOT,
      input,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
    })
  const r = sh(pre, JSON.stringify(write('examples/tides/pages/99-x.md', 'An em — dash.')))
  check(
    r.status === 0 && r.stdout.includes('"deny"'),
    'the wired PreToolUse command denies a planted line',
    () => `rc=${r.status} ${r.stdout}${r.stderr}`,
  )
  const gone = sh(
    pre.replace('deck.mjs', 'missing-deck.mjs'),
    JSON.stringify(write('examples/tides/pages/99-x.md', 'Clean.')),
  )
  check(
    gone.status === 2,
    'the wired command refuses (exit 2) when the CLI cannot start',
    () => `rc=${gone.status}`,
  )
}

console.log(`\nResults: ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
