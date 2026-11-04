import { existsSync } from "node:fs";
import { join } from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";
import satori from "satori";
import sharp from "sharp";
import { site } from "../../config";
import { EXAMPLE_NAMES } from "../../data/examples";
import { getDocs } from "../../lib/collection";
import { type Card, ogCard, ogFonts, stillDataUrl } from "../../lib/og";

// One card per page: /og/index.png for the landing page, /og/docs/<id>.png per doc.
export const getStaticPaths = (async () => {
  const docs = await getDocs();
  const siteName = `${site.name} · ${site.packageName}`;
  const landing = {
    title: site.tagline,
    description: "A Slidev addon for interactive charts and data storytelling.",
    siteName,
  };
  return [
    { params: { slug: "index" }, props: landing },
    ...docs.map((doc) => ({
      params: { slug: `docs/${doc.id}` },
      props: { title: doc.data.title, description: doc.data.description, siteName },
    })),
  ];
}) satisfies GetStaticPaths;

// The hero deck's poster, shot by `make demo`; the card leaves the slide out without it.
const poster = join(process.cwd(), "public/posters", `${EXAMPLE_NAMES[0]}-1280.webp`);
let still: Promise<string | null> | null = null;

export const GET: APIRoute<Card> = async ({ props }) => {
  still ??= existsSync(poster) ? stillDataUrl(poster) : Promise.resolve(null);
  const svg = await satori(ogCard(props, await still) as never, {
    width: 1200,
    height: 630,
    fonts: await ogFonts(),
  });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
