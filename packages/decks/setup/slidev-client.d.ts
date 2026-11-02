/**
 * The package's `./*` export lets Vite reach this module, but the pattern
 * has no extension, so both tsc and the bundler need the `.ts` spelled out.
 * Declare the one function the setup uses.
 */
declare module '@slidev/client/logic/slides.ts' {
  import type { SlideRoute } from '@slidev/types'
  export function getSlide(no: number | string): SlideRoute | undefined
}
