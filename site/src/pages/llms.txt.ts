import type { APIRoute } from "astro";
import { docsGroups, site } from "../config";
import { blogLlmsIndex } from "../lib/blog";
import { getBlog, getDocs } from "../lib/collection";
import { docsNav, llmsIndex } from "../lib/docs";

export const GET: APIRoute = async () =>
  new Response(
    `${llmsIndex(site, docsNav(await getDocs(), docsGroups))}\n${blogLlmsIndex(await getBlog())}`,
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
