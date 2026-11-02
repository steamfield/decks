// The social card satori renders for each page. satori lays out flexbox only
// (no grid) and reads TTF, OTF or WOFF fonts, never WOFF2.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

export type Card = { title: string; description: string; siteName: string };
type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };

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

/**
 * A cassette deck's faceplate: the page title in the VFD, the
 * description below it in Inter. Hardware colors match the player on the page.
 */
export function ogCard({ title, description, siteName }: Card): Node {
  const label = { fontSize: 18, letterSpacing: "0.18em", color: "#a1a1aa", fontWeight: 700 };
  return div(
    {
      // Content box: 1200x630 minus the padding.
      width: 1072,
      height: 518,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "56px 64px",
      background: "#111113",
      color: "#f7f8f8",
      fontFamily: "Inter",
    },
    [
      div({ display: "flex", justifyContent: "space-between", width: 1072, ...label }, [
        div({}, siteName.toUpperCase()),
        div({}, "DX-90"),
      ]),
      div(
        {
          display: "flex",
          // satori sizes content boxes: 1072 minus padding and border.
          width: 1004,
          padding: "28px 32px",
          background: "#09090b",
          border: "2px solid #000",
          borderRadius: "6px",
          color: "#92f8e2",
          fontFamily: "DSEG14",
          fontSize: 50,
          lineHeight: 1.35,
          letterSpacing: "0.04em",
        },
        clip(title.toUpperCase(), 64),
      ),
      div(
        { display: "flex", width: 1072, fontSize: 26, color: "#d0d6e0", lineHeight: 1.4 },
        clip(description, 110),
      ),
    ],
  );
}

/**
 * Inter from the installed @fontsource package and DSEG14 Classic from the dseg
 * package, read at build time; nothing is fetched. satori needs TTF, OTF or WOFF.
 */
export async function ogFonts() {
  const require = createRequire(import.meta.url);
  const load = (path: string) => readFile(require.resolve(path));
  const [regular, bold, dseg] = await Promise.all([
    load("@fontsource/inter/files/inter-latin-400-normal.woff"),
    load("@fontsource/inter/files/inter-latin-700-normal.woff"),
    load("dseg/fonts/DSEG14-Classic/DSEG14Classic-Regular.ttf"),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "DSEG14", data: dseg, weight: 400 as const, style: "normal" as const },
  ];
}
