import { gsap } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import { type ComponentProps, createRef, type RefObject, useLayoutEffect, useRef } from "react";
import { beforeEach, expect, it } from "vitest";
import { DUR } from "./easings";
import { InkLine, type LineHandle } from "./ink-line";
import { STORY_STYLE, STROKE } from "./ink-style";
import { setup, tick } from "./kit.test-support";
import { useScriptedDemo } from "./scripted-demo";
import { useStage } from "./stage";
import { ink, installTheme, resolveTheme, theme } from "./theme";

let lineHandle = createRef<LineHandle>();
beforeEach(() => {
  installTheme(resolveTheme());
  STORY_STYLE.ink = "clean";
  lineHandle = createRef<LineHandle>();
  base.ref = lineHandle;
});
const base: ComponentProps<typeof InkLine> = {
  series: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 0 },
  ],
  xDomain: [0, 2],
  yDomain: [0, 1],
  xRange: [100, 500],
  yRange: [400, 200],
};
const image = () => screen.getByRole("img", { name: "Series" });
const path = () => image().getElementsByTagName("path").item(0);
const clip = () => lineHandle.current?.root?.style.getPropertyValue("--od-clip");
const root = () => lineHandle.current?.root;
function Line() {
  return (
    <svg role="img" aria-label="Series">
      <InkLine {...base} dots />
    </svg>
  );
}
function LineFixture({
  change = {},
  initial = {},
  build,
  handle,
}: {
  change?: Partial<ComponentProps<typeof InkLine>>;
  initial?: Partial<ComponentProps<typeof InkLine>>;
  build?: (line: LineHandle, tl: gsap.core.Timeline) => void;
  handle?: RefObject<LineHandle | null>;
}) {
  const { clicks } = useScriptedDemo();
  const line = handle ?? lineHandle;
  const builder = useRef(build);
  useLayoutEffect(() => {
    if (!builder.current || !line.current) return;
    const tl = gsap.timeline();
    builder.current(line.current, tl);
    return () => {
      tl.kill();
    };
  }, [line]);
  return (
    <svg role="img" aria-label="Series">
      <InkLine {...base} {...initial} {...(clicks ? change : {})} ref={line} />
    </svg>
  );
}
function StageLine() {
  const line = lineHandle;
  const { playCount } = useStage({
    copy: [{ lead: "Start" }, { lead: "Drawn" }],
    beats: (tl, beat) => {
      beat(0);
      line.current?.addDraw(tl);
      beat(1);
    },
  });
  return (
    <svg role="img" aria-label="Series">
      <g key={playCount}>
        <text>Furniture</text>
      </g>
      <InkLine {...base} dots ref={line} />
    </svg>
  );
}
it.each([{ context: "overview" as const }, { instant: true }])(
  "renders a fully drawn standalone line in %j",
  async (options) => {
    await setup(Line, options);
    expect(path()).toHaveAttribute("d", "M100 400L300 200L500 400");
    expect(path()).toHaveAttribute("stroke-width", String(STROKE.line));
    expect(clip()).toBe("0%");
    expect(image().getElementsByTagName("circle")).toHaveLength(3);
  },
);

it.each([
  [
    "series",
    {
      series: [
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ],
    },
    "M100 200L500 200",
  ],
  ["xDomain", { xDomain: [0, 4] }, "M100 400L200 200L300 400"],
  ["yDomain", { yDomain: [0, 2] }, "M100 400L300 300L500 400"],
  ["xRange", { xRange: [0, 200] }, "M0 400L100 200L200 400"],
  ["yRange", { yRange: [200, 0] }, "M100 200L300 0L500 200"],
  ["interp", { interp: "step" }, "M100 400L300 400L300 200L500 200L500 400"],
  ["reveal", { reveal: 0.5 }, "M100 400L300 200"],
] satisfies [string, Partial<ComponentProps<typeof InkLine>>, string][])(
  "redraws SVG geometry when %s changes",
  async (_, changed, expected) => {
    const app = await setup(() => <LineFixture change={changed} />, { instant: true });
    await app.next();
    expect(path()).toHaveAttribute("d", expected);
  },
);
it.each([
  ["hue", { hue: "rose" }, () => ink("rose", 3)],
  ["step", { step: 1 }, () => ink("cyan", 1)],
  ["color", { color: "rgb(102, 51, 153)" }, () => "rgb(102, 51, 153)"],
  ["ghost", { ghost: true }, () => ink("slate", 1)],
] satisfies [string, Partial<ComponentProps<typeof InkLine>>, () => string][])(
  "uses %s to select the series ink",
  async (_, props, expected) => {
    await setup(() => (
      <svg role="img" aria-label="Series">
        <InkLine {...base} {...props} />
      </svg>
    ));
    expect(root()).toHaveStyle({ color: expected() });
  },
);
it("blends numeric ghost opacity without a CSS transition", async () => {
  await setup(() => (
    <svg role="img" aria-label="Series">
      <InkLine {...base} ghost={0.5} />
    </svg>
  ));
  const body = image().getElementsByTagName("g").item(2);
  expect(body?.style.opacity).toBe(String(1 - (1 - Number(theme().shape.dim)) * 0.5));
  expect(body?.style.transition).toBe("none");
});
it("follows a recolored ramp", async () => {
  const recolored = resolveTheme({ ramps: { cyan: resolveTheme().ramps.rose } });
  installTheme(recolored);
  await setup(Line);
  expect(root()).toHaveStyle({ color: recolored.ramps.cyan[2] });
});
it.each(["seed", "width"] as const)("rebuilds marker ribbons when %s changes", async (prop) => {
  STORY_STYLE.ink = "marker";
  const app = await setup(
    () => (
      <LineFixture
        initial={{ width: 18 }}
        change={prop === "seed" ? { seed: "other" } : { width: 40 }}
      />
    ),
    { instant: true },
  );
  const before = path()?.getAttribute("d");
  await app.next();
  expect(path()?.getAttribute("d")).not.toBe(before);
  expect(path()).toHaveAttribute("fill", "currentColor");
});
it("adds dots only when requested", async () => {
  await setup(() => (
    <svg role="img" aria-label="Series">
      <InkLine {...base} />
    </svg>
  ));
  expect(image().getElementsByTagName("circle")).toHaveLength(0);
});
it("draws on the caller timeline and erases after the hold, then settle restores it", async () => {
  const handle = lineHandle;
  await setup(() => (
    <LineFixture
      handle={handle}
      initial={{ dots: true }}
      build={(line, tl) => {
        line.addDraw(tl);
        line.addErase(tl);
      }}
    />
  ));
  expect(clip()).toBe("100%");
  expect(image().getElementsByTagName("circle")).toHaveLength(0);
  await tick(DUR.grow / 2);
  expect(Number.parseFloat(clip() ?? "0")).toBeGreaterThan(0);
  await tick(DUR.grow / 2);
  expect(clip()).toBe("0%");
  await tick(DUR.eraseDelay + DUR.opacity);
  expect(root()?.style.opacity).toBe("0");
  await tick(DUR.eraseHold);
  expect(clip()).toBe("100%");
  expect(root()?.style.opacity).toBe("1");
  await act(async () => handle.current?.settle());
  expect(clip()).toBe("0%");
});
it("honors draw duration and ease overrides and shows a head only during the sweep", async () => {
  await setup(() => (
    <LineFixture
      initial={{ head: true }}
      build={(line, tl) => {
        line.addDraw(tl, 0, { duration: DUR.trace, ease: "none" });
      }}
    />
  ));
  await tick(DUR.trace / 2);
  expect(clip()).toBe("50%");
  expect(image().getElementsByTagName("circle")).toHaveLength(1);
  await tick(DUR.trace / 2);
  expect(clip()).toBe("0%");
  expect(image().getElementsByTagName("circle")).toHaveLength(0);
});
it.each([{ context: "overview" as const }, { instant: true }])(
  "seeks the current click without a sweep in %j",
  async (options) => {
    await setup(StageLine, { ...options, click: 1 });
    expect(clip()).toBe("0%");
    await tick(DUR.grow);
    expect(clip()).toBe("0%");
  },
);
it("keeps handle targets alive through re-entry while replay furniture remounts", async () => {
  const app = await setup(StageLine);
  await app.next();
  await tick(DUR.grow);
  expect(clip()).toBe("0%");
  const held = root();
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  await tick(DUR.grow);
  expect(held?.style.getPropertyValue("--od-clip")).toBe("0%");
  await act(async () => app.store.dispatch({ type: "go", slide: 1 }));
  expect(clip()).toBe("100%");
  await app.next();
  await tick(DUR.grow);
  expect(clip()).toBe("0%");
});
it("settles a running draw when the slide becomes inactive", async () => {
  const app = await setup(StageLine);
  await app.next();
  await tick(DUR.grow / 2);
  expect(Number.parseFloat(clip() ?? "0")).toBeGreaterThan(0);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  const settled = clip();
  await tick(DUR.grow);
  expect(clip()).toBe(settled);
});
