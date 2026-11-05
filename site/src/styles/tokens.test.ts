// @vitest-environment node
// WCAG contrast for every token pair the site draws text or controls with: the
// docs in both page themes, and the landing page, which is dark only and takes
// its colors from the product's default.json.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrast } from "../lib/contrast";
import { landingCss, landingTokens, productTheme } from "../lib/tokens";

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

describe("landing page tokens", () => {
  const tokens = landingTokens();
  const theme = productTheme();

  it("keeps the slide canvas as the page canvas and tints the rest toward the theme's blue-violet", () => {
    expect(tokens.canvas).toBe(theme.surfaces.canvas);
    expect(tokens.frame).toBe(tokens.canvas);
    expect(tokens.action).toBe(theme.ramps.cyan[1]);
    for (const surface of ["band", "raised", "line"]) {
      const [r = 0, , b = 0] = [1, 3, 5].map((i) =>
        Number.parseInt(get(tokens, surface).slice(i, i + 2), 16),
      );
      expect(b).toBeGreaterThan(r);
    }
  });

  it("keeps the alternating section bands distinguishable from the canvas", () => {
    // A theme edit that flattens band into canvas would merge every section.
    expect(contrast(get(tokens, "band"), get(tokens, "canvas"))).toBeGreaterThanOrEqual(1.08);
    expect(contrast(get(tokens, "raised"), get(tokens, "band"))).toBeGreaterThanOrEqual(1.08);
  });

  it.each(
    ["canvas", "band", "raised"].flatMap((surface) =>
      ["agent", "talk", "template", "hand", "pass", "block"].map((hue) => [hue, surface]),
    ),
  )("the %s hue on %s is readable as text (4.5:1)", (hue, surface) => {
    expect(contrast(get(tokens, hue), get(tokens, surface))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(
    ["canvas", "band", "raised"].flatMap((surface) =>
      ["ink", "ink-2", "muted", "accent", "data"].map((fg) => [fg, surface]),
    ),
  )("%s text on %s is at least 4.5:1", (fg, surface) => {
    expect(contrast(get(tokens, fg), get(tokens, surface))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["canvas", "band", "raised"])(
    "control borders (line-strong) on %s are at least 3:1",
    (surface) => {
      expect(contrast(get(tokens, "line-strong"), get(tokens, surface))).toBeGreaterThanOrEqual(3);
    },
  );

  it("puts readable text on the action color", () => {
    expect(contrast(get(tokens, "action-ink"), get(tokens, "action"))).toBeGreaterThanOrEqual(4.5);
    for (const surface of ["canvas", "band", "raised"])
      expect(contrast(get(tokens, "action"), get(tokens, surface))).toBeGreaterThanOrEqual(3);
  });

  it("writes every token as a variable on the landing page's root", () => {
    const css = landingCss(tokens);
    expect(css.startsWith('html[data-page="landing"]{')).toBe(true);
    for (const name of Object.keys(tokens)) expect(css).toContain(`--color-${name}:`);
  });
});

it("emits the same player tokens for a demo selector without changing the page root", () => {
  const tokens = landingTokens();
  const css = landingCss(tokens, "[data-demo]");
  expect(css.startsWith("[data-demo]{")).toBe(true);
  expect(css).not.toContain('html[data-page="landing"]');
  for (const [name, value] of Object.entries(tokens))
    expect(css).toContain(`--color-${name}:${value};`);
  expect(css).toContain("color-scheme:dark");
});
