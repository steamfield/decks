// Public product metadata. Every landing section reads from here; a section whose
// value is empty (null or an empty list) doesn't render. The copy comes from the
// package guide and plugin, and src/lib/content-commands.test.ts checks every
// command shown here against packages/node/src/cli/cli-command.ts and the package's
// package.json.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Link = { label: string; href: string };
export type InstallOption = { label: string; command: string };
export type FooterColumn = { title: string; links: Link[] };
export type Comparison = { topic: string; vclick: string; decks: string };
export type Requirement = { label: string; text: string };

const repo = "https://github.com/steamfield/decks";
/** Package runners resolve the decks bin installed in the project first. */
const run = (runner: "bunx" | "npx" | "pnpm", args: string) =>
  runner === "pnpm" ? `pnpm exec decks ${args}` : `${runner} -p @steamfield/decks decks ${args}`;
const peers = "@steamfield/decks react react-dom";
const pluginInstall = "claude plugin install decks@steamfield --scope project";
/**
 * The stacks CLI's `decks` stack (github.com/steamfield/stacks) writes the project shell and
 * hands it to the user's coding agent, which installs the package, runs `decks new` and
 * `decks init`, and checks the result with `stacks verify`. The deck alias is the project name.
 */
const stacksNew = "npx @steamfield/stacks@latest new decks my-talk";

/** The agents the installed guidance supports. The requirements row, the hero's fine print and the section lede all read this list. */
export const agents = ["Claude Code", "Codex"];
const numberWords = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
/** A count under ten as a word ("seven"), otherwise digits. */
export const countWord = (n: number) => numberWords[n] ?? String(n);

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
const price = license ? `Free, ${license}` : "Free";

export const site = {
  name: "Decks",
  packageName: "@steamfield/decks",
  /** The home page's <title> and OG title. */
  title: "Animated presentations with coding agents | Decks",
  motionShowcase: {
    example: "motion-reel",
    heading: (slides: number, longest: number) =>
      `This reel is a ${slides}-slide deck, and its longest slide is ${longest} lines of MDX.`,
    lede: "Every frame in the player is a slide. Step through it with its controls or the arrow keys, and its MDX source follows. Each slide fills in a motion template or calls a component built on gsap.",
    credit:
      "A Claude Code agent (Fable) wrote the deck from a written brief, using the deck-motion skill and its references, deck-design and writing-slides, then revised it from a human's review notes. Nobody edited it by hand.",
    motion: { href: "/docs/motion/", label: "Write a motion sequence" },
    templates: (count: number) => ({
      href: "/docs/motion-templates/",
      label: `Browse all ${count} motion templates`,
    }),
  },
  /** The H1. */
  tagline: "Build animated presentations with coding agents.",
  description:
    "Build animated presentations with coding agents using Decks, a React slide framework. Add interactive charts, scaffold slides and trace figures to their sources.",
  /** The hero's one-line lede. */
  heroDescription:
    "Your coding agent turns your data and a brief into an animated React slide deck, then changes it when you ask.",
  /** The hero's scripted agent session (AgentSession, src/data/agent-session.ts). */
  agentSession: {
    fineprint:
      "An illustrative session with a fictional team's data. Every slide shown is a Decks slide from examples/agent-hero.",
    openDeck: "Open the finished deck",
    /** The stage's accessible name: what the agent has built, before turn 1 and after each turn. */
    stageLabels: [
      "An empty first slide, before the agent starts",
      "The five-slide build-time talk the agent drafted from the CSV",
      "The build-time talk, now opening on a reel of three words",
      "The build-time talk, with a scoreboard of the minutes each change saved",
      "The build-time talk, with its closing slide fixed to fit",
      "The finished build-time talk, built and exported to a PDF",
    ],
  },
  /** Absolute production URL: canonicals, the sitemap, OG images and llms.txt use it. */
  url: "https://decks.steamfield.io",
  repo,
  author: { "@type": "Person", name: "Riley Hilliard" },
  publisher: { "@type": "Organization", name: "Steamfield", url: "https://steamfield.io" },
  /** Current release, shown in the header. Empty hides it. */
  version: pkg.version ?? "",
  announcement: null as Link | null,
  /** The hero's install block: three lines, one copy button. */
  quickstart: [
    `bun add ${peers}`,
    run("bunx", "init"),
    pluginInstall,
    run("bunx", "new my-talk --story"),
  ],
  /** Shown under the hero's install block. */
  price,
  /** The hero's last line, under the install block and buttons. */
  heroFineprint: `${price}. React 19 and Node 22.12+. Bun runs the installed local decks bin. Guidance for ${agents.join(" and ")}.`,
  install: [
    {
      label: "bun",
      command: [
        `bun add ${peers}`,
        run("bunx", "init"),
        pluginInstall,
        run("bunx", "new my-talk --story"),
      ].join("\n"),
    },
    {
      label: "npm",
      command: [
        `npm i ${peers}`,
        run("npx", "init"),
        pluginInstall,
        run("npx", "new my-talk --story"),
      ].join("\n"),
    },
    {
      label: "pnpm",
      command: [
        `pnpm add ${peers}`,
        run("pnpm", "init"),
        pluginInstall,
        run("pnpm", "new my-talk --story"),
      ].join("\n"),
    },
    { label: "stacks", command: stacksNew },
  ] as InstallOption[],
  /** The dev server for the new deck, named in "What you get". */
  devCommand: run("bunx", "dev my-talk"),
  /** Section 2. The only place the page lists what Decks needs and what it can't do. */
  requirements: [
    {
      label: "Agent",
      text: `${agents.join(" and ")}. Run decks init, then install the Claude Code plugin once per collaborator.`,
    },
    {
      label: "Slides",
      text: "React 19 and MDX. The kit ships a dark theme; decks can supply their own CSS.",
    },
    {
      label: "Runtime",
      text: "Node 22.12+. Bun is optional.",
    },
    {
      label: "Export",
      text: "PDF only, through Chromium. No Keynote or PowerPoint files.",
    },
    {
      label: "Charts",
      text: "OpenChart 9.0.0 (@opendata-ai/openchart-react).",
    },
  ] as Requirement[],
  /** Section 3: a few words per file `decks init` and `decks new my-talk --story` write. */
  files: {
    ".agents/skills/building-a-deck/SKILL.md": "scaffold, source, write and review",
    ".agents/skills/deck-data/SKILL.md": "trace each figure to its source",
    ".agents/skills/writing-slides/SKILL.md": "write headlines, labels and notes",
    ".claude/settings.json": "the versioned marketplace and enabled plugin",
    "AGENTS.md": "the Decks reading order and skills",
    "decks.json": "the deck registry",
    "decks/my-talk/deck.config.ts": "the deck's title and configuration",
    "decks/my-talk/slides/01-cover.mdx": "the cover",
    "decks/my-talk/slides/02-first-point.mdx": "the first story slide",
    "decks/my-talk/components/FirstStage.tsx": "its chart and captions, step by step",
    "decks/my-talk/data/01-first.ts": "its figures, each with a source comment",
    "decks/my-talk/data-sources.md": "slide-by-slide sources for review",
    "decks/my-talk/setup.ts": "installs the kit theme",
    "decks/my-talk/styles/index.css": "deck CSS and the kit stylesheet",
  } as Record<string, string>,
  compare: [] as Comparison[],
  footer: [
    {
      title: "Product",
      links: [
        { label: "Install", href: "/#install" },
        { label: "Blog", href: "/blog/" },
        { label: "Changelog", href: `${repo}/blob/main/CHANGELOG.md` },
        { label: "npm", href: "https://www.npmjs.com/package/@steamfield/decks" },
      ],
    },
    {
      title: "Docs",
      links: [
        { label: "Quickstart", href: "/docs/getting-started/quickstart/" },
        { label: "decks CLI", href: "/docs/cli/" },
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
  islands: ["AgentSession", "DeckPlayer", "MotionShowcase", "InstallTabs"],
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
