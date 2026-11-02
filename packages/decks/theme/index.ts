/**
 * Public theme surface: `import { theme } from 'slidev-addon-decks/theme'`
 * gives deck code the resolved theme (the deck's `theme.json` over the
 * defaults) for colors that have to live in JS, such as chart specs.
 */
export { default as theme } from '#decks/theme'
export type { BrandLogo, Hue, Ramp, Theme } from './resolve'
