// The landing page's colors, read at build time from the product's own theme
// (packages/decks/theme/default.json), so the page around the deck uses the
// deck's palette. The page sits one step lighter than the slide canvas, so the
// deck reads as an object on it. BaseLayout writes these as CSS variables on the
// landing page only; docs keep the light and dark tokens in global.css.
import { readFileSync } from "node:fs";
import { join } from "node:path";

type ProductTheme = {
  surfaces: Record<"canvas" | "surface" | "surface-raised" | "muted", string>;
  text: Record<"primary" | "secondary" | "muted" | "faint", string>;
  borders: Record<"default" | "axis", string>;
  ramps: Record<"cyan" | "amber", [string, string, string, string]>;
};

// Builds and tests run from site/.
export const productTheme = (): ProductTheme =>
  JSON.parse(
    readFileSync(join(process.cwd(), "..", "packages/decks/theme/default.json"), "utf8"),
  ) as ProductTheme;

/** Token name (without --color-) to value, for the landing page. */
export function landingTokens(theme = productTheme()): Record<string, string> {
  return {
    // Page surfaces: one and two steps above the slide canvas.
    canvas: "#10151d",
    panel: "#19222e",
    ink: "#edf2f8",
    "ink-2": "#b8c5d5",
    muted: "#a7b6c9",
    line: "#344253",
    "line-strong": theme.text.faint,
    accent: "#9bdcff",
    // The deck frame: the slide's own canvas inside an axis-colored edge.
    frame: theme.surfaces.canvas,
    "frame-edge": theme.borders.axis,
    // Data and live state (step pips, the counter): the cyan ramp.
    data: "#9bdcff",
    "data-dim": theme.ramps.cyan[0],
    // The one action color: amber step 2, with canvas-colored text on it.
    action: "#9bdcff",
    "action-ink": "#10151d",
  };
}

/** The tokens as a CSS rule for the landing page's <html>. */
export function landingCss(tokens = landingTokens()): string {
  const vars = Object.entries(tokens)
    .map(([name, value]) => `--color-${name}:${value};`)
    .join("");
  return `html[data-page="landing"]{${vars}color-scheme:dark}`;
}
