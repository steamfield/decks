import type { APIRoute } from "astro";
import { site } from "../config";
import { ICON_SIZES } from "../lib/brand";
import { productTheme } from "../lib/tokens";

export const GET: APIRoute = () => {
  const canvas = productTheme().surfaces.canvas;
  const manifest = {
    name: `${site.name} (${site.packageName})`,
    short_name: site.name,
    start_url: "/",
    display: "browser",
    background_color: canvas,
    theme_color: canvas,
    icons: ICON_SIZES.map((size) => ({
      src: `/icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any maskable",
    })),
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
};
