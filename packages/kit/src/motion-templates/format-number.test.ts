import { expect, it } from "vitest";
import { numberFormat } from "./format-number";

it.each([
  [1200, 1200, "1.200"],
  [12.5, 12.46, "12,5"],
  [12.34, 12.345, "12,35"],
  [0.0004, 0.0004, "4E-4"],
  [-0.00015, -0.00015, "-1,5E-4"],
] as const)(
  "uses the endpoint's precision for %s in the deck language",
  (endpoint, sample, expected) => {
    expect(numberFormat(endpoint, "de-DE").format(sample)).toBe(expected);
  },
);
