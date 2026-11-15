import { useTween } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import { type ComponentProps, createRef, type Ref } from "react";
import { afterEach, expect, it } from "vitest";
import {
  DUR,
  ink,
  installTheme,
  resolveTheme,
  rippleProgress,
  STORY_STYLE,
  UnitGrid,
  type UnitGridHandle,
  unitCellCenter,
  useStage,
} from "../index";
import { setup, tick } from "../kit.test-support";

installTheme(resolveTheme());
afterEach(() => {
  STORY_STYLE.ink = "clean";
});
type Props = ComponentProps<typeof UnitGrid>;

async function draw(props: Props = {}) {
  return setup(() => (
    <svg role="img" aria-label="Units">
      <UnitGrid {...props} />
    </svg>
  ));
}
// SVG geometry and paint are the visible output; the fixture supplies its accessible name.
function cells() {
  return Array.from(screen.getByRole("img", { name: "Units" }).children[0]?.children ?? []);
}
function cell(i = 0) {
  const element = cells()[i];
  if (!element) throw new Error(`Missing drawn cell ${i}`);
  return element;
}
function body(i = 0) {
  const element = cell(i).children[0]?.children[0];
  if (!element) throw new Error(`Missing cell body ${i}`);
  return element;
}
function pose(i = 0) {
  return cell(i).getAttribute("transform");
}
function alpha(i = 0) {
  return Number(getComputedStyle(cell(i)).opacity);
}

it("draws one cell per anonymous count and no cells by default", async () => {
  const empty = await draw();
  expect(cells()).toHaveLength(0);
  empty.unmount();
  await draw({ count: 1000 });
  expect(cells()).toHaveLength(1000);
  expect(cells().every((c) => getComputedStyle(c).opacity === "1")).toBe(true);
});
it("uses explicit items instead of count and recolors by each item's hue and step", async () => {
  await draw({
    count: 50,
    items: [
      { id: "a", hue: "rose" },
      { id: "b", hue: "amber", step: 4 },
    ],
    recolor: 1,
  });
  expect(cells()).toHaveLength(2);
  expect(body().getAttribute("fill")).toBe(
    `color-mix(in oklab, ${ink("rose", 2)} 100%, ${ink("slate", 2)})`,
  );
  expect(body(1).getAttribute("fill")).toContain(ink("amber", 4));
});
it("places default cells at the shared grid centers", async () => {
  await draw({ count: 22 });
  for (const i of [0, 21]) {
    const c = unitCellCenter(i, {});
    expect(pose(i)).toBe(`translate(${c.x} ${c.y}) scale(1) translate(-8 -8)`);
  }
});
it.each([
  ["origin", { origin: { x: 100, y: 200 } }, "translate(108 208)"],
  ["cols", { cols: 1 }, "translate(8 32)"],
  ["gapX", { gapX: 20 }, "translate(44 8)"],
  ["gapY", { cols: 1, gapY: 20 }, "translate(8 44)"],
] as const)("places cells using %s", async (_, props, position) => {
  await draw({ count: 2, ...props });
  expect(pose("origin" in props ? 0 : 1)).toContain(position);
});
it("uses cellWidth for width, pitch and corner radius", async () => {
  await draw({ count: 2, cellWidth: 50 });
  expect(body()).toHaveAttribute("width", "50");
  expect(body()).toHaveAttribute("height", "50");
  expect(body()).toHaveAttribute("rx", "9");
  expect(pose(1)).toBe("translate(83 25) scale(1) translate(-25 -25)");
});
it("uses an explicit cellHeight instead of the glyph height", async () => {
  await draw({ count: 1, cellHeight: 40 });
  expect(body()).toHaveAttribute("height", "40");
  expect(pose()).toBe("translate(8 20) scale(1) translate(-8 -20)");
});
it("draws sheets with page height, a folded corner and two etched rules", async () => {
  await draw({ count: 1, glyph: "sheet", cellWidth: 50 });
  expect(body().tagName).toBe("path");
  expect(body()).toHaveAttribute("d", "M0 0L35 0L50 15L50 66L0 66Z");
  expect(cell().children[0]?.children).toHaveLength(4);
});
it("uses the base color until recolor mixes in the target", async () => {
  await draw({ count: 1, color: "var(--od-rose)" });
  expect(body()).toHaveAttribute("fill", "var(--od-rose)");
});
it("accepts one colorBy target for the whole field", async () => {
  await draw({ count: 1, colorBy: "var(--od-amber)", recolor: 0.5 });
  expect(body()).toHaveAttribute(
    "fill",
    `color-mix(in oklab, var(--od-amber) 50%, ${ink("slate", 2)})`,
  );
});
it("passes item identity and index to colorBy and falls back to item hue", async () => {
  await draw({
    items: [{ id: "a" }, { id: "b", hue: "rose" }],
    recolor: 1,
    colorBy: (item, index) => (item.id === "a" && index === 0 ? "transparent" : undefined),
  });
  expect(body().getAttribute("fill")).toContain("transparent 100%");
  expect(body(1).getAttribute("fill")).toContain(ink("rose", 2));
});
it("hides unrevealed cells and grows them as reveal advances", async () => {
  const start = await draw({ count: 1, reveal: 0 });
  expect(alpha()).toBe(0);
  expect(pose()).toContain("scale(0.62)");
  start.unmount();
  await draw({ count: 1, reveal: 0.1, stagger: 0 });
  expect(alpha()).toBeGreaterThan(0);
  expect(alpha()).toBeLessThan(1);
});
it("spreads the reveal when stagger is nonzero", async () => {
  const together = await draw({ count: 100, reveal: 0.3, stagger: 0 });
  expect(alpha()).toBe(alpha(99));
  together.unmount();
  await draw({ count: 100, reveal: 0.3, stagger: 0.6 });
  expect(alpha()).toBeGreaterThan(alpha(99));
});
it("scatters with stable seeded offsets in independent instances", async () => {
  const a = await draw({ count: 2, scatter: 1, seed: "same" });
  const first = pose();
  expect(first).not.toBe("translate(8 8) scale(1) translate(-8 -8)");
  a.unmount();
  const b = await draw({ count: 2, scatter: 1, seed: "same" });
  expect(pose()).toBe(first);
  b.unmount();
  await draw({ count: 2, scatter: 1, seed: "different" });
  expect(pose()).not.toBe(first);
});
it("collapses cells to the supplied target and scales them down", async () => {
  await draw({ count: 1, collapse: 1, collapseTo: { x: 100, y: 200 } });
  expect(pose()).toBe("translate(100 200) scale(0) translate(-8 -8)");
});
it("gathers staggered cells as tiles and reports arrivals through the ref", async () => {
  const ref = createRef<UnitGridHandle>();
  await draw({ count: 3, collapse: 1, collapseStagger: 0.5, ref });
  expect(ref.current?.arrived).toBe(3);
  expect(alpha()).toBe(0);
  expect(pose()).toContain("scale(0.4)");
});
it("starts dissolving inside collapseInto rather than at the default trip share", async () => {
  const small = await draw({
    count: 1,
    collapse: 0.2,
    collapseStagger: 0.5,
    collapseInto: { width: 1, height: 1 },
  });
  expect(alpha()).toBe(1);
  small.unmount();
  await draw({
    count: 1,
    collapse: 0.2,
    collapseStagger: 0.5,
    collapseInto: { width: 1920, height: 1080 },
  });
  expect(alpha()).toBeLessThan(1);
});
it("applies optional clean glow", async () => {
  await draw({ count: 1, glow: true });
  expect(cell().children[0]).toHaveAttribute("filter", "var(--od-filter-glow)");
});
it("draws seeded marker polygons with the requested filter", async () => {
  STORY_STYLE.ink = "marker";
  const first = await draw({ count: 1, filterId: "custom" });
  expect(body().tagName).toBe("path");
  expect(cell().children[0]).toHaveAttribute("filter", "url(#custom)");
  const outline = body().getAttribute("d");
  first.unmount();
  await draw({ count: 1, filterId: "none" });
  expect(body()).toHaveAttribute("d", outline);
  expect(cell().children[0]).not.toHaveAttribute("filter");
});

function Waffle() {
  const state = useTween({ reveal: 0, ripple: 0 });
  useStage({
    copy: [{ lead: "Start" }, { lead: "Color" }],
    enter: (tl) => {
      tl.to(state, { reveal: 1, duration: DUR.bloom, ease: "none" });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(state, { ripple: 1, duration: DUR.bloom, ease: "none" });
      beat(1);
    },
  });
  return (
    <svg role="img" aria-label="Units">
      <UnitGrid
        count={1000}
        reveal={state.reveal}
        recolor={1}
        colorBy={(_, i) =>
          `color-mix(in oklab, ${ink("rose", 2)} ${rippleProgress(state.ripple, unitCellCenter(i, {}), { x: 0, y: 0 }, 0.6, { reach: 1300, seed: "waffle", index: i }) * 100}%, ${ink("slate", 2)})`
        }
      />
    </svg>
  );
}
it.each([
  { context: "overview" as const, click: 1 },
  { instant: true, click: 1 },
])("settles the parent's ripple for %j", async (options) => {
  await setup(Waffle, options);
  await tick(0);
  expect(body(999).getAttribute("fill")).toContain(`${ink("rose", 2)} 100%`);
  expect(cells().every((c) => getComputedStyle(c).opacity === "1")).toBe(true);
});
it("replays the external ripple forward after seeking back without partial cells", async () => {
  const app = await setup(Waffle);
  await tick(DUR.bloom);
  await app.next();
  await tick(DUR.bloom / 2);
  expect(body().getAttribute("fill")).not.toBe(body(999).getAttribute("fill"));
  await tick(DUR.bloom / 2);
  const end = body(999).getAttribute("fill");
  expect(end).toContain(`${ink("rose", 2)} 100%`);
  await app.previous();
  await tick(DUR.bloom);
  expect(body(999).getAttribute("fill")).toContain(`${ink("rose", 2)} 0%`);
  await app.next();
  await tick(DUR.bloom);
  expect(body(999)).toHaveAttribute("fill", end);
  expect(cells().every((c) => getComputedStyle(c).opacity === "1")).toBe(true);
});
it("stops changing the grid while the slide is inactive", async () => {
  const app = await setup(Waffle);
  await app.next();
  await tick(DUR.bloom / 4);
  const drawn = body();
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  const end = drawn.getAttribute("fill");
  await tick(DUR.bloom);
  expect(drawn).toHaveAttribute("fill", end);
});

function Gather({ gridRef }: { gridRef: Ref<UnitGridHandle> }) {
  const state = useTween({ collapse: 0 });
  useStage({
    copy: [{ lead: "Start" }, { lead: "Gather" }],
    beats: (tl, beat) => {
      beat(0);
      tl.to(state, { collapse: 1, duration: DUR.gather, ease: "none" });
      beat(1);
    },
  });
  return (
    <svg role="img" aria-label="Units">
      <UnitGrid count={3} collapse={state.collapse} collapseStagger={0.5} ref={gridRef} />
    </svg>
  );
}
it("updates arrived while a parent timeline gathers the cells", async () => {
  const ref = createRef<UnitGridHandle>();
  const app = await setup(() => <Gather gridRef={ref} />);
  expect(ref.current?.arrived).toBe(0);
  await app.next();
  await tick(DUR.gather);
  expect(ref.current?.arrived).toBe(3);
  expect(alpha()).toBe(0);
});
