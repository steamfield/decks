import { gsap, useTween } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import { type ComponentProps, createRef, type RefObject, useLayoutEffect, useRef } from "react";
import { beforeEach, expect, it } from "vitest";
import { DUR } from "./easings";
import { STORY_STYLE } from "./ink-style";
import { InkTimeline, type TimelineHandle, type TimelineTick } from "./ink-timeline";
import { setup, tick } from "./kit.test-support";
import { useStage } from "./stage";
import { ink, installTheme, resolveTheme } from "./theme";

beforeEach(() => {
  installTheme(resolveTheme());
  STORY_STYLE.ink = "clean";
});
const ticks: TimelineTick[] = [
  { id: "a", at: 0, label: "Earlier" },
  { id: "b", at: 5, label: "Latest", bright: true, projected: true },
];
const base: ComponentProps<typeof InkTimeline> = {
  ticks,
  domain: [0, 10],
  range: [200, 1200],
  y: 400,
};
const image = () => screen.getByRole("img", { name: "Dates" });
const lines = () => image().getElementsByTagName("line");
const group = () => screen.getByText("Earlier").parentElement;
function Timeline() {
  return (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} />
    </svg>
  );
}
function OwnedTimeline() {
  const state = useTween({ ink: 0.5, lift: 0.5 });
  return (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} state={[state, { ink: 1, lift: 0 }]} />
    </svg>
  );
}
function AnimatedTimeline({ handle }: { handle: RefObject<TimelineHandle | null> }) {
  useLayoutEffect(() => {
    const tl = gsap.timeline();
    handle.current?.addInk(tl, 0);
    handle.current?.addLift(tl, "a");
    handle.current?.addLift(tl, "missing");
    return () => {
      tl.kill();
    };
  }, [handle]);
  return (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ref={handle} />
    </svg>
  );
}
function DrivenTickState() {
  const handle = useRef<TimelineHandle>(null);
  useLayoutEffect(() => {
    const tl = gsap.timeline();
    const state = handle.current?.state[0];
    if (state) tl.to(state, { ink: 1, duration: DUR.draw });
    return () => {
      tl.kill();
    };
  }, []);
  return (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ref={handle} />
    </svg>
  );
}
function PartlyInkedTimeline() {
  const state = useTween({ ink: 0.5, lift: 0 });
  const handle = useRef<TimelineHandle>(null);
  useLayoutEffect(() => {
    const tl = gsap.timeline();
    handle.current?.addInk(tl, DUR.card);
    return () => {
      tl.kill();
    };
  }, []);
  return (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ref={handle} state={[state, { ink: 1, lift: 0 }]} />
    </svg>
  );
}
function StageTimeline({ direct = false }: { direct?: boolean }) {
  const handle = useRef<TimelineHandle>(null);
  useStage({
    copy: [{ lead: "Before" }, { lead: "Inked" }, { lead: "Lifted" }],
    beats: (tl, beat) => {
      beat(0);
      if (direct) {
        const state = handle.current?.state[0];
        if (state) tl.to(state, { ink: 1, duration: DUR.draw });
      } else handle.current?.addInk(tl);
      beat(1);
      handle.current?.addLift(tl, "a");
      beat(2);
    },
  });
  return (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ref={handle} />
    </svg>
  );
}
it.each([{ context: "overview" as const }, { instant: true }])(
  "renders settled ticks in %j",
  async (options) => {
    await setup(Timeline, options);
    expect(group()).toHaveStyle({ opacity: 1 });
    expect(lines().item(0)).toHaveAttribute("x1", "160");
    expect(lines().item(0)).toHaveAttribute("x2", "1240");
    expect(screen.getByText("Latest").parentElement).toHaveStyle({ color: ink("cyan", 4) });
  },
);
it.each([
  ["domain", { domain: [0, 20] }, 2, "x1", "450"],
  ["range", { range: [100, 500] }, 2, "x1", "300"],
  ["y", { y: 500 }, 0, "y1", "500"],
  ["tickHeight", { tickHeight: 100 }, 1, "y2", "334"],
  ["tickWidth", { tickWidth: 8 }, 1, "stroke-width", "8"],
  ["ticks", { ticks: [{ id: "c", at: 2, label: "Other" }] }, 1, "x1", "400"],
] satisfies [string, Partial<ComponentProps<typeof InkTimeline>>, number, string, string][])(
  "uses %s for tick geometry",
  async (_, props, index, attribute, value) => {
    await setup(() => (
      <svg role="img" aria-label="Dates">
        <InkTimeline {...base} {...props} />
      </svg>
    ));
    expect(lines().item(index)).toHaveAttribute(attribute, value);
  },
);
it.each([
  ["hue", { hue: "amber" }, "Earlier", () => ink("amber", 2)],
  ["step", { step: 1 }, "Earlier", () => ink("cyan", 1)],
  ["brightStep", { brightStep: 3 }, "Latest", () => ink("cyan", 3)],
] satisfies [string, Partial<ComponentProps<typeof InkTimeline>>, string, () => string][])(
  "uses %s for the tick ink",
  async (_, props, text, color) => {
    await setup(() => (
      <svg role="img" aria-label="Dates">
        <InkTimeline {...base} {...props} />
      </svg>
    ));
    expect(screen.getByText(text).parentElement).toHaveStyle({ color: color() });
  },
);
it("marks future dates with dots and gives bright ticks their full height", async () => {
  await setup(Timeline);
  expect(lines().item(1)).not.toHaveAttribute("stroke-dasharray");
  expect(lines().item(2)).toHaveAttribute("stroke-dasharray", "0 10");
  expect(lines().item(2)).toHaveAttribute("y2", "326");
});
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
  expect(screen.getByText("First long date")).toHaveAttribute("y", "446");
  expect(screen.getByText("Second long date")).toHaveAttribute("y", "484");
});
it.each([
  ["labelGap", { labelGap: 300 }, "Later", "484"],
  ["labelOffset", { labelOffset: 60 }, "Earlier", "460"],
  ["rowHeight", { rowHeight: 60, ticks: crowded }, "Second long date", "506"],
  ["labelRows", { labelRows: 1, ticks: crowded }, "Second long date", "446"],
] satisfies [string, Partial<ComponentProps<typeof InkTimeline>>, string, string][])(
  "uses %s for label placement",
  async (_, props, label, expected) => {
    const spaced = [
      { id: "a", at: 0, label: "Earlier" },
      { id: "b", at: 3, label: "Later" },
    ];
    await setup(() => (
      <svg role="img" aria-label="Dates">
        <InkTimeline {...base} ticks={spaced} {...props} />
      </svg>
    ));
    expect(screen.getByText(label)).toHaveAttribute("y", expected);
  },
);
it("uses labelSize in both text and collision spacing", async () => {
  await setup(() => (
    <svg role="img" aria-label="Dates">
      <InkTimeline {...base} ticks={crowded} labelSize={8} />
    </svg>
  ));
  expect(screen.getByText("First long date")).toHaveStyle({ fontSize: "8px" });
  expect(screen.getByText("Second long date")).toHaveAttribute("y", "446");
});
it("respects caller-owned ink and lift state", async () => {
  await setup(OwnedTimeline, { context: "print" });
  expect(group()).toHaveStyle({ opacity: 0.5 });
  expect(group()?.firstElementChild).toHaveStyle({ opacity: 0.5, transform: "scale(0.625)" });
});
it("draws deterministic marker ribbons in marker mode", async () => {
  STORY_STYLE.ink = "marker";
  await setup(Timeline);
  expect(image().getElementsByTagName("path").length).toBeGreaterThan(0);
  expect(lines()).toHaveLength(1);
  expect(image().getElementsByTagName("path").item(0)).toHaveAttribute("fill", "currentColor");
});
it("renders updates when a caller tweens the exposed tick state directly", async () => {
  await setup(DrivenTickState);
  expect(group()).toHaveStyle({ opacity: 0 });
  await tick(DUR.draw / 2);
  expect(Number(group()?.style.opacity)).toBeGreaterThan(0);
  expect(Number(group()?.style.opacity)).toBeLessThan(1);
  await tick(DUR.draw / 2);
  expect(group()).toHaveStyle({ opacity: 1 });
});
it("inks from the caller's current state without clearing ticks ahead of a future tween", async () => {
  await setup(PartlyInkedTimeline);
  expect(group()).toHaveStyle({ opacity: 0.5 });
  expect(screen.getByText("Latest").parentElement).toHaveStyle({ opacity: 1 });
  await tick(DUR.card + DUR.draw + DUR.tick);
  expect(group()).toHaveStyle({ opacity: 1 });
});
it.each([
  { context: "overview" as const, click: 0 },
  { instant: true, click: 0 },
  { context: "overview" as const, click: 1 },
])("seeks directly exposed state to its current click in %j", async (options) => {
  await setup(() => <StageTimeline direct />, options);
  expect(group()).toHaveStyle({ opacity: options.click });
});
it("inks at DUR.draw plus the tick cadence, lifts over DUR.morph, and exposes tick coordinates", async () => {
  const handle = createRef<TimelineHandle>();
  await setup(() => <AnimatedTimeline handle={handle} />);
  expect(group()).toHaveStyle({ opacity: 0 });
  expect(handle.current?.tickX("b")).toBe(700);
  expect(handle.current?.tickX("missing")).toBe(200);
  await tick(DUR.draw);
  expect(group()).toHaveStyle({ opacity: 1 });
  expect(Number(screen.getByText("Latest").parentElement?.style.opacity)).toBeLessThan(1);
  await tick(DUR.tick);
  expect(screen.getByText("Latest").parentElement).toHaveStyle({ opacity: 1 });
  await tick(DUR.morph);
  expect(group()?.firstElementChild).toHaveStyle({ opacity: 0, transform: "scale(0.25)" });
  expect(screen.getByText("Earlier")).toBeVisible();
});
it.each([{ context: "overview" as const }, { instant: true }])(
  "settles at the current tick beat in %j",
  async (options) => {
    await setup(StageTimeline, { ...options, click: 1 });
    expect(group()).toHaveStyle({ opacity: 1 });
    expect(group()?.firstElementChild).toHaveStyle({ opacity: 1 });
    await tick(DUR.morph);
    expect(group()?.firstElementChild).toHaveStyle({ opacity: 1 });
  },
);
it("seeks ink and lift backward and stops updating when inactive", async () => {
  const app = await setup(StageTimeline);
  await app.next();
  await tick(DUR.draw + DUR.tick);
  await app.next();
  await tick(DUR.morph);
  expect(group()?.firstElementChild).toHaveStyle({ opacity: 0 });
  await app.previous();
  await tick(DUR.morph / 2);
  const mark = group()?.firstElementChild;
  if (!mark) throw new Error("Missing earlier tick mark");
  expect(Number(getComputedStyle(mark).opacity)).toBeGreaterThan(0);
  expect(Number(getComputedStyle(mark).opacity)).toBeLessThan(1);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  const before = group()?.firstElementChild?.getAttribute("style");
  await tick(DUR.morph);
  expect(group()?.firstElementChild?.getAttribute("style")).toBe(before);
});
