import { useTween } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, expect, it } from "vitest";
import {
  DUR,
  InkPing,
  ink,
  installTheme,
  resolveTheme,
  STORY_STYLE,
  STROKE,
  useStage,
} from "../index";
import { setup, tick } from "../kit.test-support";

installTheme(resolveTheme());
afterEach(() => {
  STORY_STYLE.ink = "clean";
});
async function draw(props: Partial<ComponentProps<typeof InkPing>> = {}) {
  return setup(() => (
    <svg role="img" aria-label="Ping">
      <InkPing x={100} y={200} progress={0.5} {...props} />
    </svg>
  ));
}
function rings() {
  return Array.from(screen.getByRole("img", { name: "Ping" }).children);
}
function ring() {
  const element = rings()[0];
  if (!element) throw new Error("Missing drawn focus ring");
  return element;
}
function scaleOf(element: Element) {
  const match = /scale\(([\d.]+)\)/.exec(element.getAttribute("transform") ?? "");
  if (!match?.[1]) throw new Error(`No scale in "${element.getAttribute("transform")}"`);
  return Number(match[1]);
}
function opacityOf(element: Element) {
  return Number(getComputedStyle(element).opacity);
}
function shape() {
  const element = ring().children[0]?.children[0];
  if (!element) throw new Error("Missing ring shape");
  return element;
}
it("is invisible at its default progress", async () => {
  await draw({ progress: undefined });
  expect(rings()).toHaveLength(0);
});
it.each([0, 1])("draws no ring at progress %s", async (progress) => {
  await draw({ progress });
  expect(rings()).toHaveLength(0);
});
it("draws a growing circle at intermediate progress", async () => {
  await draw();
  expect(shape().tagName).toBe("circle");
  expect(shape()).toHaveAttribute("r", "10");
  expect(shape()).toHaveAttribute("stroke-width", String(STROKE.line));
  expect(ring().getAttribute("transform")).toContain("translate(100 200)");
  expect(scaleOf(ring())).toBeGreaterThan(1);
  expect(opacityOf(ring())).toBeGreaterThan(0);
  expect(opacityOf(ring())).toBeLessThan(1);
});
it.each([
  ["x", { x: 300 }, "translate(300 200)"],
  ["y", { y: 400 }, "translate(100 400)"],
] as const)("centers the ring at %s", async (_, props, position) => {
  await draw(props);
  expect(ring().getAttribute("transform")).toContain(position);
});
it("uses the requested circle radius", async () => {
  await draw({ r: 42 });
  expect(shape()).toHaveAttribute("r", "42");
});
it("uses width to select a square centered about the target", async () => {
  await draw({ width: 40, r: 99 });
  expect(shape().tagName).toBe("rect");
  expect(shape()).toHaveAttribute("width", "40");
  expect(shape()).toHaveAttribute("height", "40");
  expect(shape()).toHaveAttribute("x", "-20");
  expect(ring().getAttribute("transform")).toContain("translate(120 220)");
});
it("uses height independently for a rectangular target", async () => {
  await draw({ width: 40, height: 80 });
  expect(shape()).toHaveAttribute("height", "80");
  expect(shape()).toHaveAttribute("y", "-40");
  expect(ring().getAttribute("transform")).toContain("translate(120 240)");
});
it("rounds rectangle corners with rx", async () => {
  await draw({ width: 40, rx: 8 });
  expect(shape()).toHaveAttribute("rx", "8");
});
it("uses the requested hue", async () => {
  await draw({ hue: "rose" });
  expect(shape()).toHaveAttribute("stroke", ink("rose", 3));
});
it("uses the requested ramp step", async () => {
  await draw({ step: 1 });
  expect(shape()).toHaveAttribute("stroke", ink("cyan", 1));
});
it("lets explicit color override the hue and step", async () => {
  await draw({ hue: "rose", step: 1, color: "var(--od-amber)" });
  expect(shape()).toHaveAttribute("stroke", "var(--od-amber)");
});
it("uses a hairline envelope and a trailing echo in beacon mode", async () => {
  const plain = await draw();
  const plainScale = scaleOf(ring());
  const plainOpacity = opacityOf(ring());
  plain.unmount();
  await draw({ beacon: true });
  expect(rings()).toHaveLength(2);
  expect(shape()).toHaveAttribute("stroke-width", String(STROKE.rule));
  expect(opacityOf(ring())).toBeLessThan(plainOpacity);
  expect(scaleOf(ring())).toBeGreaterThan(plainScale);
  expect(opacityOf(rings()[1] ?? ring())).toBeGreaterThan(0);
});
it("does not draw a beacon echo before its lag", async () => {
  await draw({ beacon: true, progress: 0.2 });
  expect(rings()).toHaveLength(1);
});
it("uses a glow only in clean style", async () => {
  const clean = await draw();
  expect(ring().children[0]).toHaveAttribute("filter", "var(--od-filter-glow)");
  clean.unmount();
  STORY_STYLE.ink = "marker";
  await draw();
  expect(ring().children[0]).not.toHaveAttribute("filter");
});

function Focus() {
  const state = useTween({ ping: 0 });
  useStage({
    copy: [{ lead: "Start" }, { lead: "Focus" }],
    beats: (tl, beat) => {
      beat(0);
      tl.to(state, { ping: 1, duration: DUR.grow, ease: "none" });
      beat(1);
    },
  });
  return (
    <svg role="img" aria-label="Ping">
      <InkPing x={100} y={200} progress={state.ping} />
    </svg>
  );
}
it.each([
  { context: "overview" as const, click: 1 },
  { instant: true, click: 1 },
])("settles with no repeating ring for %j", async (options) => {
  await setup(Focus, options);
  await tick(0);
  expect(rings()).toHaveLength(0);
  await tick(DUR.grow * 3);
  expect(rings()).toHaveLength(0);
});
it("pings once during the parent's duration and disappears at its endpoint", async () => {
  const app = await setup(Focus);
  await app.next();
  await tick(DUR.grow / 2);
  expect(rings()).toHaveLength(1);
  expect(getComputedStyle(ring()).opacity).toBe("0.45");
  await tick(DUR.grow / 2);
  expect(rings()).toHaveLength(0);
  await tick(DUR.grow * 3);
  expect(rings()).toHaveLength(0);
});
it("stops the ping when the slide becomes inactive", async () => {
  const app = await setup(Focus);
  await app.next();
  await tick(DUR.grow / 2);
  const svg = screen.getByRole("img", { name: "Ping" });
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  expect(svg.children).toHaveLength(0);
  await tick(DUR.grow);
  expect(svg.children).toHaveLength(0);
});
