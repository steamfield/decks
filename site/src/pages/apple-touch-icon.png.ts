import type { APIRoute } from "astro";
import { markPng } from "../lib/brand";

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await markPng(180, { framed: true })), {
    headers: { "Content-Type": "image/png" },
  });
