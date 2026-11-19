import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { accessibleText, readableGlyphs, setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const command = "bun add @steamfield/decks";
/** What the finished line reads as glyphs; a space draws nothing. */
const glyphs = command.replaceAll(" ", "");
beforeEach(() => installTheme(resolveTheme()));

function show(at: number, options?: Parameters<typeof setup>[1]) {
  return setup(() => <MotionTemplate template="command-line" command={command} at={at} />, options);
}

/** The glyphs a viewer can read, in order: each typed character is fully opaque. */
const typed = () => readableGlyphs(screen.getByRole("code"));

it("command-line hides its command before click at and shows it whole from click at", async () => {
  const view = await show(2);
  expect(typed()).toBe("");
  await view.next();
  await tick(1.2);
  expect(typed()).toBe("");
  await view.next();
  await tick(1.2);
  expect(typed()).toBe(glyphs);
  await view.previous();
  await tick(1.2);
  expect(typed()).toBe("");
});

it("types the command on in order in the live slide and finishes within 1.2 s", async () => {
  await show(0);
  await tick(0.45);
  const partial = typed();
  expect(partial.length).toBeGreaterThan(0);
  expect(partial.length).toBeLessThan(glyphs.length);
  expect(glyphs.startsWith(partial)).toBe(true);
  await tick(0.75);
  expect(typed()).toBe(glyphs);
});

it("command-line shows the whole command in print", async () => {
  await show(1, { click: 1, context: "print" });
  expect(typed()).toBe(glyphs);
});

it("reads the command to a screen reader as one string", async () => {
  await show(0, { instant: true });
  expect(accessibleText(screen.getByRole("code"))).toBe(command);
});

it("accepts a 48-character command", async () => {
  const longest = "x".repeat(48);
  await setup(() => <MotionTemplate template="command-line" command={longest} />, {
    instant: true,
  });
  expect(typed()).toBe(longest);
});

it.each([
  [{ at: -1 }, "command-line at must be a nonnegative integer, got -1"],
  [{ command: " " }, 'command-line command must contain text, got " "'],
  [
    { command: "x".repeat(49) },
    `command-line command must be at most 48 characters, got "${"x".repeat(49)}"`,
  ],
] as const)("command-line throws naming the offending value for %j", async (invalid, message) => {
  const { errors } = await setup(
    () => <MotionTemplate template="command-line" command={command} {...invalid} />,
    { error: true },
  );
  expect(errors).toEqual([new Error(message)]);
});
