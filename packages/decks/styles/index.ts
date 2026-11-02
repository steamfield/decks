// Slidev loads `styles/index.{ts,js,css}` from every addon. This entry is TS
// because the theme tokens are a virtual module (see vite.config.mts), and
// Vite resolves a CSS `@import` through aliases only, never through plugins.
import 'virtual:decks/tokens.css'
import './main.css'
