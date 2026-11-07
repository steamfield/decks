import vue from '@vitejs/plugin-vue'
import { configDefaults, defineConfig } from 'vitest/config'

// The vue plugin is here so deck-local .vue components can be imported in
// tests. `include` finds every deck's own tests (examples/ and decks/) without
// a script edit, and leaves out packages/decks/agent/, whose exemplars/ is a
// rendered copy of two example decks, tests included. The exclude keeps agent
// worktrees (.claude/worktrees/<run>/ is a full checkout) out of this
// checkout's run.
export default defineConfig({
  plugins: [vue()],
  test: {
    include: [
      'packages/decks/{story,scripts,theme,lint}/**/*.test.ts',
      'examples/*/**/*.test.ts',
      'decks/*/**/*.test.ts',
    ],
    exclude: [...configDefaults.exclude, '.claude/worktrees/**'],
  },
})
