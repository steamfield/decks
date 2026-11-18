import { expect, it } from "vitest";
import { DeckError } from "../dev/errors";
import { commandPositionals, wholeNumber } from "./command-args";

it("returns the positionals around known flags", () => {
  expect(
    commandPositionals(["deck", "--width", "960", "2"], { width: { type: "string" } }),
  ).toEqual(["deck", "2"]);
});

it("rejects an unknown flag with a DeckError naming it", () => {
  expect(() => commandPositionals(["deck", "--bogus"], {})).toThrow(
    expect.objectContaining({
      name: "DeckError",
      message: expect.stringContaining("Unknown option '--bogus'"),
    }),
  );
});

it("accepts a whole number at the minimum and above", () => {
  expect([wholeNumber("0", "click", 0), wholeNumber("12", "slide", 1)]).toEqual([0, 12]);
});

it.each([
  ["0", 1],
  ["-1", 0],
  ["1.5", 0],
  ["9007199254740993", 0],
])("rejects %s with a minimum of %s, naming the argument", (value, min) => {
  expect(() => wholeNumber(value, "width", min)).toThrow(
    new DeckError(`Invalid width "${value}". Use a whole number ${min} or greater.`),
  );
});
