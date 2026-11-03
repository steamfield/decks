import type { APIRoute } from "astro";
import { ico, markPng } from "../lib/brand";

// For browsers and crawlers that ask for /favicon.ico without reading the page.
export const GET: APIRoute = async () => {
  const images = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, png: await markPng(size) })),
  );
  return new Response(new Uint8Array(ico(images)), { headers: { "Content-Type": "image/x-icon" } });
};
