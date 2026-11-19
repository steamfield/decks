import { act, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { readableGlyphs, setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const content = { lead: ["We used to ship"], words: ["quarterly", "weekly", "daily"] };
beforeEach(() => installTheme(resolveTheme()));

function show(at: number, options?: Parameters<typeof setup>[1], words = content.words) {
  return setup(
    () => <MotionTemplate template="word-swap" lead={content.lead} words={words} at={at} />,
    options,
  );
}
/** The plate letters a viewer can read. */
const plate = () => readableGlyphs(screen.getByRole("heading"));

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

it("swaps in the next phrase on each click, names the heading after it, and back again", async () => {
  const view = await show(0);
  await tick(1.2);
  expect(plate()).toBe("quarterly");
  expect(screen.getByRole("heading")).toHaveAccessibleName("We used to ship quarterly");
  for (const word of ["weekly", "daily"]) {
    await view.next();
    await tick(1.2);
    expect(plate()).toBe(word);
    expect(screen.getByRole("heading")).toHaveAccessibleName(`We used to ship ${word}`);
  }
  for (const word of ["weekly", "quarterly"]) {
    await view.previous();
    await tick(1.2);
    expect(plate()).toBe(word);
    expect(screen.getByRole("heading")).toHaveAccessibleName(`We used to ship ${word}`);
  }
});

it("swaps between repeated phrases one plate at a time", async () => {
  const view = await show(0, undefined, ["faster", "faster", "fastest"]);
  await tick(1.2);
  const seen = [plate()];
  for (let click = 0; click < 2; click++) {
    await view.next();
    await tick(1.2);
    seen.push(plate());
  }
  expect(seen).toEqual(["faster", "faster", "fastest"]);
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

it("returning from the next slide to the last click shows only the last phrase", async () => {
  const view = await show(0, { click: 3 });
  await tick(1.2);
  expect(plate()).toBe("daily");
  await act(async () => view.store.dispatch({ type: "next" }));
  await screen.findByRole("heading", { name: "Second slide" });
  await act(async () => view.store.dispatch({ type: "prev" }));
  await screen.findByRole("button", { name: "Next click" });
  await tick(1.2);
  expect(plate()).toBe("daily");
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
  expect(screen.getByRole("heading", { name: "We used to ship daily" })).toBeVisible();
});

it("accepts two 18-character lines and five 16-character phrases", async () => {
  const lead = ["L".repeat(18), "M".repeat(18)];
  const words = ["A", "B", "C", "D", "E"].map((letter) => letter.repeat(16));
  await setup(() => <MotionTemplate template="word-swap" lead={lead} words={words} />, {
    click: 3,
    instant: true,
  });
  expect(screen.getByRole("heading", { name: [...lead, words[3]].join(" ") })).toBeVisible();
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
