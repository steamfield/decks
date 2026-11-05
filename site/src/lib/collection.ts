import { getCollection } from "astro:content";
import type { DocEntry } from "./docs";

/** The only module pages import astro:content through. */
export async function getDocs(): Promise<DocEntry[]> {
  const entries = await getCollection("docs");
  return entries.map(({ id, data, body }) => ({ id, data, body: body ?? "" }));
}

export { render } from "astro:content";
export const getDocEntries = () => getCollection("docs");

/** Newest first, with a stable id tie-break for posts published together. */
export async function getBlog() {
  const entries = await getCollection("blog");
  return entries
    .map((entry) => ({ ...entry, body: entry.body ?? "" }))
    .sort(
      (a, b) => b.data.published.getTime() - a.data.published.getTime() || a.id.localeCompare(b.id),
    );
}
