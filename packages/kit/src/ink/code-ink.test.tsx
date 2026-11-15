import { useTween } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import { type ComponentProps, useState } from "react";
import { beforeEach, expect, it, onTestFinished } from "vitest";
import { setup, tick } from "../kit.test-support";
import { useStage } from "../story/stage";
import { DRAW, DUR } from "../theme/easings";
import { ink, installTheme, resolveTheme } from "../theme/theme";
import { CodeInk } from "./code-ink";
import { STORY_STYLE } from "./ink-style";

beforeEach(() => {
  installTheme(resolveTheme());
  onTestFinished(() => {
    STORY_STYLE.ink = "clean";
  });
});

const box = { x: 192, y: 108, width: 960, height: 432 };
const firstLine = "SELECT 'one' FROM data";
const lines = [firstLine, "WHERE count > 0"];

function CodeBeat() {
  const value = useTween({ reveal: 0 });
  useStage({
    copy: [{ lead: "Zero" }, { lead: "One" }, { lead: "Two" }],
    beats(tl, beat) {
      beat(0);
      tl.to({}, { duration: DUR.draw });
      beat(1);
      tl.to(value, { reveal: 1, duration: DUR.grow, ease: DRAW });
      beat(2);
    },
  });
  return (
    <section aria-label="Code drawing">
      <CodeInk {...box} lines={lines} label="Query" lang="sql" reveal={value.reveal} />
    </section>
  );
}

const frame = () => screen.getByRole("region", { name: "Code drawing" }).querySelector("svg");

it.each([{ context: "overview" as const }, { instant: true }])(
  "shows the settled SQL and its frame for click 2 in %j",
  async (options) => {
    await setup(CodeBeat, { ...options, click: 2 });
    expect(screen.getByText("Query").parentElement).toHaveStyle({ opacity: "1" });
    expect(screen.getByText("SELECT")).toHaveStyle({ color: ink("slate", 2) });
    expect(screen.getByText("'one'")).toHaveStyle({ color: ink("amber", 3) });
    expect(frame()?.querySelector("g")).toHaveStyle({ clipPath: "inset(0 0% 0 0)" });
    await tick(DUR.grow);
    expect(screen.getByText("Query").parentElement).toHaveStyle({ opacity: "1" });
  },
);

it("inks the frame beneath the tokens on click 2 in DUR.grow", async () => {
  const app = await setup(CodeBeat);
  const code = screen.getByText("Query").parentElement;
  const mark = frame()?.querySelector("g");
  expect(code).toHaveStyle({ opacity: "0" });
  expect(mark).toHaveStyle({ clipPath: "inset(0 100% 0 0)" });
  await app.next();
  await tick(DUR.draw);
  expect(code).toHaveStyle({ opacity: "0" });
  await app.next();
  await tick(DUR.grow / 2);
  expect(mark).not.toHaveStyle({ clipPath: "inset(0 100% 0 0)" });
  expect(Number(code?.style.opacity)).toBeLessThan(1);
  await tick(DUR.grow / 2);
  expect(code).toHaveStyle({ opacity: "1" });
  expect(mark).toHaveStyle({ clipPath: "inset(0 0% 0 0)" });
});

function ChangingCode({
  initial,
  next,
}: {
  initial: Partial<ComponentProps<typeof CodeInk>>;
  next: Partial<ComponentProps<typeof CodeInk>>;
}) {
  const [props, setProps] = useState(initial);
  return (
    <>
      <button type="button" onClick={() => setProps(next)}>
        Change
      </button>
      <section aria-label="Code drawing">
        <CodeInk {...box} lines={lines} label="Query" {...props} />
      </section>
    </>
  );
}

async function change(initial: Partial<ComponentProps<typeof CodeInk>>, next: typeof initial) {
  const app = await setup(() => <ChangingCode initial={initial} next={next} />, { instant: true });
  return { ...app, change: () => app.user.click(screen.getByRole("button", { name: "Change" })) };
}

it("preserves every code line verbatim when lines change", async () => {
  const app = await change({}, { lines: ["  new row  ", "  new row  "] });
  await app.change();
  expect(screen.getAllByText("new row")).toHaveLength(2);
  expect(screen.getAllByText("new row")[0]?.textContent).toBe("  new row  ");
  expect(screen.queryByText(firstLine)).not.toBeInTheDocument();
});

it.each([
  ["x", 384, "left", "20%"],
  ["y", 216, "top", "20%"],
  ["width", 480, "width", "25%"],
  ["height", 216, "height", "20%"],
] as const)("positions the frame and code from %s", async (prop, value, style, expected) => {
  const app = await change({}, { [prop]: value });
  await app.change();
  expect(screen.getByText("Query").parentElement).toHaveStyle({ [style]: expected });
  expect(frame()?.querySelector("rect")).toHaveAttribute(prop, String(value));
});

it("changes the caption with label", async () => {
  const app = await change({}, { label: "Raw data" });
  await app.change();
  expect(screen.getByText("Raw data")).toBeVisible();
  expect(screen.queryByText("Query")).not.toBeInTheDocument();
});

it.each([
  [{ hue: "cyan" as const }, () => ink("cyan", 2)],
  [{ step: 4 as const }, () => ink("slate", 4)],
])("colors the frame and caption with %j", async (props, color) => {
  const app = await change({}, props);
  await app.change();
  expect(screen.getByText("Query")).toHaveStyle({ color: color() });
  expect(frame()?.querySelector("g")).toHaveStyle({ color: color() });
});

it("lets labelColor override the caption ink", async () => {
  const app = await change({}, { labelColor: ink("rose", 3) });
  await app.change();
  expect(screen.getByText("Query")).toHaveStyle({ color: ink("rose", 3) });
});

it("sizes code with fontSize in frame units", async () => {
  const app = await change({}, { fontSize: 1.4 });
  await app.change();
  expect(screen.getByText("Query").parentElement?.style.fontSize).toBe("calc(1.4 * var(--sw))");
});

it("tokenizes SQL only when lang is sql", async () => {
  const app = await change({}, { lang: "sql" });
  expect(screen.queryByText("SELECT")).not.toBeInTheDocument();
  await app.change();
  expect(screen.getByText("SELECT")).toHaveStyle({ color: ink("slate", 2) });
});

it("opens href in a new tab and lights the frame on keyboard focus", async () => {
  const app = await change({}, { href: "https://example.com/query" });
  await app.change();
  const link = screen.getByRole("link", { name: /Query/ });
  expect(link).toHaveAttribute("href", "https://example.com/query");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener");
  await app.user.tab();
  expect(link).toHaveFocus();
  expect(frame()?.querySelector("rect")).toHaveAttribute("stroke-opacity", "1");
});

it("uses seed to make repeatable marker frames beneath the code", async () => {
  STORY_STYLE.ink = "marker";
  const app = await change({ seed: "first" }, { seed: "second" });
  const first = frame()?.querySelector("path")?.getAttribute("d");
  expect(first).toBeTruthy();
  await app.change();
  expect(frame()?.querySelector("path")?.getAttribute("d")).not.toBe(first);
  app.unmount();
  await change({ seed: "first" }, { seed: "second" });
  expect(frame()?.querySelector("path")?.getAttribute("d")).toBe(first);
});

it("settles the current click when a reveal is interrupted by leaving the slide", async () => {
  const app = await setup(CodeBeat, { click: 1 });
  await app.next();
  await tick(DUR.grow / 2);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  const code = screen.getByText("Query").parentElement;
  expect(code).toHaveStyle({ opacity: "1" });
  await tick(DUR.grow);
  expect(code).toHaveStyle({ opacity: "1" });
});
