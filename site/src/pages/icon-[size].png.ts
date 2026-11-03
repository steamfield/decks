import type { APIRoute, GetStaticPaths } from "astro";
import { ICON_SIZES, markPng } from "../lib/brand";

// The web manifest's icons. Framed on the slide canvas with the mark inside the
// maskable safe zone, so one file serves both "any" and "maskable".
export const getStaticPaths = (() =>
  ICON_SIZES.map((size) => ({ params: { size: String(size) } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  new Response(new Uint8Array(await markPng(Number(params.size), { framed: true })), {
    headers: { "Content-Type": "image/png" },
  });
