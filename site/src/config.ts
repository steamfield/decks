// Public product metadata. Every landing section reads from here; a section whose
// value is empty (null or an empty list) doesn't render. The copy comes from the
// repository's README and AGENTS.md, and src/content-drift.test.ts checks every
// command shown here against packages/decks/scripts/deck.mjs and the package's
// package.json.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Link = { label: string; href: string };
export type InstallOption = { label: string; command: string };
export type Track = { name: string; note: string; href: string };
export type FooterColumn = { title: string; links: Link[] };
export type Comparison = { topic: string; vclick: string; decks: string };

const repo = "https://github.com/steamfield/decks";

/** The package's version, read from packages/decks/package.json at build time. */
function packageVersion(): string {
  try {
    // Builds and tests run from site/; import.meta.url points into dist/ once bundled.
    const pkg = readFileSync(join(process.cwd(), "..", "packages/decks/package.json"), "utf8");
    return (JSON.parse(pkg) as { version?: string }).version ?? "";
  } catch {
    // Built outside the decks repository: hide the version.
    return "";
  }
}

export const site = {
  name: "Decks",
  /** The npm package. Titles lead with it, since "Decks" alone is unsearchable. */
  packageName: "slidev-addon-decks",
  tagline: "Slide decks where the chart and the argument move together.",
  description:
    "A Slidev addon for data talks. Story slides step a chart through beats on the arrow keys and rewind cleanly, with chart, annotation and slide-chrome components and a CLI that scaffolds, builds and exports decks.",
  /** Absolute production URL: canonicals, the sitemap, OG images and llms.txt use it. */
  url: "https://decks.steamfield.io",
  repo,
  /** Current release, shown in the header. Empty hides it. */
  version: packageVersion(),
  announcement: null as Link | null,
  /** The hero block. Both lines copy as one: `decks` on npm is an unrelated package. */
  quickstart: [
    "bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed",
    "bunx decks new my-talk --story",
  ],
  install: [
    {
      label: "bun",
      command:
        "bun add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed\nbunx decks new my-talk --story",
    },
    {
      label: "npm",
      command:
        "npm i slidev-addon-decks @slidev/cli slidev-theme-the-unnamed && npx decks new my-talk --story",
    },
    {
      label: "pnpm",
      command:
        "pnpm add slidev-addon-decks @slidev/cli slidev-theme-the-unnamed && pnpm exec decks new my-talk --story",
    },
  ] as InstallOption[],
  /** Shown under the install tabs: the next command in the new project. */
  afterInstall: ["bunx decks dev my-talk"],
  clone: "git clone https://github.com/steamfield/decks.git",
  requirements: [
    "Node 20.19+ or 22.12+ (Vite's minimum). The decks command and Slidev run on Node.",
    "Bun is optional for a project using the package. A clone of the repository needs it for the workspace and scripts.",
    "Chromium for PDF export and for the shot and snap scripts.",
  ],
  fit: {
    yes: [
      "You use Slidev, or will.",
      "Your talk has numbers that build up over several steps.",
      "You're fine with a dark theme on slidev-theme-the-unnamed.",
      "You have Node 20.19+ or 22.12+.",
    ],
    no: [
      "You need light slides. Themes stay dark.",
      "You need a base theme other than slidev-theme-the-unnamed.",
      "You need Keynote or PowerPoint files. Export is PDF.",
      "You need a stable chart library today. OpenChart is at 9.0.0-rc.2.",
    ],
  },
  /** Section 4: three differences from v-click plus a chart library. */
  compare: [
    {
      topic: "Going back",
      vclick:
        "Each click shows or hides an element. Stepping back snaps the chart to its earlier state.",
      decks:
        "The beat timeline is a function of the click count, so stepping back replays the transition in reverse.",
    },
    {
      topic: "The words",
      vclick:
        "Captions are separate elements you reveal next to the chart and keep in step by hand.",
      decks: "Prose sits in a floating card whose copy changes per beat, next to the chart.",
    },
    {
      topic: "Across slides",
      vclick: "Each slide mounts its own chart, so the next slide starts from nothing.",
      decks: "A visual can carry over from one slide to the next.",
    },
  ] as Comparison[],
  /** Section 5: the J-card. Side A is the npm package, side B is the repository. */
  jcard: {
    a: [
      {
        name: "Story engine",
        note: "slidev-addon-decks/story",
        href: "/docs/concepts/beats-and-the-story-timeline/",
      },
      { name: "Ink marks", note: "InkLine, InkBars, InkChip", href: "/docs/concepts/ink-marks/" },
      {
        name: "OpenChart wrapper, Graph3D",
        note: "<OpenChart :spec>",
        href: "/docs/reference/components/",
      },
      {
        name: "Slide chrome and layout CSS",
        note: "cover, footer, byline, QR card",
        href: "/docs/reference/components/",
      },
      { name: "Viewer", note: "text resize, pinch zoom", href: "/docs/reference/components/" },
      { name: "The decks CLI", note: "new, dev, build, export", href: "/docs/reference/cli/" },
    ] as Track[],
    b: [
      {
        name: "shot and snap",
        note: "screenshots and pixel diffs",
        href: "/docs/guides/checking-a-deck/",
      },
      {
        name: "deck-author agent",
        note: ".claude/agents",
        href: "/docs/guides/writing-decks-with-an-agent/",
      },
      {
        name: "building-a-deck, fact-checking-a-deck",
        note: "skills",
        href: "/docs/guides/writing-decks-with-an-agent/",
      },
      {
        name: "Prose-lint hook",
        note: "lint-ai-rhetoric.sh",
        href: "/docs/guides/checking-a-deck/",
      },
      {
        name: "Example decks",
        note: "examples/",
        href: "/docs/getting-started/your-first-story-deck/",
      },
    ] as Track[],
  },
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
  license: "Apache-2.0",
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
