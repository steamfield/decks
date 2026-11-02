// @vitest-environment node
// WCAG contrast for every token pair the site draws text or controls with, in
// both page themes, and for the hardware, which stays dark in both.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrast } from "../lib/contrast";

const css = readFileSync(new URL("./global.css", import.meta.url), "utf8");

/** The token values declared inside one block: `@theme static {` or `.dark {`. */
function block(opener: string) {
  const start = css.indexOf(opener);
  if (start === -1) throw new Error(`${opener} missing from global.css`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]),
  ) as Record<string, string>;
}

const light = block("@theme static {");
const dark = { ...light, ...block(".dark {") };
const themes = { light, dark };
const get = (tokens: Record<string, string>, name: string) => {
  const value = tokens[name];
  if (!value) throw new Error(`--color-${name} missing`);
  return value;
};

describe.each(Object.entries(themes))("%s page tokens", (_name, tokens) => {
  it.each(
    ["canvas", "panel"].flatMap((surface) =>
      ["ink", "ink-2", "muted", "accent"].map((fg) => [fg, surface]),
    ),
  )("%s text on %s is at least 4.5:1", (fg, surface) => {
    expect(contrast(get(tokens, fg), get(tokens, surface))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["canvas", "panel"])(
    "control borders (line-strong) on %s are at least 3:1",
    (surface) => {
      expect(contrast(get(tokens, "line-strong"), get(tokens, surface))).toBeGreaterThanOrEqual(3);
    },
  );
});

describe("the dark theme block matches the no-JavaScript fallback", () => {
  it("declares the same values in .dark and in the prefers-color-scheme block", () => {
    expect(block(":root:not(.light) {")).toEqual(block(".dark {"));
  });
});

describe("hardware tokens", () => {
  it.each(
    ["hw-face", "hw-raised", "hw-well"].flatMap((surface) =>
      ["hw-ink", "hw-ink-2", "hw-print", "live"].map((fg) => [fg, surface]),
    ),
  )("%s on %s is at least 4.5:1", (fg, surface) => {
    expect(contrast(get(light, fg), get(light, surface))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["silver-hi", "silver-lo"])("button labels on %s are at least 4.5:1", (surface) => {
    expect(contrast(get(light, "silver-ink"), get(light, surface))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps unlit segments well below the lit amber", () => {
    expect(contrast(get(light, "live-off"), get(light, "hw-well"))).toBeLessThan(1.5);
  });

  it("is not redefined by the dark page theme", () => {
    for (const name of Object.keys(light).filter((key) => /^(hw|live|silver)/.test(key))) {
      expect(block(".dark {")[name], name).toBeUndefined();
    }
  });
});
