/**
 * The categorical palette the scale slide's unit grid shares with the 3D graph.
 *
 * The twelve hues live in `packages/decks/story/graph-palette.ts`, which `Graph3D.vue`
 * reads too, so the grid and the graph cannot disagree about what colour
 * Education is. The product's graph explorer
 * (`frontend/app/routes/graph/_components/buildGraphSpec.ts`) keeps its own
 * copy of the same list and has to be kept in step by hand.
 *
 * Assignment order is first appearance in `graphNodes`, which is the order the
 * renderer walks the node list in. It is a match on the same input rather than
 * a guarantee about openchart's internal scale.
 */
import { CATEGORICAL_COLORS } from "@steamfield/decks/kit";
import { graphNodes } from "./graph-data";

export { CATEGORICAL_COLORS };

/** Categories in order of first appearance in the snapshot. */
export const categoryOrder: string[] = (() => {
  const seen: string[] = [];
  for (const node of graphNodes) {
    const category = node.category || "Other";
    if (!seen.includes(category)) seen.push(category);
  }
  return seen;
})();

export const categoryColor: Record<string, string> = Object.fromEntries(
  categoryOrder.map((category, i) => {
    const color = CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length];
    if (color === undefined) throw new Error(`category ${category} has no palette color`);
    return [category, color];
  }),
);

export function colorForCategory(category?: string): string {
  const color =
    categoryColor[category || "Other"] ?? CATEGORICAL_COLORS[CATEGORICAL_COLORS.length - 1];
  if (color === undefined) throw new Error(`category ${category} has no palette color`);
  return color;
}
