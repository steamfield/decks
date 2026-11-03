// The Decks mark: two slides on the diagonal, cyan in front of violet, in the
// product theme's own ramps. Every brand asset is built from this one geometry at
// build time: the header mark (Logo.astro), the favicons, the touch and manifest
// icons (src/pages/*.ts) and the mark on the social card (og.ts).
import sharp from "sharp";
import { productTheme } from "./tokens";

/**
 * The back slide with the front one (plus a 1.5-unit gap) cut out, drawn as one
 * path so the mark needs no mask and no ids: it can repeat on a page and survive
 * any renderer. On a 32-unit square.
 */
export const MARK = {
  back: "M12 4.75H27a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3h-2.5v-3.5a4.5 4.5 0 0 0-4.5-4.5H9v-3.5a3 3 0 0 1 3-3Z",
  front: { x: 2, y: 12.75, width: 21, height: 14.5, rx: 3 },
} as const;
const { x, y, width, height, rx } = MARK.front;
const FRONT = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}"`;

export type MarkColors = { front: string; back: string };

/** Ramp step 2: reads on light and dark grounds alike. */
export function markColors(theme = productTheme()): MarkColors {
  return { front: theme.ramps.cyan[1], back: theme.ramps.violet[1] };
}

/** Ramp step 3, for dark grounds only. */
export function markColorsDark(theme = productTheme()): MarkColors {
  return { front: theme.ramps.cyan[2], back: theme.ramps.violet[2] };
}

/** The mark's inner SVG (no root element), for inlining. */
export function markShapes({ front, back }: MarkColors): string {
  return `<path fill="${back}" d="${MARK.back}"/>${FRONT} fill="${front}"/>`;
}

/** A standalone SVG of the mark. `padding` (in 32-unit space) and `background` frame it for icons. */
export function markSvg(
  colors: MarkColors,
  { padding = 0, background }: { padding?: number; background?: string } = {},
): string {
  const box = 32 + 2 * padding;
  const ground = background
    ? `<rect x="${-padding}" y="${-padding}" width="${box}" height="${box}" fill="${background}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-padding} ${-padding} ${box} ${box}">${ground}${markShapes(colors)}</svg>`;
}

/** The SVG favicon: step 2 hues, swapped for step 3 when the browser chrome is dark. */
export function faviconSvg(theme = productTheme()): string {
  const light = markColors(theme);
  const dark = markColorsDark(theme);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>Decks</title>` +
    `<style>.f{fill:${light.front}}.b{fill:${light.back}}` +
    `@media (prefers-color-scheme:dark){.f{fill:${dark.front}}.b{fill:${dark.back}}}</style>` +
    `<path class="b" d="${MARK.back}"/>${FRONT} class="f"/></svg>`
  );
}

/** The web manifest's icon sizes, served at /icon-<size>.png. */
export const ICON_SIZES = [192, 512] as const;

/**
 * A square PNG of the mark. Home-screen and manifest icons sit on the slide
 * canvas with room around the mark (iOS and Android fill transparency with
 * their own color and crop to their own shape); the favicon fallbacks stay
 * transparent and edge to edge.
 */
export async function markPng(
  size: number,
  {
    framed = false,
    theme = productTheme(),
  }: { framed?: boolean; theme?: ReturnType<typeof productTheme> } = {},
): Promise<Buffer> {
  const svg = framed
    ? markSvg(markColorsDark(theme), { padding: 8, background: theme.surfaces.canvas })
    : markSvg(markColors(theme));
  return sharp(Buffer.from(svg), { density: (72 * size) / 16 })
    .resize(size, size)
    .png()
    .toBuffer();
}

/** An ICO container holding the given square PNGs (the format allows PNG payloads since Vista). */
export function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}
