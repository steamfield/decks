import { act, screen } from "@testing-library/react";
import { type ComponentProps, useRef } from "react";
import { beforeEach, expect, it, onTestFinished } from "vitest";
import { brushRibbon } from "./brush";
import { DUR } from "./easings";
import { FILTER_IDS, filterUrl } from "./filters";
import { InkRule, type RuleHandle } from "./ink-rule";
import { inkStyle, STORY_STYLE, STROKE } from "./ink-style";
import { setup, tick } from "./kit.test-support";
import { useStage } from "./stage";
import { ink, installTheme, resolveTheme } from "./theme";

beforeEach(() => {
  installTheme(resolveTheme());
  const old = inkStyle();
  onTestFinished(() => {
    STORY_STYLE.ink = old;
  });
});

function rule(props: Partial<ComponentProps<typeof InkRule>> = {}) {
  return () => <Baseline {...props} />;
}
function Baseline({
  delay = false,
  onRoot,
  ...props
}: Partial<ComponentProps<typeof InkRule>> & {
  delay?: boolean;
  onRoot?: (root: SVGGElement | null) => void;
}) {
  const ref = useRef<RuleHandle>(null);
  useStage({
    copy: [{ lead: "Wait" }, { lead: "Draw" }, { lead: "Done" }, { lead: "Done" }],
    beats(tl, beat) {
      onRoot?.(ref.current?.root ?? null);
      beat(0);
      if (delay) tl.to({}, { duration: DUR.card });
      ref.current?.addDraw(tl, delay ? ">" : 0);
      beat(1);
      beat(2);
      beat(3);
    },
  });
  return (
    <svg role="img" aria-label="Baseline">
      <InkRule x1={20} x2={400} y={100} {...props} ref={ref} />
    </svg>
  );
}

function root() {
  const element = screen.getByRole("img", { name: "Baseline", hidden: true }).firstElementChild;
  if (!(element instanceof SVGElement)) throw new Error("Missing baseline SVG group");
  return element;
}

function clipping() {
  return getComputedStyle(root()).clipPath;
}

it.each([{ context: "overview" as const }, { instant: true }])(
  "renders a finished rule for the current click: %j",
  async (options) => {
    await setup(rule(), { ...options, click: 1 });
    expect(clipping()).toBe("inset(0px 0% 0px 0px)");
    await tick(DUR.draw);
    expect(clipping()).toBe("inset(0px 0% 0px 0px)");
  },
);

it("adds a draw to the caller timeline and finishes at DUR.draw", async () => {
  const app = await setup(rule());
  expect(clipping()).toBe("inset(0px 100% 0px 0px)");
  await app.next();
  await tick(DUR.draw / 2);
  const clip = Number.parseFloat(clipping().split(" ")[1] ?? "");
  expect(clip).toBeGreaterThan(0);
  expect(clip).toBeLessThan(100);
  await tick(DUR.draw / 2);
  expect(clipping()).toBe("inset(0px 0% 0px 0px)");
});

it.each(["x1", "x2", "y", "hue", "step", "opacity"] as const)("draws the %s prop", async (prop) => {
  await setup(
    rule({
      x1: prop === "x1" ? 60 : 20,
      x2: prop === "x2" ? 800 : 400,
      y: prop === "y" ? 200 : 100,
      hue: prop === "hue" ? "rose" : "slate",
      step: prop === "step" ? 4 : 1,
      opacity: prop === "opacity" ? 0.8 : 0.55,
    }),
    { click: 1, instant: true },
  );
  const line = root().getElementsByTagName("line")[0];
  expect(line?.getAttribute("stroke-width")).toBe(String(STROKE.rule));
  if (prop === "x1") expect(line?.getAttribute("x1")).toBe("60");
  if (prop === "x2") expect(line?.getAttribute("x2")).toBe("800");
  if (prop === "y") {
    expect(line?.getAttribute("y1")).toBe("200");
    expect(line?.getAttribute("y2")).toBe("200");
  }
  if (prop === "hue") expect(root()).toHaveStyle({ color: ink("rose", 1) });
  if (prop === "step") expect(root()).toHaveStyle({ color: ink("slate", 4) });
  if (prop === "opacity") expect(root()).toHaveStyle({ opacity: "0.8" });
});

it.each(["seed", "width"] as const)("draws the marker ribbon using its %s prop", async (prop) => {
  STORY_STYLE.ink = "marker";
  const seed = prop === "seed" ? "another-rule" : "ink-rule";
  const width = prop === "width" ? 12 : 2.6;
  await setup(rule({ seed, width }), { click: 1, instant: true });
  const expected = brushRibbon(
    [
      { x: 20, y: 100 },
      { x: 400, y: 100 },
    ],
    {
      seed: `${seed}:100`,
      width,
      taperIn: 0.02,
      taperOut: 0.02,
      startWidth: 0.7,
      endWidth: 0.7,
      wobble: 0.7,
      edge: 0.4,
    },
  );
  expect(Array.from(root().getElementsByTagName("path"), (path) => path.getAttribute("d"))).toEqual(
    expected.map((dab) => dab.d),
  );
  expect(root().firstElementChild?.getAttribute("filter")).toBe(filterUrl(FILTER_IDS.rule));
});

it("exposes its SVG root and preserves the requested timeline position", async () => {
  let exposed: SVGGElement | null = null;
  const app = await setup(() => (
    <Baseline
      delay
      onRoot={(root) => {
        exposed = root;
      }}
    />
  ));
  expect(exposed).toBe(root());
  await app.next();
  await tick(DUR.card);
  expect(clipping()).toBe("inset(0px 100% 0px 0px)");
  await tick(DUR.draw);
  expect(clipping()).toBe("inset(0px 0% 0px 0px)");
});

it("settles when inactive and seeks correctly after a direct jump", async () => {
  const app = await setup(rule());
  await app.next();
  await tick(DUR.draw / 2);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  expect(clipping()).toBe("inset(0px 0% 0px 0px)");
  await tick(DUR.draw);
  expect(clipping()).toBe("inset(0px 0% 0px 0px)");
  await act(async () => app.store.dispatch({ type: "go", slide: 1, click: 3 }));
  expect(clipping()).toBe("inset(0px 0% 0px 0px)");
});
