import { expect, it } from "vitest";
import { CANVAS, CATEGORICAL_COLORS, installTheme, resolveTheme } from "./index";

it("provides default palette and canvas before setup installs a theme", () => {
  expect(CATEGORICAL_COLORS).toEqual(resolveTheme().categorical);
  expect(CANVAS).toBe(resolveTheme().surfaces.canvas);
});

it("updates values imported before installation when a deck recolors a ramp", () => {
  const overridden = resolveTheme({
    ramps: { cyan: ["#123456", "#345678", "#56789a", "#789abc"] },
    categorical: ["{ramps.cyan.2}", "{ramps.rose.3}"],
    surfaces: { canvas: "#010203" },
  });
  installTheme(overridden);
  expect(CATEGORICAL_COLORS[0]).toBe("#345678");
  expect(CATEGORICAL_COLORS).toEqual(overridden.categorical);
  expect(CANVAS).toBe("#010203");
  installTheme(resolveTheme());
  expect(CATEGORICAL_COLORS[0]).toBe(resolveTheme().categorical[0]);
  expect(CANVAS).toBe(resolveTheme().surfaces.canvas);
});
