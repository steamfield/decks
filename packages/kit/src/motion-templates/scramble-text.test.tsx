import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const content = { text: "Decoded", label: "Signal status" } as const;
beforeEach(() => installTheme(resolveTheme()));

function show(at: number, options?: Parameters<typeof setup>[1]) {
  return setup(() => <MotionTemplate template="scramble-text" {...content} at={at} />, options);
}
const word = () => screen.getByLabelText(content.text);

it("scramble-text hides its parts before click at and shows the real word from click at", async () => {
  const view = await show(2);
  expect(word()).not.toBeVisible();
  expect(screen.getByText(content.label)).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(word()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(word()).toBeVisible();
  expect(word()).toHaveTextContent(content.text);
  expect(screen.getByText(content.label)).toBeVisible();
  await view.previous();
  await tick(1.2);
  expect(word()).not.toBeVisible();
});

it("shows scrambled glyphs mid-entrance and the real word once it settles", async () => {
  await show(0);
  await tick(0.35);
  expect(word().textContent).toHaveLength(content.text.length);
  expect(word().textContent).not.toBe(content.text);
  await tick(0.85);
  expect(word()).toHaveTextContent(content.text);
  await tick(0.6);
  expect(word()).toHaveTextContent(content.text);
});

it("going back mid-scramble and forward again ends on the real word each time", async () => {
  const view = await show(1);
  await view.next();
  await tick(0.35);
  await view.previous();
  await tick(1.2);
  expect(word().textContent).toBe(content.text);
  await view.next();
  await tick(1.2);
  expect(word().textContent).toBe(content.text);
  await view.previous();
  await tick(1.2);
  expect(word().textContent).toBe(content.text);
});

it.each([
  ["print", { click: 1, context: "print" }],
  ["instant mode", { click: 1, instant: true }],
  ["a jump to the click", { click: 1 }],
] as const)("scramble-text shows the real word in %s", async (_, options) => {
  await show(1, options);
  expect(word()).toBeVisible();
  expect(word().textContent).toBe(content.text);
});

it("accepts a 16-character word and no label", async () => {
  await setup(() => <MotionTemplate template="scramble-text" text={"W".repeat(16)} />, {
    instant: true,
  });
  expect(screen.getByRole("heading", { name: "W".repeat(16) })).toBeVisible();
});

it.each([
  [{ at: -1 }, "scramble-text at must be a nonnegative integer, got -1"],
  [{ text: " " }, 'scramble-text text must contain text, got " "'],
  [
    { text: "W".repeat(17) },
    `scramble-text text must be at most 16 characters, got "${"W".repeat(17)}"`,
  ],
  [{ label: "" }, 'scramble-text label must contain text, got ""'],
  [
    { label: "L".repeat(41) },
    `scramble-text label must be at most 40 characters, got "${"L".repeat(41)}"`,
  ],
] as const)("scramble-text throws naming the offending value for %j", async (invalid, message) => {
  const { errors } = await setup(
    () => <MotionTemplate template="scramble-text" {...content} {...invalid} />,
    { error: true },
  );
  expect(errors).toEqual([new Error(message)]);
});
