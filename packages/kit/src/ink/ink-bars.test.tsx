import { gsap } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import { type ComponentProps, createRef, useLayoutEffect, useRef } from "react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { useScriptedDemo } from "../story/scripted-demo";
import { useStage } from "../story/stage";
import { DUR } from "../theme/easings";
import { ink, installTheme, resolveTheme } from "../theme/theme";
import { type BarsHandle, type InkBarRow, InkBars } from "./ink-bars";
import { STORY_STYLE } from "./ink-style";

beforeEach(() => {
  installTheme(resolveTheme());
  STORY_STYLE.ink = "clean";
});
const rows: InkBarRow[] = [
  { id: "a", label: "Alpha", value: 2 },
  { id: "b", label: "Beta", value: 8 },
];
const base: ComponentProps<typeof InkBars> = {
  rows,
  domain: [0, 10],
  xRange: [500, 1500],
  yBand: [200, 400],
};
const image = () => screen.getByRole("img", { name: "Bars" });
const rects = () => image().getElementsByTagName("rect");
function Bars({ props = {} }: { props?: Partial<ComponentProps<typeof InkBars>> }) {
  return (
    <svg role="img" aria-label="Bars">
      <InkBars {...base} {...props} />
    </svg>
  );
}
function BarsFixture({
  build,
  sort,
  seedOnClick = false,
}: {
  build?: (bars: BarsHandle, tl: gsap.core.Timeline) => void;
  sort?: "desc";
  seedOnClick?: boolean;
}) {
  const bars = useRef<BarsHandle>(null);
  const builder = useRef(build);
  const { clicks } = useScriptedDemo();
  useLayoutEffect(() => {
    if (!builder.current || !bars.current) return;
    const tl = gsap.timeline();
    builder.current(bars.current, tl);
    return () => {
      tl.kill();
    };
  }, []);
  return (
    <svg role="img" aria-label="Bars">
      <InkBars
        {...base}
        ref={bars}
        sort={sort}
        seed={seedOnClick && clicks ? "other" : "initial"}
      />
    </svg>
  );
}
function StageBars() {
  const bars = useRef<BarsHandle>(null);
  useStage({
    copy: [{ lead: "Zero" }, { lead: "Wait" }, { lead: "Grow" }],
    beats: (tl, beat) => {
      beat(0);
      tl.to({}, { duration: DUR.opacity });
      beat(1);
      bars.current?.addGrow(tl, ">");
      beat(2);
    },
  });
  return (
    <svg role="img" aria-label="Bars">
      <InkBars {...base} ref={bars} />
    </svg>
  );
}
it.each([{ context: "overview" as const }, { instant: true }])(
  "renders settled bars in %j",
  async (options) => {
    await setup(Bars, options);
    expect(screen.getByText("Alpha")).toBeVisible();
    expect(rects().item(0)).toHaveAttribute("width", "200");
    expect(rects().item(1)).toHaveAttribute("width", "800");
  },
);
it.each([
  ["domain", { domain: [0, 20] }, "width", "100"],
  ["xRange", { xRange: [200, 700] }, "width", "100"],
  ["thickness", { thickness: 40 }, "height", "40"],
  ["rows", { rows: [{ id: "c", label: "Gamma", value: 5 }] }, "width", "500"],
] satisfies [string, Partial<ComponentProps<typeof InkBars>>, string, string][])(
  "uses %s in the bar geometry",
  async (_, props, attribute, value) => {
    await setup(
      () => (
        <svg role="img" aria-label="Bars">
          <InkBars {...base} {...props} />
        </svg>
      ),
      { instant: true },
    );
    expect(rects().item(0)).toHaveAttribute(attribute, value);
  },
);
it("lays bars out inside the yBand", async () => {
  await setup(() => <Bars props={{ yBand: [400, 800] }} />, { instant: true });
  for (const [i, slot] of [
    [0, 400],
    [1, 600],
  ] as const) {
    const bar = rects().item(i);
    const y = Number(bar?.getAttribute("y"));
    expect(y).toBeGreaterThanOrEqual(slot);
    expect(y + Number(bar?.getAttribute("height"))).toBeLessThanOrEqual(slot + 200);
  }
});
it("sorts descending by moving the larger row to the first slot", async () => {
  await setup(() => <Bars props={{ sort: "desc" }} />, { instant: true });
  expect(Number(rects().item(0)?.getAttribute("y"))).toBeGreaterThan(
    Number(rects().item(1)?.getAttribute("y")),
  );
});
it("uses ascending value order without changing the row identities", async () => {
  await setup(() => <Bars props={{ rows: [...rows].reverse(), sort: "asc" }} />, { instant: true });
  const alpha = Number(screen.getByText("Alpha").getAttribute("y"));
  const beta = Number(screen.getByText("Beta").getAttribute("y"));
  const slot = (base.yBand[1] - base.yBand[0]) / rows.length;
  expect(beta - alpha).toBeCloseTo(slot, 6);
  expect(alpha).toBeGreaterThan(base.yBand[0]);
  expect(beta).toBeLessThan(base.yBand[1] + slot);
});
it("uses labelGap to align the left labels", async () => {
  await setup(() => <Bars props={{ labelGap: 80 }} />, { instant: true });
  expect(screen.getByText("Alpha")).toHaveAttribute("x", "420");
});
it("exposes the label column left edge including labelWidth", async () => {
  const handle = createRef<BarsHandle>();
  await setup(() => <Bars props={{ ref: handle, labelWidth: 300 }} />, { instant: true });
  expect(handle.current?.labelLeft).toBe(160);
});
it("formats end values unless a row supplies its own text", async () => {
  await setup(
    () => (
      <Bars
        props={{
          rows: [
            { id: "a", label: "Alpha", value: 2, text: "Explicit" },
            { id: "b", label: "Beta", value: 8 },
          ],
          format: (value) => `${value}%`,
        }}
      />
    ),
    { instant: true },
  );
  expect(screen.getByText("Explicit")).toBeVisible();
  expect(screen.getByText("8%")).toBeVisible();
});
it.each([
  ["hue", { hue: "rose" }, () => ink("rose", 3)],
  ["step", { step: 1 }, () => ink("emerald", 1)],
  [
    "row hue and step",
    { rows: [{ id: "a", label: "Alpha", value: 2, hue: "amber", step: 4 }] },
    () => ink("amber", 4),
  ],
] satisfies [string, Partial<ComponentProps<typeof InkBars>>, () => string][])(
  "uses %s for bar ink",
  async (_, props, color) => {
    await setup(() => <Bars props={props} />, { instant: true });
    expect(screen.getByText("Alpha").parentElement).toHaveStyle({ color: color() });
  },
);
it("uses a recolored theme ramp", async () => {
  const recolored = resolveTheme({ ramps: { emerald: resolveTheme().ramps.violet } });
  installTheme(recolored);
  await setup(Bars, { instant: true });
  expect(screen.getByText("Alpha").parentElement).toHaveStyle({
    color: recolored.ramps.emerald[2],
  });
});
it("uses seed for marker geometry", async () => {
  STORY_STYLE.ink = "marker";
  const app = await setup(() => <BarsFixture seedOnClick />, { instant: true });
  const before = image().getElementsByTagName("path").item(0)?.getAttribute("d");
  await app.next();
  expect(image().getElementsByTagName("path").item(0)?.getAttribute("d")).not.toBe(before);
});
it("stacks close end labels with a gap instead of overlapping", async () => {
  await setup(
    () => (
      <svg role="img" aria-label="Bars">
        <InkBars {...base} yBand={[200, 220]} />
      </svg>
    ),
    { context: "overview" },
  );
  const a = Number(screen.getByText("2").getAttribute("y"));
  const b = Number(screen.getByText("8").getAttribute("y"));
  expect(b - a).toBeGreaterThan(20 / rows.length);
});
it("grows on the caller timeline over DUR.grow with optional row spread", async () => {
  await setup(() => (
    <BarsFixture
      build={(bars, tl) => {
        bars.addGrow(tl, 0, { spread: DUR.card });
      }}
    />
  ));
  expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  await tick(DUR.grow);
  expect(rects().item(0)).toHaveAttribute("width", "200");
  expect(Number(rects().item(1)?.getAttribute("width"))).toBeLessThan(800);
  await tick(DUR.card);
  expect(rects().item(1)).toHaveAttribute("width", "800");
});
it("reorders, rescales, recolors and exits reversibly", async () => {
  let timeline: gsap.core.Timeline | undefined;
  await setup(() => (
    <BarsFixture
      sort="desc"
      build={(bars, tl) => {
        timeline = tl;
        bars.addGrow(tl);
        bars.addReorder(
          tl,
          [
            { id: "a", label: "New alpha", value: 10 },
            { id: "b", label: "Beta", value: 2 },
          ],
          [0, 20],
          DUR.grow,
        );
        bars.addRecolor(tl, "a", ink("rose", 3));
        bars.addExit(tl, ["b", "absent"]);
        bars.addRecolor(tl, "absent", "red");
      }}
    />
  ));
  await tick(DUR.grow + DUR.scale);
  expect(screen.getByText("New alpha")).toBeVisible();
  expect(rects().item(0)).toHaveAttribute("width", "500");
  expect(rects().item(0)).toHaveAttribute("y", "238");
  await tick(DUR.color);
  expect(screen.getByText("New alpha").parentElement?.style.color).toContain("100%");
  expect(screen.getByText("New alpha").parentElement?.style.color).toContain(
    gsap.utils.splitColor(ink("rose", 3)).slice(0, 3).join(", "),
  );
  await tick(DUR.eraseDelay + DUR.opacity);
  expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  await act(async () => {
    timeline?.seek(DUR.grow).pause();
  });
  expect(screen.getByText("Beta")).toBeVisible();
  expect(rects().item(0)).toHaveAttribute("width", "200");
});
it("returns from beat two to the undrawn beat one without a full-bar flash", async () => {
  const app = await setup(StageBars, { click: 1 });
  expect(rects()).toHaveLength(0);
  await app.next();
  await tick(DUR.grow / 2);
  expect(Number(rects().item(0)?.getAttribute("width"))).toBeLessThan(200);
  await app.previous();
  await tick(DUR.grow);
  expect(rects()).toHaveLength(0);
});
it.each([{ context: "overview" as const }, { instant: true }])(
  "seeks the current bar beat immediately in %j",
  async (options) => {
    await setup(StageBars, { ...options, click: 2 });
    expect(rects().item(0)).toHaveAttribute("width", "200");
    await tick(DUR.grow);
    expect(rects().item(0)).toHaveAttribute("width", "200");
  },
);
it("stops changing an inactive slide", async () => {
  const app = await setup(StageBars);
  await app.next();
  await app.next();
  await tick(DUR.grow / 2);
  const drawn = rects().item(0);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  const before = drawn?.getAttribute("width");
  await tick(DUR.scale);
  expect(drawn?.getAttribute("width")).toBe(before);
});
