import { act, screen } from "@testing-library/react";
import { type ComponentProps, useRef } from "react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { useStage } from "../story/stage";
import { DUR } from "../theme/easings";
import { ink, installTheme, resolveTheme } from "../theme/theme";
import { type GrowHandle, InkNumber } from "./ink-number";

beforeEach(() => installTheme(resolveTheme()));

function growing(props: ComponentProps<typeof InkNumber>) {
  return () => <Figure {...props} />;
}
function Figure({
  repeat = false,
  ...props
}: ComponentProps<typeof InkNumber> & { repeat?: boolean }) {
  const number = useRef<GrowHandle>(null);
  useStage({
    copy: [{ lead: "Wait" }, { lead: "Count" }, { lead: "Done" }, { lead: "Done" }],
    beats(tl, beat) {
      beat(0);
      number.current?.addGrow(tl);
      beat(1);
      if (repeat) number.current?.addGrow(tl);
      else tl.to({}, { duration: DUR.card });
      beat(2);
      beat(3);
    },
  });
  return <InkNumber {...props} ref={number} />;
}

it.each([{ context: "overview" as const }, { instant: true }])(
  "renders the settled figure without a caller timeline: %j",
  async (options) => {
    await setup(() => <InkNumber value="8,000" label="Schools" />, options);
    expect(screen.getByText("8,000")).toBeVisible();
    expect(screen.getByText("Schools")).toBeVisible();
    await tick(DUR.grow);
    expect(screen.getByText("8,000")).toBeVisible();
  },
);

it("counts grouped values and holds grouping until DUR.grow", async () => {
  const app = await setup(growing({ value: "8,000", label: "Schools" }));
  await app.next();
  await tick(DUR.grow / 2);
  const shown = screen.getByText(/^\d,\d{3}$/);
  expect(shown.textContent).not.toBe("8,000");
  expect(shown).toBeVisible();
  await tick(DUR.grow / 2);
  expect(screen.getByText("8,000")).toHaveStyle({ opacity: "1", transform: "none" });
  expect(screen.getByText("Schools")).toBeVisible();
});

it("keeps a grown figure settled when addGrow is appended again", async () => {
  const app = await setup(() => <Figure value="8,000" repeat />);
  await app.next();
  await tick(DUR.grow);
  expect(screen.getByText("8,000")).toHaveStyle({ opacity: "1" });
  await app.next();
  await tick(DUR.grow / 2);
  expect(screen.getByText("8,000")).toHaveStyle({ opacity: "1" });
  await tick(DUR.grow / 2);
  expect(screen.getByText("8,000")).toHaveStyle({ opacity: "1" });
});

it("scales a qualified figure off its baseline instead of counting it", async () => {
  const app = await setup(growing({ value: "~90%" }));
  expect(screen.getByText("~90%")).toHaveStyle({ opacity: "0", transform: "scaleY(0.3)" });
  await app.next();
  await tick(DUR.grow / 2);
  expect(screen.getByText("~90%").style.transform).not.toBe("scaleY(1)");
  await tick(DUR.grow / 2);
  expect(screen.getByText("~90%")).toHaveStyle({ opacity: "1", transform: "scaleY(1)" });
});

it("lets count=false scale a numeric value", async () => {
  const app = await setup(growing({ value: "120", count: false }));
  expect(screen.getByText("120")).toHaveStyle({ transform: "scaleY(0.3)" });
  await app.next();
  await tick(DUR.grow);
  expect(screen.getByText("120")).toHaveStyle({ transform: "scaleY(1)" });
});

it("keeps decimal places while counting", async () => {
  const app = await setup(growing({ value: "1,200.50" }));
  await app.next();
  await tick(DUR.grow / 2);
  expect(screen.getByText(/^\d,\d{3}\.\d{2}$/)).toBeVisible();
  await tick(DUR.grow / 2);
  expect(screen.getByText("1,200.50")).toBeVisible();
});

it.each(["hue", "step", "size", "label", "prefix", "suffix"] as const)(
  "draws the %s prop",
  async (prop) => {
    await setup(
      () => (
        <InkNumber
          value="120"
          hue={prop === "hue" ? "rose" : undefined}
          step={prop === "step" ? 1 : undefined}
          size={prop === "size" ? 8 : undefined}
          label={prop === "label" ? "Districts" : undefined}
          prefix={prop === "prefix" ? "$" : undefined}
          suffix={prop === "suffix" ? "B" : undefined}
        />
      ),
      { instant: true },
    );
    const figure = screen.getByText("120");
    if (prop === "hue") expect(figure).toHaveStyle({ color: ink("rose", 3) });
    if (prop === "step") expect(figure).toHaveStyle({ color: ink("emerald", 1) });
    if (prop === "size") expect(figure.style.fontSize).toBe("calc(8 * var(--sw))");
    if (prop === "label") expect(screen.getByText("Districts")).toBeVisible();
    if (prop === "prefix") expect(figure.textContent).toBe("$120");
    if (prop === "suffix") expect(figure.textContent).toBe("120B");
  },
);

it.each([{ context: "preview" as const }, { context: "overview" as const }, { instant: true }, {}])(
  "seeks directly to a later click without replaying: %j",
  async (options) => {
    await setup(growing({ value: "8,000" }), { ...options, click: 3 });
    expect(screen.getByText("8,000")).toHaveStyle({ opacity: "1" });
    await tick(DUR.grow / 2);
    expect(screen.getByText("8,000")).toHaveStyle({ opacity: "1" });
  },
);

it("settles when inactive and can count again after returning", async () => {
  const app = await setup(growing({ value: "8,000" }));
  await app.next();
  await tick(DUR.grow / 2);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  expect(screen.getByText("8,000")).toHaveStyle({ opacity: "1" });
  await tick(DUR.grow);
  expect(screen.getByText("8,000")).toHaveStyle({ opacity: "1" });
  await act(async () => app.store.dispatch({ type: "go", slide: 1, click: 0 }));
  await app.next();
  await tick(DUR.grow);
  expect(screen.getByText("8,000")).toBeVisible();
});
