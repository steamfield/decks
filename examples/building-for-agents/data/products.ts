/**
 * The five products, in the order work flows through them. The one source
 * for names, verbs, language chips and pixel icons: the thread rail and every
 * name plate read this file.
 *
 * Names, casing and order: OUTLINE.md section 3.
 * Icons: copied from ~/Projects/steamfield/src/data/pixel-icons.ts (read
 * 2026-11-13, steamfield commit 53a1a06). One character per pixel: "." is
 * empty; p, c, y, v, w are pink, cyan, yellow, violet and white.
 * Languages: read from each repo on 2026-11-13; sourced in data-sources.md
 * under "Every slide: product chips".
 */

export type ProductId = "stacks" | "foreman" | "rr" | "statglass" | "decks";

export interface Product {
  id: ProductId;
  name: string;
  /** The step this product is in the thread. */
  verb: string;
  /** What its language chip says. */
  lang: string;
  /** Its landing page, linked from the thread rail. */
  site: string;
  icon: readonly string[];
}

export const PRODUCTS: readonly Product[] = [
  {
    id: "stacks",
    name: "Stacks",
    verb: "Start",
    lang: "TypeScript · Effect 4",
    site: "https://stacks.steamfield.io",
    icon: [
      "....yyyy....",
      "....yyyy....",
      "............",
      "..pppppppp..",
      "..pppppppp..",
      "............",
      ".cccccccccc.",
      ".cccccccccc.",
      "............",
      "vvvvvvvvvvvv",
      "vvvvvvvvvvvv",
      "............",
    ],
  },
  {
    id: "foreman",
    name: "foreman",
    verb: "Delegate",
    lang: "TypeScript · Effect 4",
    site: "https://foreman.steamfield.io",
    icon: [
      "............",
      "vv..cc..pp..",
      ".vv..cc..pp.",
      "..vv..cc..pp",
      "...vv..cc..p",
      "....vv..cc.p",
      "...vv..cc..p",
      "..vv..cc..pp",
      ".vv..cc..pp.",
      "vv..cc..pp..",
      "............",
      "............",
    ],
  },
  {
    id: "rr",
    name: "rr",
    verb: "Test",
    lang: "Go",
    site: "https://rr.steamfield.io",
    icon: [
      "cccccccccccc",
      "c..........c",
      "c.p........c",
      "c..p.......c",
      "c...p......c",
      "c..p.......c",
      "c.p..yyyy..c",
      "c..........c",
      "cccccccccccc",
      "....cccc....",
      "..cccccccc..",
      "............",
    ],
  },
  {
    id: "statglass",
    name: "StatGlass",
    verb: "Watch",
    lang: "Rust + TypeScript",
    site: "https://statglass.steamfield.io",
    icon: [
      "...cccc.....",
      "..c....c....",
      ".c...p..c...",
      ".c...p..c...",
      ".c..pp..c...",
      ".c.ppp..c...",
      "..c....c....",
      "...cccc.y...",
      ".......yy...",
      "........yy..",
      ".........yy.",
      "..........y.",
    ],
  },
  {
    id: "decks",
    name: "Decks",
    verb: "Present",
    lang: "TypeScript · React",
    site: "https://decks.steamfield.io",
    icon: [
      "............",
      "....vvvvvvvv",
      "....vvvvvvvv",
      "....vvvvvvvv",
      ".........vvv",
      "cccccccc.vvv",
      "cccccccc.vvv",
      "cccccccc.vvv",
      "cccccccc....",
      "cccccccc....",
      "cccccccc....",
      "............",
    ],
  },
];

export function product(id: ProductId): Product {
  const found = PRODUCTS.find((p) => p.id === id);
  if (!found) throw new Error(`products: unknown id ${id}`);
  return found;
}
