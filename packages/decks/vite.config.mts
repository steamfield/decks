import { defineConfig } from 'vite'

// Merged into every deck's Vite config by Slidev (addon root). Pre-bundling the
// 3D graph entry and gsap keeps the dev server from discovering three.js on the
// first 3D mount mid-talk and forcing a full reload.
export default defineConfig({
  // Linked OpenChart must share Slidev's Vue instance for lifecycle hooks.
  resolve: { dedupe: ['vue'] },
  optimizeDeps: {
    include: ['@opendata-ai/openchart-vue/graph-3d', 'gsap'],
    // Decks import the addon by package name while its own files import each
    // other relatively; pre-bundling it would give the two paths separate
    // module instances, and view-transition.ts holds module state.
    exclude: ['slidev-addon-decks'],
  },
})
