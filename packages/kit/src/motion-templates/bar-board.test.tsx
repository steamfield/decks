import { screen } from "@testing-library/react";
import { beforeEach, expect, it, onTestFinished } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";
import type { Datum } from "./motion-template-props";

const north = { label: "North", value: 42 };
const east = { label: "East", value: 30 };
const south = { label: "South", value: 17 };
const rows: readonly Datum[] = [north, east, south];
const source = "Harbour log, 2025";
beforeEach(() => installTheme(resolveTheme()));

function show(at: number, options?: Parameters<typeof setup>[1], data = rows) {
  return setup(
    () => <MotionTemplate template="bar-board" rows={data} source={source} at={at} />,
    options,
  );
}
function opacity(element: Element) {
  let value = 1;
  for (let part: Element | null = element; part; part = part.parentElement)
    value *= Number(getComputedStyle(part).opacity || 1);
  return value;
}
/** The value each row shows beside its bar, read as a viewer would: blank until it appears. */
function values() {
  return screen.getAllByRole("listitem", { hidden: true }).map((row) => {
    const value = row.lastElementChild?.lastElementChild;
    return value && opacity(value) > 0 ? value.textContent : "";
  });
}
/** The axis labels, left to right. */
function ticks() {
  const zero = screen.getByText("0", { exact: true });
  return Array.from(zero.parentElement?.children ?? [], (tick) => tick.textContent);
}

it("bar-board hides its values before click at and shows the finished board from click at", async () => {
  const view = await show(2);
  expect(values()).toEqual(["", "", ""]);
  await view.next();
  await tick(1.5);
  expect(values()).toEqual(["", "", ""]);
  await view.next();
  await tick(1.5);
  expect(values()).toEqual(["42", "30", "17"]);
  expect(screen.getByText(source)).toBeVisible();
  await view.previous();
  await tick(1.5);
  expect(values()).toEqual(["", "", ""]);
});

it("grows the bars one after another, counting, and lands six rows within 1.5 s", async () => {
  const six = [60, 50, 40, 30, 20, 10].map((value, index) => ({ label: `Row ${index}`, value }));
  await show(0, undefined, six);
  await tick(0.55);
  const [first, , , , , last] = values().map(Number);
  expect(first).toBeGreaterThan(0);
  expect(first).toBeLessThan(60);
  expect(last).toBeLessThan(10);
  await tick(0.95);
  expect(values()).toEqual(["60", "50", "40", "30", "20", "10"]);
});

it("no counter runs past its value on the way in", async () => {
  await show(0, undefined, [
    { label: "Lead", value: 10000 },
    { label: "Next", value: 5000 },
  ]);
  const seen: number[] = [];
  for (let step = 0; step < 30; step++) {
    await tick(0.05);
    seen.push(Number(values()[0]?.replaceAll(",", "") || 0));
  }
  expect(Math.max(...seen)).toBe(10000);
  expect(seen.toSorted((a, b) => a - b)).toEqual(seen);
});

it("click 2 keeps the leader forward and dims the other rows", async () => {
  const view = await show(1);
  await view.next();
  await tick(1.5);
  const board = () =>
    rows.map(({ label, value }) =>
      opacity(screen.getByRole("listitem", { name: `${label}: ${value}` })),
    );
  expect(board()).toEqual([1, 1, 1]);
  await view.next();
  await tick(1.2);
  const [leader, ...rest] = board();
  expect(leader).toBe(1);
  for (const row of rest) expect(row).toBeLessThan(1);
  await view.previous();
  await tick(1.2);
  expect(board()).toEqual([1, 1, 1]);
});

it.each([
  [42, ["0", "10", "20", "30", "40", "50"]],
  [7, ["0", "2", "4", "6", "8"]],
  [50, ["0", "10", "20", "30", "40", "50"]],
  [1234, ["0", "250", "500", "750", "1,000", "1,250"]],
  [0.9, ["0", "0.2", "0.4", "0.6", "0.8", "1"]],
])("labels the axis for a largest value of %s with at most six nice ticks", async (top, axis) => {
  await show(0, { instant: true }, [
    { label: "Lead", value: top },
    { label: "Next", value: top / 2 },
  ]);
  expect(ticks()).toEqual(axis);
});

it("formats values in the deck language with the prefix and suffix", async () => {
  const previous = document.documentElement.lang;
  document.documentElement.lang = "de-DE";
  onTestFinished(() => {
    document.documentElement.lang = previous;
  });
  await setup(
    () => (
      <MotionTemplate
        template="bar-board"
        rows={[
          { label: "Harbour", value: 1234.5 },
          { label: "Ridge", value: 900 },
        ]}
        source={source}
        prefix="€"
        suffix="k"
      />
    ),
    { context: "print" },
  );
  expect(values()).toEqual(["€1.234,5k", "€900k"]);
  expect(screen.getByRole("listitem", { name: "Harbour: €1.234,5k" })).toBeVisible();
});

it("bar-board shows its finished board in print", async () => {
  await show(1, { click: 1, context: "print" });
  expect(values()).toEqual(["42", "30", "17"]);
});

it.each([
  [{ at: -1 }, "bar-board at must be a nonnegative integer, got -1"],
  [
    { rows: [{ label: "Only", value: 1 }] },
    'bar-board rows must have 2 to 6 rows, got [{"label":"Only","value":1}]',
  ],
  [
    { rows: Array.from({ length: 7 }, () => ({ label: "R", value: 1 })) },
    `bar-board rows must have 2 to 6 rows, got ${JSON.stringify(Array.from({ length: 7 }, () => ({ label: "R", value: 1 })))}`,
  ],
  [
    { rows: [north, { label: " ", value: 1 }] },
    'bar-board rows[1].label must contain text, got " "',
  ],
  [
    { rows: [{ label: "x".repeat(17), value: 50 }, south] },
    `bar-board rows[0].label must be at most 16 characters, got "${"x".repeat(17)}"`,
  ],
  [
    { rows: [north, { label: "Debt", value: -3 }] },
    "bar-board rows[1].value must be a finite number of at least 0, got -3",
  ],
  [
    { rows: [north, south, east] },
    'bar-board rows must be sorted largest first: rows[2] "East" (30) is larger than "South" (17)',
  ],
  [{ source: "" }, 'bar-board source must contain text, got ""'],
  [
    {
      rows: [
        { label: "A", value: 0 },
        { label: "B", value: 0 },
      ],
    },
    "bar-board rows need a value above 0",
  ],
] as const)("bar-board throws naming the offending value for %j", async (invalid, message) => {
  const { errors } = await setup(
    () => <MotionTemplate template="bar-board" rows={rows} source={source} {...invalid} />,
    { error: true },
  );
  expect(errors).toEqual([new Error(message)]);
});

it("accepts six rows with 16-character labels", async () => {
  const six = Array.from({ length: 6 }, (_, index) => ({
    label: `${index}`.padEnd(16, "x"),
    value: 6 - index,
  }));
  await show(0, { instant: true }, six);
  expect(values()).toEqual(["6", "5", "4", "3", "2", "1"]);
});
