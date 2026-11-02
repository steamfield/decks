import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Only here so deck-local .vue components can be imported in tests.
export default defineConfig({ plugins: [vue()] })
