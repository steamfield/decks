// Public product metadata. Every landing section reads from here; a section whose
// value is empty (null or an empty list) doesn't render. The copy comes from the
// repository's README and AGENTS.md, and src/content-drift.test.ts checks every
// command shown here against packages/decks/scripts/deck.mjs and the package's
// package.json.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Link = { label: string; href: string };
export type InstallOption = { label: string; command: string };
export type FooterColumn = { title: string; links: Link[] };
export type Comparison = { topic: string; vclick: string; decks: string };
export type Requirement = { label: string; text: string };

const repo = "https://github.com/steamfield/decks";
/**
 * Every decks command runs through the package: the bare `decks` on npm is
 * unrelated. bunx and npx pin it with -p; pnpm has no -p, so `pnpm exec` runs
 * the bin the `pnpm add` line above it installed.
 */
const run = (runner: "bunx" | "npx" | "pnpm", args: string) =>
  runner === "pnpm" ? `pnpm exec decks ${args}` : `${runner} -p slidev-addon-decks decks ${args}`;
const peers = "slidev-addon-decks @slidev/cli slidev-theme-the-unnamed";

/** packages/decks/package.json, read at build time. */
function packageJson(): { version?: string; license?: string } {
  try {
    // Builds and tests run from site/; import.meta.url points into dist/ once bundled.
    return JSON.parse(
      readFileSync(join(process.cwd(), "..", "packages/decks/package.json"), "utf8"),
    );
  } catch {
    // Built outside the decks repository: hide the version and the license.
    return {};
  }
}
const pkg = packageJson();
const license = pkg.license ?? "";

export const site = {
  name: "Decks",
  /** The npm package. Titles lead with it, since "Decks" alone is unsearchable. */
  packageName: "slidev-addon-decks",
  /** The home page's <title> and OG title. */
  title: "Decks: slide decks about data, written with Claude Code (slidev-addon-decks)",
  /** The H1. */
  tagline: "Slide decks about data, written with Claude Code",
  description:
    "Decks is a Claude Code setup and a set of Slidev components for talks about data. You describe the talk, and the agent finds sourced numbers, writes the slides and checks them.",
  /** Absolute production URL: canonicals, the sitemap, OG images and llms.txt use it. */
  url: "https://decks.steamfield.io",
  repo,
  /** Current release, shown in the header. Empty hides it. */
  version: pkg.version ?? "",
  announcement: null as Link | null,
  /** The hero's install block: three lines, one copy button. */
  quickstart: [`bun add ${peers}`, run("bunx", "init"), run("bunx", "new my-talk --story")],
  /** Shown under the hero's install block. */
  price: license ? `Free, ${license}` : "Free",
  install: [
    {
      label: "bun",
      command: [`bun add ${peers}`, run("bunx", "init"), run("bunx", "new my-talk --story")].join(
        "\n",
      ),
    },
    {
      label: "npm",
      command: [`npm i ${peers}`, run("npx", "init"), run("npx", "new my-talk --story")].join("\n"),
    },
    {
      label: "pnpm",
      command: [`pnpm add ${peers}`, run("pnpm", "init"), run("pnpm", "new my-talk --story")].join(
        "\n",
      ),
    },
  ] as InstallOption[],
  /** The dev server for the new deck, named in "What you get". */
  devCommand: run("bunx", "dev my-talk"),
  /** Section 2. The only place the page lists what Decks needs and what it can't do. */
  requirements: [
    {
      label: "Agent",
      text: "Claude Code. Other agents can read the AGENTS.md block, but decks init doesn't install or test a setup for them.",
    },
    {
      label: "Slides",
      text: "Slidev with the slidev-theme-the-unnamed base theme. Every slide is dark; there is no light slide theme.",
    },
    {
      label: "Runtime",
      text: "Node 20.19+ or 22.12+ (Vite's minimum). Bun is optional.",
    },
    {
      label: "Export",
      text: "PDF only, through Chromium. No Keynote or PowerPoint files.",
    },
    {
      label: "Charts",
      text: "OpenChart 9.0.0-rc.2, a release candidate.",
    },
  ] as Requirement[],
  /** Section 3: a few words per file `decks init` and `decks new my-talk --story` write. */
  files: {
    ".claude/agents/deck-author.md": "the agent that builds or revises one deck",
    ".claude/skills/building-a-deck/SKILL.md": "scaffold, write, check, build",
    ".claude/skills/fact-checking-a-deck/SKILL.md": "re-runs the source behind every figure",
    ".claude/rules/deck-writing.md": "headline, bullet and word budgets",
    ".claude/rules/deck-patterns.md": "layouts, type and chart specs",
    ".claude/rules/deck-data.md": "where each figure's source goes",
    ".claude/rules/story-stage.md": "how a story slide is written",
    ".claude/rules/prose-patterns.md": "the AI-prose patterns the hook blocks",
    ".claude/rules/project-glossary.md": "your terms; starts empty",
    ".claude/hooks/decks.sh": "runs the package's lint and prompt hooks",
    ".claude/settings.json": "the two hook entries, merged into yours",
    ".claude/decks.json": "the files init wrote, with their hashes",
    "AGENTS.md": "a marked Decks block with the commands",
    "CLAUDE.md": "imports AGENTS.md",
    "decks.json": "the deck registry",
    "decks/my-talk/slides.md": "headmatter and the page list",
    "decks/my-talk/pages/01-cover.md": "the cover",
    "decks/my-talk/pages/02-first.md": "the first story slide",
    "decks/my-talk/components/FirstStage.vue": "its chart and captions, step by step",
    "decks/my-talk/data/first.ts": "its figures, each with a source comment",
    "decks/my-talk/data-sources.md": "slide-by-slide sources for the fact-check",
    "decks/my-talk/styles/index.css": "deck-only CSS",
  } as Record<string, string>,
  /** Section 5: three differences from v-click plus a chart library. */
  compare: [
    {
      topic: "Going back",
      vclick:
        "Each click toggles an element, so going back makes the chart jump to its earlier state.",
      decks:
        "The chart is drawn from the click count, so going back plays the animation in reverse.",
    },
    {
      topic: "Captions",
      vclick:
        "Captions are separate elements that you reveal alongside the chart and keep in sync by hand.",
      decks: "The caption is a card next to the chart, and its text changes at each step.",
    },
    {
      topic: "The next slide",
      vclick: "Each slide mounts its own chart, so the next slide starts empty.",
      decks: "A chart can stay on screen from one slide into the next.",
    },
  ] as Comparison[],
  footer: [
    {
      title: "Product",
      links: [
        { label: "Install", href: "/#install" },
        { label: "Changelog", href: `${repo}/blob/main/CHANGELOG.md` },
        { label: "npm", href: "https://www.npmjs.com/package/slidev-addon-decks" },
      ],
    },
    {
      title: "Docs",
      links: [
        { label: "Quickstart", href: "/docs/getting-started/quickstart/" },
        { label: "decks CLI", href: "/docs/reference/cli/" },
        { label: "llms.txt", href: "/llms.txt" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "GitHub", href: repo },
        { label: "Issues", href: `${repo}/issues` },
        { label: "Steamfield", href: "https://steamfield.io" },
      ],
    },
  ] as FooterColumn[],
  social: [{ label: "GitHub", href: repo }] as Link[],
  releasesUrl: `${repo}/blob/main/CHANGELOG.md`,
  /** From the package's package.json. */
  license,
  /** Components that hydrate on the landing page. The build test fails on any other island. */
  islands: ["DeckPlayer", "InstallTabs"],
};

/** Docs sidebar groups, in order. A page's `group` frontmatter must be one of these ids. */
export const docsGroups = [
  { id: "getting-started", label: "Getting started" },
  { id: "concepts", label: "Concepts" },
  { id: "guides", label: "Guides" },
  { id: "reference", label: "Reference" },
] as const;

export type DocsGroupId = (typeof docsGroups)[number]["id"];

if (!["https:", "http:"].includes(new URL(site.url).protocol)) {
  throw new Error("Set site.url to an absolute HTTP or HTTPS production URL.");
}
