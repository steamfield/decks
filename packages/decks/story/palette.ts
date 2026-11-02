import theme from '#decks/theme'

/**
 * The categorical palette the story deck's graph and unit grid share, from
 * the deck theme's `categorical` list.
 *
 * Both readers here are in this repo: `Graph3D.vue` hands it to openchart as
 * the categorical scale, and `opendata-pitch/data/graph-palette.ts` assigns it
 * to categories by first appearance in the snapshot.
 */
export const CATEGORICAL_COLORS: string[] = theme.categorical
