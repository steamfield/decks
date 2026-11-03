// The social card satori renders for each page: the page title over a real slide
// still (the hero deck's poster from `make demo`), in the product's own colors.
// satori lays out flexbox only (no grid), reads TTF, OTF or WOFF fonts (never
// WOFF2) and PNG or JPEG images, so the WebP poster is converted at build time.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import sharp from "sharp";
import { landingTokens } from "./tokens";

export type Card = { title: string; description: string; siteName: string };
type Node = { type: string; props: Record<string, unknown> };

const div = (style: Record<string, unknown>, children: unknown): Node => ({
  type: "div",
  props: { style, children },
});

/** Clips text to `max` characters on a word boundary so long titles never overflow the card. */
export function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

/** The still: 560x315 at the card's lower right, framed like the player's deck. */
const STILL = { width: 560, height: 315 } as const;

/** The card layout. `still` is a PNG data URL, or null to leave the slide out. */
export function ogCard({ title, description, siteName }: Card, still: string | null): Node {
  const color = landingTokens();
  return div(
    {
      // Content box: 1200x630 minus the padding.
      width: 1088,
      height: 534,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "48px 56px",
      background: color.canvas,
      color: color.ink,
      fontFamily: "Inter",
    },
    [
      div({ display: "flex", flexDirection: "column", width: 1088 }, [
        div({ display: "flex", fontSize: 22, color: color.muted, marginBottom: 16 }, siteName),
        div(
          { display: "flex", fontSize: 54, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1 },
          clip(title, 72),
        ),
      ]),
      div(
        { display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: 1088 },
        [
          div(
            { display: "flex", width: 470, fontSize: 24, lineHeight: 1.4, color: color["ink-2"] },
            clip(description, 120),
          ),
          still
            ? {
                type: "img",
                props: {
                  src: still,
                  width: STILL.width,
                  height: STILL.height,
                  style: {
                    borderRadius: 12,
                    border: `8px solid ${color.panel}`,
                    boxSizing: "content-box",
                  },
                },
              }
            : div({ display: "flex" }, ""),
        ],
      ),
    ],
  );
}

/** The poster at `path` as a PNG data URL the card can embed. */
export async function stillDataUrl(path: string): Promise<string> {
  const png = await sharp(path)
    .resize(STILL.width * 2, STILL.height * 2)
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

/** Inter from the installed @fontsource package, read at build time; nothing is fetched. */
export async function ogFonts() {
  const require = createRequire(import.meta.url);
  const load = (path: string) => readFile(require.resolve(path));
  const [regular, bold] = await Promise.all([
    load("@fontsource/inter/files/inter-latin-400-normal.woff"),
    load("@fontsource/inter/files/inter-latin-700-normal.woff"),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}
