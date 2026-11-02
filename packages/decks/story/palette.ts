/**
 * The categorical palette the story deck's graph and unit grid share.
 *
 * Lifted from the product's graph explorer
 * (`frontend/app/routes/graph/_components/buildGraphSpec.ts`). The frontend
 * keeps its own copy and must stay in step: if the deck's grid and the
 * product's graph disagree on what colour Education is, the beat where the
 * squares become nodes reads as a cut.
 *
 * Both readers here are in this repo: `Graph3D.vue` hands it to openchart as
 * the categorical scale, and `opendata-pitch/data/graph-palette.ts` assigns it
 * to categories by first appearance in the snapshot.
 */
export const CATEGORICAL_COLORS = [
  '#58a6ff',
  '#3fb950',
  '#d29922',
  '#bc8cff',
  '#f47067',
  '#39d2c0',
  '#f0883e',
  '#a5d6ff',
  '#8b949e',
  '#f778ba',
  '#7ee787',
  '#d2a8ff',
]
