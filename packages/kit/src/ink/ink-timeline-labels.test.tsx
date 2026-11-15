import { screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, expect, it } from "vitest";
import { setup } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { STORY_STYLE } from "./ink-style";
import { InkTimeline, type TimelineTick } from "./ink-timeline";

beforeEach(() => {
  installTheme(resolveTheme());
  STORY_STYLE.ink = "clean";
});
const base: ComponentProps<typeof InkTimeline> = {
  ticks: [],
  domain: [0, 10],
  range: [200, 1200],
  y: 400,
};
const labelY = (label: string) => Number(screen.getByText(label).getAttribute("y"));
const crowded: TimelineTick[] = [
  { id: "b", at: 2, label: "Second long date" },
  { id: "a", at: 1, label: "First long date" },
];
it("stacks crowded labels left to right even when the input order differs", async () => {
  await setup(() => (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ticks={crowded} />
    </svg>
  ));
  expect(labelY("Second long date")).toBeGreaterThan(labelY("First long date"));
});
const spaced: TimelineTick[] = [
  { id: "a", at: 0, label: "Earlier" },
  { id: "b", at: 3, label: "Later" },
];
async function labelYWith(props: Partial<ComponentProps<typeof InkTimeline>>, label: string) {
  const app = await setup(() => (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ticks={spaced} {...props} />
    </svg>
  ));
  const y = labelY(label);
  app.unmount();
  return y;
}
it.each([
  ["labelGap", { labelGap: 300 }, "Later"],
  ["labelOffset", { labelOffset: 60 }, "Earlier"],
  ["rowHeight", { rowHeight: 60, ticks: crowded }, "Second long date"],
] satisfies [string, Partial<ComponentProps<typeof InkTimeline>>, string][])(
  "uses %s for label placement",
  async (_, props, label) => {
    const plain = "ticks" in props ? { ticks: crowded } : {};
    expect(await labelYWith(props, label)).toBeGreaterThan(await labelYWith(plain, label));
  },
);
it("uses labelRows to put crowded labels on one row", async () => {
  await setup(() => (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ticks={crowded} labelRows={1} />
    </svg>
  ));
  expect(labelY("Second long date")).toBe(labelY("First long date"));
});
it("uses labelSize in both text and collision spacing", async () => {
  await setup(() => (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ticks={crowded} labelSize={8} />
    </svg>
  ));
  expect(screen.getByText("First long date")).toHaveStyle({ fontSize: "8px" });
  expect(labelY("Second long date")).toBe(labelY("First long date"));
});
