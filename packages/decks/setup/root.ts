/**
 * Root setup: runs inside Slidev's root component, where `useNav()` is
 * available. Only the embed control lives here; it is inert unless the deck
 * is inside a same-origin iframe (see `./embed.ts`).
 */
import { defineRootSetup } from '@slidev/types'
import { installEmbed } from './embed'

export default defineRootSetup(() => {
  installEmbed()
})
