import vue from '@vitejs/plugin-vue'
import { configDefaults, defineConfig } from 'vitest/config'

// The vue plugin is here so deck-local .vue components can be imported in
// tests. The exclude keeps agent worktrees (.claude/worktrees/<run>/ is a full
// checkout) out of this checkout's run: `bun run test`'s path filters match
// substrings, so without it every worktree's suite runs here too.
export default defineConfig({
  plugins: [vue()],
  test: { exclude: [...configDefaults.exclude, '.claude/worktrees/**'] },
})
