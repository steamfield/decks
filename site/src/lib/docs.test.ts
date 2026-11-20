import { describe, expect, it } from "vitest";
import {
  type DocEntry,
  docsNav,
  llmsFull,
  llmsIndex,
  outline,
  pageLinks,
  toMarkdownExport,
} from "./docs";

const groups = [
  { id: "getting-started", label: "Getting started" },
  { id: "concepts", label: "Concepts" },
  { id: "reference", label: "Reference" },
];
const doc = (id: string, data: Partial<DocEntry["data"]>): DocEntry => ({
  id,
  data: { title: id, description: `About ${id}`, group: "getting-started", order: 100, ...data },
  body: `Body of ${id}.`,
});
const entries = [
  doc("reference/config", { title: "Configuration", group: "reference" }),
  doc("getting-started/later", { title: "Later", order: 2 }),
  doc("getting-started/install", { title: "Installation", order: 1, sidebarLabel: "Install" }),
];
const site = { name: "Acme", tagline: "Notes search.", url: "https://example.com" };

describe("docsNav", () => {
  it("orders groups by config and pages by order, dropping empty groups", () => {
    const nav = docsNav(entries, groups);
    expect(nav.map((group) => group.id)).toEqual(["getting-started", "reference"]);
    expect(nav[0]?.items.map((item) => item.label)).toEqual(["Install", "Later"]);
  });

  it("breaks order ties by title", () => {
    const tied = [doc("b", { title: "Beta" }), doc("a", { title: "Alpha" })];
    expect(docsNav(tied, groups)[0]?.items.map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("pageLinks", () => {
  const nav = docsNav(entries, groups);

  it("links across group boundaries", () => {
    const links = pageLinks(nav, "getting-started/later");
    expect(links.prev?.id).toBe("getting-started/install");
    expect(links.next?.id).toBe("reference/config");
  });

  it("has no previous page at the start and none for an unknown id", () => {
    expect(pageLinks(nav, "getting-started/install").prev).toBeUndefined();
    expect(pageLinks(nav, "missing")).toEqual({ prev: undefined, next: undefined });
  });
});

describe("agent-readable exports", () => {
  const nav = docsNav(entries, groups);

  it("exports a page as Markdown with its title and description", () => {
    expect(toMarkdownExport(entries[2] as DocEntry)).toBe(
      "# Installation\n\n> About getting-started/install\n\nBody of getting-started/install.\n",
    );
  });

  it("keeps the body's links as written and trims it", () => {
    const body = [
      "",
      "See [Quickstart](/docs/getting-started/quickstart/) and [CLI](../reference/cli/).",
      "",
      "```md",
      "[a](/docs/x/)",
      "```",
      "",
    ].join("\n");
    const entry = { ...(entries[2] as DocEntry), body };
    expect(toMarkdownExport(entry)).toBe(
      `# Installation\n\n> About getting-started/install\n\n${body.trim()}\n`,
    );
  });

  it("lists every page in llms.txt by group with absolute Markdown URLs", () => {
    const text = llmsIndex(site, nav);
    expect(text).toContain("# Acme\n\n> Notes search.");
    expect(text).toContain(
      "## Reference\n\n- [Configuration](https://example.com/docs/reference/config.md): About reference/config",
    );
  });

  it("concatenates every page in sidebar order in llms-full.txt", () => {
    const text = llmsFull(site, nav, entries);
    expect(text.indexOf("# Installation")).toBeLessThan(text.indexOf("# Later"));
    expect(text.indexOf("# Later")).toBeLessThan(text.indexOf("# Configuration"));
  });
});

describe("outline", () => {
  const signatures = [
    ["decks new <alias> [dir] [--story]", "decks new"],
    ["decks check", "decks check"],
    ["decks lint [alias...] [--stdin]", "decks lint"],
    ["decks hook lint|prompt", "decks hook"],
    ["decks init [--force]", "decks init"],
  ] as const;
  const body = [
    ...signatures.map(([text]) => `## \`${text}\`\n\nText.`),
    "## Share image",
    "### `decks dev <deck>`",
  ].join("\n\n");
  const headings = [
    ...signatures.map(([text]) => ({ depth: 2, slug: text, text })),
    { depth: 2, slug: "share-image", text: "Share image" },
    { depth: 3, slug: "dev", text: "decks dev <deck>" },
  ];

  it("labels a code-only h2 with its command and keeps prose h2s", () => {
    expect(outline(headings, body)).toEqual([
      ...signatures.map(([text, label]) => ({ slug: text, label, code: true })),
      { slug: "share-image", label: "Share image", code: false },
    ]);
  });

  it("leaves an h2 that only contains code among prose as it is", () => {
    expect(
      outline([{ depth: 2, slug: "x", text: "Run decks check" }], "## Run `decks check`\n"),
    ).toEqual([{ slug: "x", label: "Run decks check", code: false }]);
  });
});
