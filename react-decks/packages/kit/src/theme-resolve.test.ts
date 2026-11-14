import { describe, expect, it } from "vitest";
import { resolveTheme } from "./index";
import { deepMerge, resolveAliases, themeCss } from "./theme-resolve";

describe("theme resolution", () => {
  it("merges objects, replaces arrays, and resolves default aliases against overridden ramps", () => {
    const value = resolveTheme({
      ramps: { cyan: ["#123456", "#234567", "#345678", "#456789"] },
      categorical: ["#abcdef"],
    });
    expect(value.accents.cyan).toBe("#234567");
    expect(value.glows.primary).toBe("#234567");
    expect(value.categorical).toEqual(["#abcdef"]);
    expect(value.ramps.amber).toEqual(resolveTheme().ramps.amber);
    expect(JSON.stringify(value)).not.toMatch(/\{[\w.-]+\}/);
    expect(deepMerge({ a: { b: 1, c: 2 }, l: [1, 2] }, { a: { c: 9 }, l: [7] })).toEqual({
      a: { b: 1, c: 9 },
      l: [7],
    });
  });
  it("expands 1-based ramp aliases, embedded aliases and alias chains", () => {
    expect(resolveAliases({ ramps: { cyan: ["one", "two"] }, a: "{ramps.cyan.2}" })).toMatchObject({
      a: "two",
    });
    expect(
      resolveAliases({ x: "#123456", y: "{x}", g: "linear-gradient({y} 0%, {x} 100%)" }),
    ).toMatchObject({ g: "linear-gradient(#123456 0%, #123456 100%)" });
    expect(resolveTheme({ fonts: { sans: "Lato" } }).fonts.serif).toBe("Lato");
  });
  it("rejects unknown, cyclic and non-string aliases", () => {
    expect(() => resolveAliases({ a: "{nope.b}" })).toThrow(/unknown alias/);
    expect(() => resolveAliases({ a: "{b}", b: "{a}" })).toThrow(/cycle/);
    expect(() => resolveAliases({ a: "{b}", b: 1 })).toThrow(/not a string/);
  });
  it.each([
    [{ ramps: { cyan: ["#000000"] } }, "ramps.cyan"],
    [{ surfaces: { canvas: "red" } }, "surfaces.canvas"],
    [{ glows: { primary: "red" } }, "glows.primary"],
    [{ categorical: [] }, "categorical"],
    [{ shape: { dim: "40%" } }, "shape.dim"],
    [{ shape: { border: "2px" } }, "shape.border"],
    [{ shape: { canvas: "#000000" } }, "shape.canvas"],
    [{ shape: { radius: "12" } }, "shape.radius"],
    [{ shape: { hairline: "red" } }, "shape.hairline"],
    [{ shape: { radius: "12px; color: red" } }, "shape.radius"],
  ])("rejects malformed tokens in %j", (override, problem) => {
    expect(() => resolveTheme(override)).toThrow(String(problem));
  });
  it("emits the original custom property names, shape defaults and RGB glow triplets", () => {
    const css = themeCss(resolveTheme());
    for (const property of [
      "--od-radius: 12px;",
      "--od-hairline: 1px;",
      "--od-card-width: 36;",
      "--od-dim: 0.4;",
      "--od-glow-primary-rgb: 6, 182, 212;",
    ])
      expect(css).toContain(property);
    expect(themeCss(resolveTheme({ shape: { radius: "4px" } }))).toContain("--od-radius: 4px;");
    expect(resolveTheme({ shape: { radius: "0.5rem", hairline: "0" } }).shape.radius).toBe(
      "0.5rem",
    );
  });
});
