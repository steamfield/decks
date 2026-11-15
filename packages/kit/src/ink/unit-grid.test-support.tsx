import { screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { UnitGrid } from "../index";
import { setup } from "../kit.test-support";

export type Props = ComponentProps<typeof UnitGrid>;
export async function draw(props: Props = {}) {
  return setup(() => (
    <svg role="img" aria-label="Units">
      <UnitGrid {...props} />
    </svg>
  ));
}
// SVG geometry and paint are the visible output; the fixture supplies its accessible name.
export function cells() {
  return Array.from(screen.getByRole("img", { name: "Units" }).children[0]?.children ?? []);
}
export function cell(i = 0) {
  const element = cells()[i];
  if (!element) throw new Error(`Missing drawn cell ${i}`);
  return element;
}
export function body(i = 0) {
  const element = cell(i).children[0]?.children[0];
  if (!element) throw new Error(`Missing cell body ${i}`);
  return element;
}
export function pose(i = 0) {
  return cell(i).getAttribute("transform");
}
export function alpha(i = 0) {
  return Number(getComputedStyle(cell(i)).opacity);
}
export function scaleOf(i = 0) {
  const match = /scale\(([\d.]+)\)/.exec(pose(i) ?? "");
  if (!match?.[1]) throw new Error(`Cell ${i} has no scale in "${pose(i)}"`);
  return Number(match[1]);
}
export const COUNT = 1000;
// Opacity is read on a spread of cells: 1000 style computations per assertion is slow under load.
export function fullyShown() {
  return [0, COUNT >> 1, COUNT - 1].every((i) => alpha(i) === 1);
}
