import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const content = { lead: ["We used to ship"], words: ["quarterly", "weekly", "daily"] };
const name = "We used to ship quarterly weekly daily";
beforeEach(() => installTheme(resolveTheme()));

function show(at: number, options?: Parameters<typeof setup>[1]) {
  return setup(() => <MotionTemplate template="word-swap" {...content} at={at} />, options);
}
function opacity(element: Element) {
  let value = 1;
  for (let part: Element | null = element; part; part = part.parentElement)
    value *= Number(getComputedStyle(part).opacity || 1);
  return value;
}
/** The plate letters a viewer can read: every single-letter box that is fully opaque. */
function plate() {
  const heading = screen.getByRole("heading", { name });
  return Array.from(heading.querySelectorAll("*"))
    .filter((el) => !el.children.length && el.textContent?.length === 1 && opacity(el) === 1)
    .map((el) => el.textContent)
    .join("");
}

it("word-swap hides the plate before click at and shows the first phrase from click at", async () => {
  const view = await show(2);
  expect(plate()).toBe("");
  await view.next();
  await tick(1.2);
  expect(plate()).toBe("");
  await view.next();
  await tick(1.2);
  expect(plate()).toBe("quarterly");
  await view.previous();
  await tick(1.2);
  expect(plate()).toBe("");
});

it("swaps in the next phrase on each click and back again going back", async () => {
  const view = await show(0);
  await tick(1.2);
  expect(plate()).toBe("quarterly");
  for (const word of ["weekly", "daily"]) {
    await view.next();
    await tick(1.2);
    expect(plate()).toBe(word);
  }
  for (const word of ["weekly", "quarterly"]) {
    await view.previous();
    await tick(1.2);
    expect(plate()).toBe(word);
  }
});

it("going back mid-swap restores the previous phrase whole", async () => {
  const view = await show(0);
  await tick(1.2);
  await view.next();
  await tick(0.15);
  expect(plate()).not.toBe("quarterly");
  await view.previous();
  await tick(1.2);
  expect(plate()).toBe("quarterly");
});

it("the lead rises and the first plate lands within 1.2 s of arrival", async () => {
  await show(0);
  const lead = () => getComputedStyle(screen.getByText("ship")).transform;
  const start = lead();
  await tick(0.2);
  const moving = lead();
  expect(moving).not.toBe(start);
  await tick(1);
  expect(lead()).not.toBe(moving);
  expect(plate()).toBe("quarterly");
  const end = lead();
  await tick(0.6);
  expect(lead()).toBe(end);
});

it("word-swap shows only the phrase for the click in print", async () => {
  await show(1, { click: 3, context: "print" });
  expect(plate()).toBe("daily");
  expect(screen.getByRole("heading", { name })).toBeVisible();
});

it("accepts two 18-character lines and five 16-character phrases", async () => {
  const lead = ["L".repeat(18), "M".repeat(18)];
  const words = ["A", "B", "C", "D", "E"].map((letter) => letter.repeat(16));
  await setup(() => <MotionTemplate template="word-swap" lead={lead} words={words} />, {
    click: 3,
    instant: true,
  });
  expect(screen.getByRole("heading", { name: [...lead, ...words].join(" ") })).toBeVisible();
});

it.each([
  [{ at: -1 }, "word-swap at must be a nonnegative integer, got -1"],
  [{ lead: [] }, "word-swap lead must have 1 or 2 lines, got []"],
  [{ lead: ["a", "b", "c"] }, 'word-swap lead must have 1 or 2 lines, got ["a","b","c"]'],
  [{ words: ["once"] }, 'word-swap words must have 2 to 5 phrases, got ["once"]'],
  [
    { words: ["a", "b", "c", "d", "e", "f"] },
    'word-swap words must have 2 to 5 phrases, got ["a","b","c","d","e","f"]',
  ],
  [{ lead: [" "] }, 'word-swap lead[0] must contain text, got " "'],
  [
    { lead: ["We ship", "x".repeat(19)] },
    `word-swap lead[1] must be at most 18 characters, got "${"x".repeat(19)}"`,
  ],
  [{ words: ["weekly", ""] }, 'word-swap words[1] must contain text, got ""'],
  [
    { words: ["y".repeat(17), "weekly"] },
    `word-swap words[0] must be at most 16 characters, got "${"y".repeat(17)}"`,
  ],
] as const)("word-swap throws naming the offending value for %j", async (invalid, message) => {
  const { errors } = await setup(
    () => <MotionTemplate template="word-swap" {...content} {...invalid} />,
    { error: true },
  );
  expect(errors).toEqual([new Error(message)]);
});
