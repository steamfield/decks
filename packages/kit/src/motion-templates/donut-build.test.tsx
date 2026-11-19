import { screen } from "@testing-library/react";
import { beforeEach, expect, it, onTestFinished } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";
import type { Datum } from "./motion-template-props";

const segments: readonly Datum[] = [
  { label: "Mobile", value: 58 },
  { label: "Desktop", value: 30 },
  { label: "Tablet", value: 12 },
];
beforeEach(() => installTheme(resolveTheme()));

function show(at: number, options?: Parameters<typeof setup>[1], data = segments) {
  return setup(
    () => <MotionTemplate template="donut-build" segments={data} suffix="%" at={at} />,
    options,
  );
}
const centre = () => screen.getByRole("heading", { level: 2, hidden: true });
/** The legend labels a viewer can see, in order. */
function shown() {
  return segments
    .map(({ label }) => screen.getByText(label))
    .filter((label) => {
      for (let part: Element | null = label; part; part = part.parentElement) {
        const style = getComputedStyle(part);
        if (style.visibility === "hidden" || style.opacity === "0") return false;
      }
      return true;
    })
    .map((label) => label.textContent);
}

it("donut-build hides its parts before click at and shows the first segment from click at", async () => {
  const view = await show(2);
  expect(centre()).not.toBeVisible();
  expect(shown()).toEqual([]);
  await view.next();
  await tick(1.2);
  expect(centre()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(centre()).toBeVisible();
  expect(centre()).toHaveTextContent("58%");
  expect(shown()).toEqual(["Mobile"]);
  await view.previous();
  await tick(1.2);
  expect(centre()).not.toBeVisible();
});

it("adds one segment per click and counts the centre to the running total, and back", async () => {
  const view = await show(1);
  const poses = [
    ["58%", ["Mobile"]],
    ["88%", ["Mobile", "Desktop"]],
    ["100%", ["Mobile", "Desktop", "Tablet"]],
  ] as const;
  for (const [total, labels] of poses) {
    await view.next();
    await tick(1.2);
    expect(centre()).toHaveTextContent(total);
    expect(shown()).toEqual(labels);
  }
  for (const [total, labels] of poses.toReversed().slice(1)) {
    await view.previous();
    await tick(1.2);
    expect(centre()).toHaveTextContent(total);
    expect(shown()).toEqual(labels);
  }
});

it("counts between running totals mid-click without passing the next one", async () => {
  const view = await show(0, undefined, [
    { label: "Mobile", value: 5800 },
    { label: "Desktop", value: 4200 },
  ]);
  await tick(1.2);
  await view.next();
  const seen: number[] = [];
  for (let step = 0; step < 15; step++) {
    await tick(0.05);
    seen.push(Number(centre().textContent?.replace(/\D/g, "")));
  }
  expect(seen.some((total) => total > 5800 && total < 10000)).toBe(true);
  expect(Math.max(...seen)).toBe(10000);
  expect(seen.toSorted((a, b) => a - b)).toEqual(seen);
});

it.each([
  ["a jump to click 3", { click: 3 }],
  ["print at click 3", { click: 3, context: "print" }],
  ["instant mode at click 2", { click: 2, instant: true }],
] as const)("shows the pose for the click with no animation on %s", async (_, options) => {
  await show(1, options);
  const all = options.click === 3;
  expect(centre()).toHaveTextContent(all ? "100%" : "88%");
  expect(shown()).toEqual(all ? ["Mobile", "Desktop", "Tablet"] : ["Mobile", "Desktop"]);
});

it("formats the centre and the legend in the deck language with prefix and suffix", async () => {
  const previous = document.documentElement.lang;
  document.documentElement.lang = "de-DE";
  onTestFinished(() => {
    document.documentElement.lang = previous;
  });
  await setup(
    () => (
      <MotionTemplate
        template="donut-build"
        segments={[
          { label: "Fares", value: 1200.5 },
          { label: "Freight", value: 800 },
        ]}
        prefix="€"
        suffix="k"
      />
    ),
    { click: 1, context: "print" },
  );
  expect(centre()).toHaveTextContent("€2.000,5k");
  expect(screen.getByText("€1.200,5k")).toBeVisible();
  expect(screen.getByText("€800k")).toBeVisible();
});

it("accepts five segments with 16-character labels", async () => {
  const five = Array.from({ length: 5 }, (_, index) => ({
    label: `${index}`.padEnd(16, "x"),
    value: 20,
  }));
  await setup(() => <MotionTemplate template="donut-build" segments={five} suffix="%" />, {
    click: 3,
    instant: true,
  });
  expect(centre()).toHaveTextContent("80%");
});

it.each([
  [{ at: -1 }, "donut-build at must be a nonnegative integer, got -1"],
  [
    { segments: [{ label: "All", value: 1 }] },
    'donut-build segments must have 2 to 5 segments, got [{"label":"All","value":1}]',
  ],
  [
    { segments: Array.from({ length: 6 }, () => ({ label: "S", value: 1 })) },
    `donut-build segments must have 2 to 5 segments, got ${JSON.stringify(Array.from({ length: 6 }, () => ({ label: "S", value: 1 })))}`,
  ],
  [
    { segments: [{ label: "", value: 1 }, ...segments.slice(1)] },
    'donut-build segments[0].label must contain text, got ""',
  ],
  [
    { segments: [...segments.slice(0, 2), { label: "t".repeat(17), value: 1 }] },
    `donut-build segments[2].label must be at most 16 characters, got "${"t".repeat(17)}"`,
  ],
  [
    { segments: [...segments.slice(0, 1), { label: "None", value: 0 }] },
    "donut-build segments[1].value must be a finite number above 0, got 0",
  ],
] as const)("donut-build throws naming the offending value for %j", async (invalid, message) => {
  const { errors } = await setup(
    () => <MotionTemplate template="donut-build" segments={segments} {...invalid} />,
    { error: true },
  );
  expect(errors).toEqual([new Error(message)]);
});
