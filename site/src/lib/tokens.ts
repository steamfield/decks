// The landing page's colors, read at build time from the product's own theme
// (packages/decks/theme/default.json). The page canvas is the slide canvas, so
// the live deck sits flush in the hero. Every other surface is the theme's
// zinc tinted toward its own blue and violet, which gives the page a cast the
// slides don't have. Sections alternate between canvas and band, and a panel
// sits one step above the section it is in (landing.css moves --color-panel up
// to raised inside a band). The theme's hues mark meaning: provenance, run
// output, the hook's verdict, and the brand rule. BaseLayout
// writes these as CSS variables on the landing page only; docs keep the light
// and dark tokens in global.css.
import { readFileSync } from "node:fs";
import { join } from "node:path";

type ProductTheme = {
  surfaces: Record<"canvas" | "surface" | "surface-raised" | "muted", string>;
  text: Record<"primary" | "secondary" | "muted" | "faint", string>;
  borders: Record<"default" | "axis", string>;
  ramps: Record<"cyan" | "amber" | "rose" | "emerald" | "violet", [string, string, string, string]>;
  accents: Record<"blue", string>;
};

/** Mixes two #rrggbb colors: `t` of `b` into `a`. */
export function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => Number.parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) => Math.round(channel(a, i) * (1 - t) + channel(b, i) * t))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

// Builds and tests run from site/.
export const productTheme = (): ProductTheme =>
  JSON.parse(
    readFileSync(join(process.cwd(), "..", "packages/decks/theme/default.json"), "utf8"),
  ) as ProductTheme;

/** Token name (without --color-) to value, for the landing page. */
export function landingTokens(theme = productTheme()): Record<string, string> {
  const { cyan, amber, rose, emerald, violet } = theme.ramps;
  // The cast: halfway between the theme's violet and blue.
  const tint = mix(violet[0], theme.accents.blue, 0.5);
  return {
    // The surface ladder: canvas (page, hero, slide), band (alternate
    // sections), raised (controls, and panels inside a band).
    canvas: theme.surfaces.canvas,
    band: mix(theme.surfaces.surface, tint, 0.06),
    panel: mix(theme.surfaces.surface, tint, 0.06),
    raised: mix(theme.surfaces["surface-raised"], tint, 0.09),
    ink: theme.text.primary,
    "ink-2": theme.text.secondary,
    muted: theme.text.muted,
    // Hairlines: the theme's muted surface with the same cast, opaque so they
    // read the same on every step of the ladder.
    line: mix(theme.surfaces.muted, tint, 0.16),
    "line-strong": theme.text.faint,
    // Links and focus on dark surfaces: the light end of the cyan ramp.
    accent: cyan[3],
    // The deck frame: the slide's own canvas inside an axis-colored edge.
    frame: theme.surfaces.canvas,
    "frame-edge": theme.borders.axis,
    // Data and live state (progress, the counter): cyan.
    data: cyan[2],
    "data-dim": cyan[0],
    // The one action color: cyan step 2, with canvas-colored text on it.
    action: cyan[1],
    "action-ink": theme.surfaces.canvas,
    // Meaning, from the theme's ramps: how an example deck was made, and the
    // run's results (emerald passes, rose blocks).
    agent: cyan[2],
    talk: amber[2],
    template: violet[2],
    hand: emerald[2],
    pass: emerald[2],
    block: rose[2],
    // The brand rule's stops, the theme's step-2 hues.
    "rule-1": cyan[1],
    "rule-2": violet[1],
    "rule-3": rose[1],
    "rule-4": amber[1],
  };
}

/** The tokens as a CSS rule for the landing page's <html>. */
export function landingCss(tokens = landingTokens()): string {
  const vars = Object.entries(tokens)
    .map(([name, value]) => `--color-${name}:${value};`)
    .join("");
  return `html[data-page="landing"]{${vars}color-scheme:dark}`;
}
