// Project facts that init, lint and the hooks all read the same way.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'

/**
 * A decksDir as the registry spells it, without `./` segments or a trailing
 * `/`; `.` for the project root. `././talks/`, `./talks` and `talks` are all
 * `talks`.
 */
export function normalizeDir(dir) {
  return posix.normalize(dir.replaceAll('\\', '/')).replace(/\/+$/, '') || '.'
}

/** True in the Decks repo itself: the addon is a workspace package, not a dependency. */
export function isDecksRepo(rootDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(rootDir, 'packages/decks/package.json'), 'utf8'))
    return pkg?.name === 'slidev-addon-decks'
  } catch {
    return false
  }
}

/** Names of the directories directly under `root` that hold a slides.md. */
export function deckNamesUnder(root) {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.'))
    .map((e) => e.name)
    .filter((name) => existsSync(join(root, name, 'slides.md')))
}
