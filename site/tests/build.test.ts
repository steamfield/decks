// Acceptance tests over the real build in dist/. `make build` runs them after
// `astro build`. The page list comes from src/content/docs, not from the build.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Window } from "happy-dom";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { site } from "../src/config";
import { ENTRIES, loadExamples } from "../src/data/examples";
import { loadHookDenial, loadRun, runFigures } from "../src/data/fixtures";

const parser = new new Window().DOMParser();
const read = (root: string, path: string) => readFileSync(join(root, path), "utf8");
const page = (root: string, path: string) => parser.parseFromString(read(root, path), "text/html");
const absolute = (path: string) => new URL(path, site.url).href;
const pagePath = (id: string) => `docs/${id}/index.html`;

function sourceDocs(root = ".") {
  const base = join(root, "src/content/docs");
  return readdirSync(base, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const title = /^title:\s*["']?(.+?)["']?\s*$/m.exec(readFileSync(join(base, file), "utf8"));
      return { id: file.replace(/\.md$/, "").replaceAll("\\", "/"), title: title?.[1] ?? "" };
    });
}

function htmlFiles(root: string) {
  return readdirSync(root, { recursive: true, encoding: "utf8" }).filter((file) =>
    file.endsWith(".html"),
  );
}

function islandNames(root: string, path: string) {
  return [...page(root, path).querySelectorAll("astro-island")].map(
    (island) => JSON.parse(island.getAttribute("opts") ?? "{}").name as string,
  );
}

const docs = sourceDocs();

describe("docs pages", () => {
  it.each(docs)("$id renders its metadata, sidebar entry and exports", ({ id, title }) => {
    const doc = page("dist", pagePath(id));
    const href = `/docs/${id}/`;
    expect(doc.querySelector("h1")?.textContent).toBe(title);
    expect(doc.querySelector('meta[name="description"]')?.getAttribute("content")).toBeTruthy();
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(absolute(href));
    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe(
      absolute(`/og/docs/${id}.png`),
    );
    expect(
      doc.querySelector('link[rel="alternate"][type="text/markdown"]')?.getAttribute("href"),
    ).toBe(`/docs/${id}.md`);
    expect(
      doc.querySelector('nav[aria-label="Docs"] a[aria-current="page"]')?.getAttribute("href"),
    ).toBe(href);
    expect(read("dist", `docs/${id}.md`).startsWith(`# ${title}\n`)).toBe(true);
    expect(read("dist", "llms.txt")).toContain(absolute(`/docs/${id}.md`));
    expect(read("dist", "llms-full.txt")).toContain(`# ${title}\n`);
    expect(read("dist", "sitemap-0.xml")).toContain(`<loc>${absolute(href)}</loc>`);
    const png = readFileSync(`dist/og/docs/${id}.png`);
    expect(png.subarray(1, 4).toString()).toBe("PNG");
  });

  it("renders the Markdown conventions", () => {
    const html = docs.map(({ id }) => read("dist", pagePath(id))).join("\n");
    expect(html).toMatch(/<blockquote role="note" data-callout="note">/);
    expect(html).toMatch(/<figcaption data-code-title="">Terminal<\/figcaption>/);
    expect(html).toMatch(/<div data-table-scroll="" tabindex="0" role="region"/);
    expect(html).toMatch(/<a href="#[\w-]+" data-heading-anchor/);
    expect(html).toMatch(/--shiki-dark:/);
  });

  it("lists every page on the docs home", () => {
    const home = page("dist", "docs/index.html");
    for (const { id } of docs) {
      expect(home.querySelector(`main a[href="/docs/${id}/"]`), id).not.toBeNull();
    }
  });
});

describe("the whole site", () => {
  it("has no broken internal links or anchors", () => {
    const broken: string[] = [];
    for (const file of htmlFiles("dist")) {
      const self = `/${file.replace(/index\.html$/, "")}`;
      for (const link of page("dist", file).querySelectorAll("a[href]")) {
        const href = link.getAttribute("href") ?? "";
        if (!href.startsWith("/") && !href.startsWith("#")) continue;
        if (href.startsWith("//")) continue;
        const [path = "", hash] = (href.startsWith("#") ? `${self}${href}` : href).split("#");
        const target = path.endsWith("/") ? `${path}index.html` : path;
        if (!existsSync(join("dist", target))) {
          broken.push(`${file}: ${href}`);
        } else if (hash && !hash.startsWith("/") && target.endsWith(".html")) {
          // "#/2?clicks=1" is a Slidev route inside a deck build, not an element id.
          if (!page("dist", target).getElementById(decodeURIComponent(hash))) {
            broken.push(`${file}: ${href} (no #${hash})`);
          }
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("hydrates only the islands site.islands lists, and none on docs pages", () => {
    expect([...new Set(islandNames("dist", "index.html"))].sort()).toEqual(
      [...site.islands].sort(),
    );
    for (const file of htmlFiles("dist").filter((file) => file.startsWith("docs"))) {
      expect(islandNames("dist", file), file).toEqual([]);
    }
  });

  it("renders the landing page from config, hiding empty sections", () => {
    const home = page("dist", "index.html");
    expect(home.querySelector("h1")?.textContent).toBe(site.tagline);
    expect(home.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe(
      absolute("/og/index.png"),
    );
    // The landing page is dark only and carries the product's tokens inline.
    const html = home.documentElement;
    expect(html.getAttribute("data-page")).toBe("landing");
    expect(html.classList.contains("dark")).toBe(true);
    expect(home.querySelector("[data-theme-toggle]")).toBeNull();
    const text = home.body.textContent ?? "";
    for (const line of site.quickstart) expect(text).toContain(line);
    expect(text).toContain(site.install[0]?.command.split("\n")[0] ?? "");
    expect(text).toContain(site.devCommand);
    for (const id of ["requirements", "agent", "examples", "themes", "install"]) {
      expect(home.getElementById(id)?.querySelector("h2"), id).not.toBeNull();
    }
    for (const row of site.requirements) expect(text).toContain(row.text);
    // The player server-renders without a deck: no iframe, the hero's poster and a link to it.
    expect(home.querySelector("iframe")).toBeNull();
    const examples = loadExamples();
    for (const example of examples) {
      const link = home.querySelector(`a[data-example="${example.name}"]`);
      expect(link?.getAttribute("href"), example.name).toBe(example.href);
      expect(text).toContain(example.provenance.label);
    }
    const files = home.querySelector("details#what-you-get summary");
    expect(files?.textContent).toContain("Files created by the setup");
    const agent = ENTRIES.find((entry) => entry.name === "keeling");
    if (!agent?.run) throw new Error("the retained agent example requires a run fixture");
    const agentRun = loadRun(agent.run.fixture);
    const figures = runFigures(agentRun);
    const evidence = home.getElementById("agent")?.textContent ?? "";
    expect(evidence).toContain(agentRun.prompt);
    expect(evidence).toContain(`${figures.minutes} min`);
    expect(evidence).toContain(figures.cost);
    expect(evidence).toContain(String(figures.turns));
    for (const rule of loadHookDenial().rules) expect(text).toContain(rule);
    if (site.announcement) expect(text).toContain(site.announcement.label);
    if (site.version) expect(text).toContain(`v${site.version}`);
    expect(text).toContain(`${site.license} license`);
    expect(readFileSync("dist/og/index.png").subarray(1, 4).toString()).toBe("PNG");
  });

  it("links the brand icons every page needs, all built from the mark", () => {
    for (const file of ["index.html", pagePath(sourceDocs()[0]?.id ?? "")]) {
      const head = page("dist", file).head;
      const links = [
        ...head.querySelectorAll("link[rel=icon], link[rel=apple-touch-icon], link[rel=manifest]"),
      ].map((link) => link.getAttribute("href"));
      expect(links, file).toEqual([
        "/favicon.ico",
        "/favicon.svg",
        "/apple-touch-icon.png",
        "/site.webmanifest",
      ]);
      // The header shows the mark beside the name.
      expect(page("dist", file).querySelector("header a[href='/'] svg path"), file).not.toBeNull();
    }
    expect(read("dist", "favicon.svg")).toMatch(/^<svg[^>]+viewBox="0 0 32 32"/);
    expect(readFileSync("dist/favicon.ico").readUInt16LE(2)).toBe(1);
    const manifest = JSON.parse(read("dist", "site.webmanifest"));
    expect(manifest.short_name).toBe(site.name);
    for (const { src } of [{ src: "/apple-touch-icon.png" }, ...manifest.icons]) {
      expect(readFileSync(join("dist", src)).subarray(1, 4).toString(), src).toBe("PNG");
    }
  });

  it("shows only real product output as images (R3)", () => {
    const home = page("dist", "index.html");
    const sources = [
      ...[...home.querySelectorAll("img")].flatMap((img) => [
        img.getAttribute("src"),
        img.getAttribute("srcset"),
      ]),
      ...[...home.querySelectorAll("source")].flatMap((source) => [
        source.getAttribute("src"),
        source.getAttribute("srcset"),
      ]),
      ...[...home.querySelectorAll("video")].flatMap((video) => [
        video.getAttribute("src"),
        video.getAttribute("poster"),
      ]),
    ]
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => value.split(",").map((candidate) => candidate.trim().split(/\s+/)[0]));
    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) expect(src).toMatch(/^\/(posters|stills|loops|og)\//);
    // The loop's <video> and a picked deck's poster render only after hydration, so
    // check where the player takes them from.
    for (const example of loadExamples()) {
      if (example.poster) expect(example.poster.base, example.name).toMatch(/^\/posters\//);
      if (example.loop) expect(example.loop.base, example.name).toMatch(/^\/loops\//);
    }
    const og = home.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "";
    expect(new URL(og).pathname).toMatch(/^\/og\//);
  });

  it("passes the package's prose lint over the landing text (R6)", () => {
    const home = page("dist", "index.html");
    // The hook panel quotes a planted bad line on purpose; it carries data-lint-skip.
    for (const skip of home.querySelectorAll("[data-lint-skip], script, style, pre")) skip.remove();
    // One line per block, so a match reports the block it came from.
    for (const block of home.body.querySelectorAll("p, h1, h2, h3, li, dt, dd, figcaption, a")) {
      block.append("\n");
    }
    // Text a screen reader or a tooltip shows, which textContent leaves out.
    const attributes = [...home.querySelectorAll("[alt], [aria-label], [title]")].flatMap(
      (element) => ["alt", "aria-label", "title"].map((name) => element.getAttribute(name) ?? ""),
    );
    const strings = [
      ...(home.body.textContent ?? "").split("\n"),
      ...attributes,
      ...playerStrings(),
    ]
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    expect(strings.length).toBeGreaterThan(20);
    const lint = spawnSync("node", ["../packages/decks/scripts/deck.mjs", "lint", "--stdin"], {
      input: strings.join("\n"),
      encoding: "utf8",
    });
    expect(`${lint.stdout}${lint.stderr}`.trim()).toBe("");
    expect(lint.status).toBe(0);
  });

  it("serves robots.txt, the sitemap index and an unindexed 404 page", () => {
    expect(read("dist", "robots.txt")).toContain(`Sitemap: ${absolute("/sitemap-index.xml")}`);
    expect(existsSync("dist/sitemap-index.xml")).toBe(true);
    expect(read("dist", "sitemap-0.xml")).not.toMatch(/404|\.md<|\.png<|\.txt</);
    const notFound = page("dist", "404.html");
    expect(notFound.querySelector("h1")?.textContent).toBe("Page not found");
    expect(notFound.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(
      "noindex, nofollow",
    );
  });
});

/**
 * The player's own strings: its string and template literals and JSX text. Most
 * show only after hydration or in another state (Pause, the give-up message), so
 * the built page alone doesn't have them.
 */
function playerStrings(): string[] {
  const path = "src/components/landing/DeckPlayer.tsx";
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) return;
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      found.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  // Prose only: at least two words, which leaves out class names, keys and paths.
  return found.filter((text) => /[A-Za-z]+\s+[A-Za-z]+/.test(text));
}

describe("adding a docs page", () => {
  it("is one file: navigation, pager, exports and sitemap pick it up", () => {
    // The site reads its parent repository (package, example decks), so the copy
    // sits in a temporary parent that links those back to the real repository.
    const parent = mkdtempSync(join(tmpdir(), "site-build-"));
    const root = join(parent, "site");
    try {
      for (const entry of [
        "src",
        "scripts",
        "public",
        "fixtures",
        "demo",
        "astro.config.mjs",
        "tsconfig.json",
        "package.json",
      ]) {
        cpSync(entry, join(root, entry), {
          recursive: true,
          filter: (from) => !from.includes("public/demo"),
        });
      }
      symlinkSync(resolve("node_modules"), join(root, "node_modules"), "dir");
      for (const entry of ["packages", "examples", "README.md"]) {
        symlinkSync(resolve("..", entry), join(parent, entry));
      }
      writeFileSync(
        join(root, "src/content/docs/guides/probe-page.md"),
        "---\ntitle: Probe page\ndescription: Checks that a new page is wired in.\ngroup: guides\norder: -1000\n---\n\n## Probe heading\n\nProbe body.\n",
      );
      const built = spawnSync("bunx", ["--no-install", "astro", "build"], {
        cwd: root,
        encoding: "utf8",
        timeout: 150_000,
      });
      expect(built.status, `${built.stdout}\n${built.stderr}`).toBe(0);
      const dist = join(root, "dist");
      const href = "/docs/guides/probe-page/";
      const other = page(dist, pagePath(docs[0]?.id ?? ""));
      expect(other.querySelector(`nav[aria-label="Docs"] a[href="${href}"]`)).not.toBeNull();
      // order -1000 makes the probe its group's first page, so another page links back to it.
      const linksBack = docs.some(
        ({ id }) =>
          page(dist, pagePath(id)).querySelector(`a[rel="prev"][href="${href}"]`) !== null,
      );
      expect(linksBack).toBe(true);
      expect(
        page(dist, pagePath("guides/probe-page")).querySelector("#probe-heading"),
      ).not.toBeNull();
      expect(read(dist, "docs/guides/probe-page.md")).toContain("Probe body.");
      expect(read(dist, "llms.txt")).toContain(absolute("/docs/guides/probe-page.md"));
      expect(read(dist, "sitemap-0.xml")).toContain(absolute(href));
      expect(existsSync(join(dist, "og/docs/guides/probe-page.png"))).toBe(true);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});

// The layout only calls initAnalytics when the build has a key, so a keyless build
// (dev, CI, previews) bundles neither the module's init nor posthog-js.
describe("analytics in the build", () => {
  const scriptsIn = (dir: string) =>
    readdirSync(join(dir, "_astro"))
      .filter((f) => f.endsWith(".js"))
      .map((f) => read(join(dir, "_astro"), f));
  const isAnalytics = (source: string) => source.includes("cookieless_mode");

  it("ships no analytics code without a PostHog key", () => {
    const analytics = scriptsIn("dist").filter(isAnalytics);
    if (process.env.PUBLIC_POSTHOG_KEY) expect(analytics).not.toEqual([]);
    else expect(analytics).toEqual([]);
  });

  it("puts the key in exactly one script when the build has one", () => {
    // Not a credential: any non-empty value turns analytics on for the build.
    const key = "decks-build-test-key";
    const out = mkdtempSync(join(tmpdir(), "decks-analytics-"));
    try {
      const built = spawnSync("bunx", ["--no-install", "astro", "build", "--outDir", out], {
        encoding: "utf8",
        timeout: 120_000,
        env: { ...process.env, PUBLIC_POSTHOG_KEY: key },
      });
      expect(built.status, `${built.stdout}\n${built.stderr}`).toBe(0);
      const scripts = scriptsIn(out);
      expect(scripts.filter((s) => s.includes(key))).toHaveLength(1);
      expect(scripts.filter(isAnalytics)).not.toEqual([]);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }, 150_000);
});
