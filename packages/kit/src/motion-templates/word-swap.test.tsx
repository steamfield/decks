import { act, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { readableGlyphs, setup, tick } from "../kit.test-support";
import { ink, installTheme, resolveTheme, theme } from "../theme/theme";
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
/** Each plate's fill colour, in order: a fill is a decorative box, the plate's only one without text. */
const fills = () =>
  Array.from(screen.getByRole("heading").querySelectorAll("span"))
    .filter((span) => !span.textContent)
    .map((span) => getComputedStyle(span).backgroundColor);
const channels = (hex: string) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
/** A theme colour as the browser reports it. */
const rgb = (hex: string) => `rgb(${channels(hex).join(", ")})`;
function contrast(one: string, two: string) {
  const luminance = (hex: string) => {
    const [r = 0, g = 0, b = 0] = channels(hex).map((value) => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(one), luminance(two)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

it.each([
  ["palette", () => [ink("amber", 3), ink("rose", 3), ink("cyan", 3)]],
  ["neutral", () => [theme().surfaces.muted, theme().surfaces.muted, ink("cyan", 3)]],
] as const)(
  "with the %s tone each click shows its phrase on its plate's colour",
  async (tone, colours) => {
    const view = await setup(() => (
      <MotionTemplate template="word-swap" {...content} tone={tone} />
    ));
    await tick(1.2);
    for (const [click, word] of content.words.entries()) {
      if (click) {
        await view.next();
        await tick(1.2);
      }
      expect(plate()).toBe(word);
      expect(fills()[click]).toBe(rgb(colours()[click] ?? ""));
    }
  },
);

it("the palette skips the accent hue, cycles the theme's hues and keeps letters readable", async () => {
  const words = ["one", "two", "three", "four", "five"];
  await setup(
    () => <MotionTemplate template="word-swap" lead={content.lead} words={words} accent="amber" />,
    { instant: true },
  );
  const plates = [
    ink("cyan", 3),
    ink("rose", 3),
    ink("emerald", 3),
    ink("violet", 3),
    ink("amber", 3),
  ];
  expect(fills()).toEqual(plates.map(rgb));
  // Letters on a coloured plate take the canvas colour.
  for (const fill of plates)
    expect(contrast(fill, theme().surfaces.canvas)).toBeGreaterThanOrEqual(4.5);
});

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
