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

function expectIndexableMetadata(
  head: ReturnType<typeof page>["head"],
  href: string,
  image: string,
) {
  const expectTag = (selector: string, value: string, attribute = "content") => {
    expect(
      [...head.querySelectorAll(selector)].map((tag) => tag.getAttribute(attribute)),
      selector,
    ).toEqual([value]);
  };
  const title = head.querySelector("title")?.textContent ?? "";
  const description = head.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  expect(title).toBeTruthy();
  expect(description).toBeTruthy();
  expectTag('meta[name="description"]', description);
  expectTag('link[rel="canonical"]', absolute(href), "href");
  expectTag('meta[property="og:title"]', title);
  expectTag('meta[property="og:description"]', description);
  expectTag('meta[property="og:url"]', absolute(href));
  expectTag('meta[property="og:image"]', absolute(image));
  expectTag('meta[name="twitter:card"]', "summary_large_image");
  expectTag('meta[name="twitter:title"]', title);
  expectTag('meta[name="twitter:description"]', description);
  expectTag('meta[name="twitter:image"]', absolute(image));
  expectTag('meta[name="robots"]', "max-snippet:-1, max-image-preview:large");
  expect(head.querySelectorAll("title")).toHaveLength(1);
}

function websiteData(doc: ReturnType<typeof page>) {
  return [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map((script) => JSON.parse(script.textContent ?? ""))
    .filter((data) => data?.["@type"] === "WebSite");
}

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
    expectIndexableMetadata(doc.head, href, `/og/docs/${id}.png`);
    expect(websiteData(doc)).toEqual([]);
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
    expect(home.querySelector("h1")?.textContent).toBe("Slidev addon documentation");
    expectIndexableMetadata(home.head, "/docs/", "/og/index.png");
    expect(websiteData(home)).toEqual([]);
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
    expect([...home.querySelectorAll("h1")].map((heading) => heading.textContent)).toEqual([
      "Build animated presentations with coding agents.",
    ]);
    const hero = home.querySelector("h1")?.closest("section");
    expect(hero?.querySelector("p")?.textContent?.trim()).toBe(site.heroDescription);
    expect(home.querySelector("#install .section-lede")?.textContent).toContain(site.packageName);
    const quickstart = [hero, home.querySelector('section[aria-label="Install Decks"]')];
    for (const section of quickstart) {
      expect(
        section?.querySelector('a[href="/docs/getting-started/quickstart/"]')?.textContent,
      ).toContain("Read the quickstart");
    }
    expect(home.title).toBe("Animated presentations with coding agents | Decks");
    expectIndexableMetadata(home.head, "/", "/og/index.png");
    expect(websiteData(home)).toEqual([
      expect.objectContaining({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        alternateName: site.packageName,
        url: absolute("/"),
      }),
    ]);
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

  it("excludes raw examples from search snippets while keeping their context eligible", () => {
    const home = page("dist", "index.html");
    for (const selector of [
      ".hook-panel pre, .hook-panel [data-lint-skip] p",
      ".transcript-prompt span:not([aria-hidden]), .transcript-step > div > p",
      "#themes figure pre",
      ".no-js-only ol li",
    ]) {
      const elements = [...home.querySelectorAll(selector)];
      expect(elements.length, selector).toBeGreaterThan(0);
      for (const element of elements) {
        expect(
          element.closest("div[data-nosnippet], span[data-nosnippet], section[data-nosnippet]"),
          element.textContent ?? selector,
        ).not.toBeNull();
      }
    }
    for (const selector of [
      ".hook-panel figcaption",
      ".transcript figcaption, .transcript-note",
      "#themes .theme-source figcaption, #themes .theme-source p",
      ".no-js-only h2, .no-js-only a",
      "main h1, main h2, main a",
      ".hero pre, #install pre",
      ".hero-lede, #install .section-lede",
    ]) {
      const elements = [...home.querySelectorAll(selector)];
      expect(elements.length, selector).toBeGreaterThan(0);
      for (const element of elements) {
        expect(element.closest("[data-nosnippet]"), element.textContent ?? selector).toBeNull();
      }
    }
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
    const sitemap = read("dist", "sitemap-0.xml");
    for (const href of ["/", "/docs/"]) {
      expect(sitemap).toContain(`<loc>${absolute(href)}</loc>`);
    }
    expect(sitemap).not.toMatch(/404|\.md<|\.png<|\.txt</);
    const notFound = page("dist", "404.html");
    expect(notFound.querySelector("h1")?.textContent).toBe("Page not found");
    expect(
      [...notFound.head.querySelectorAll('meta[name="robots"]')].map((tag) =>
        tag.getAttribute("content"),
      ),
    ).toEqual(["noindex, nofollow"]);
    expect(websiteData(notFound)).toEqual([]);
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

// The layout only calls initAnalytics, and only creates the consent store and
// banner, when the build has a key, so a keyless build (dev, CI, previews) bundles
// none of it. The banner's stylesheet ships either way, with the other library CSS.
describe("analytics in the build", () => {
  // Every JavaScript file a page loads or may load: its inline scripts, script tags
  // and island components, renderers and before-hydration scripts, then the imports
  // (static, and dynamic with any quote style) of each file they reach. Ported from
  // stacks-api's analytics build test.
  function scriptsReachedFrom(root: string, page: string): Map<string, string> {
    const html = read(root, page);
    const reached = new Map<string, string>();
    const pending: string[] = [];
    const follow = (source: string, folder: string) => {
      // A `//host/...` target is another origin; it isn't in the build.
      for (const m of source.matchAll(/["'`](\.\/|\/(?!\/))([^"'`]+\.js)["'`]/g)) {
        const target = m[2] ?? "";
        // A template such as posthog-js's `/static/${version}/${name}.js` is a URL
        // built at run time for its CDN scripts, not a file in the build.
        if (target.includes("${")) continue;
        pending.push(m[1] === "/" ? target : folder + target);
      }
    };
    const pageFolder = page.slice(0, page.lastIndexOf("/") + 1);
    const inline = html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g);
    for (const [index, m] of Array.from(inline).entries()) {
      const source = m[1] ?? "";
      reached.set(`${page}#inline-${index}`, source);
      follow(source, pageFolder);
    }
    const entries =
      /(?:<script[^>]*\ssrc|\scomponent-url|\srenderer-url|\sbefore-hydration-url)="\/(?!\/)([^"]+\.js)"/g;
    pending.push(...Array.from(html.matchAll(entries), (m) => m[1] ?? ""));
    for (let path = pending.pop(); path !== undefined; path = pending.pop()) {
      if (reached.has(path)) continue;
      const source = read(root, path);
      reached.set(path, source);
      follow(source, path.slice(0, path.lastIndexOf("/") + 1));
    }
    return reached;
  }

  // The stylesheets a page links, by path, with their contents.
  function stylesheetsOf(root: string, page: string): Map<string, string> {
    const html = read(root, page);
    const links = html.matchAll(/<link[^>]*\srel="stylesheet"[^>]*\shref="\/([^"]+)"/g);
    return new Map(Array.from(links, (m) => m[1] ?? "").map((path) => [path, read(root, path)]));
  }

  // The paths, not the contents, so a failure prints something readable.
  const filesContaining = (reached: Map<string, string>, text: string) =>
    [...reached].filter(([, source]) => source.includes(text)).map(([path]) => path);

  // The default ingest host: in the analytics module and in posthog-js, nowhere else.
  const analyticsMarker = "us.i.posthog.com";
  // posthog-js's consent record prefix: in the SDK only, so finding it means the
  // scanner followed the module's dynamic import of posthog-js.
  const sdkMarker = "__ph_opt_in_out_";
  // The consent store's cookie name: in @steamfield/ui/consent only.
  const consentMarker = "sf-consent";
  // A rule from @steamfield/ui/consent's stylesheet, and a variable it reads (which
  // the site's theme also sets).
  const bannerStyleMarker = "--sf-consent-background";
  const isConsentStyle = (source: string) => /\[data-part=["']?consent["']?\]/.test(source);

  // A production build into a temporary directory with this PostHog key, so the
  // result doesn't depend on the environment `make build` ran in.
  function buildWithKey(key: string) {
    const out = mkdtempSync(join(tmpdir(), "decks-analytics-"));
    const built = spawnSync("bunx", ["--no-install", "astro", "build", "--outDir", out], {
      encoding: "utf8",
      timeout: 120_000,
      env: { ...process.env, PUBLIC_POSTHOG_KEY: key },
    });
    expect(built.status, `${built.stdout}\n${built.stderr}`).toBe(0);
    return out;
  }

  // The site value the layout passes to initAnalytics, as the minifier writes it.
  const siteValue = /site:\s*["'`]decks["'`]/;

  it("loads no analytics or consent code without a PostHog key", () => {
    const out = buildWithKey("");
    try {
      const reached = scriptsReachedFrom(out, "index.html");
      expect(reached.size).toBeGreaterThan(0);
      expect(filesContaining(reached, analyticsMarker)).toEqual([]);
      expect(filesContaining(reached, consentMarker)).toEqual([]);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }, 150_000);

  it("loads the key once, posthog-js, the banner and its styles when the build has a key", () => {
    // Not a credential: any non-empty value turns analytics on for the build.
    const key = "decks-build-test-key";
    const out = buildWithKey(key);
    try {
      const reached = scriptsReachedFrom(out, "index.html");
      expect(filesContaining(reached, key)).toHaveLength(1);
      expect(filesContaining(reached, sdkMarker)).toHaveLength(1);
      expect(filesContaining(reached, consentMarker)).not.toEqual([]);
      const sources = [...reached.values()];
      expect(sources.some((source) => siteValue.test(source))).toBe(true);
      expect(sources.some((source) => /domain:\s*["'`]steamfield\.io["'`]/.test(source))).toBe(
        true,
      );
      const styles = [...stylesheetsOf(out, "index.html").values()];
      expect(styles.some((source) => source.includes(bannerStyleMarker))).toBe(true);
      expect(styles.some(isConsentStyle)).toBe(true);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }, 150_000);

  it("links the shared privacy page from the footer", () => {
    expect(
      page("dist", "index.html").querySelector('footer a[href="https://steamfield.io/privacy"]'),
    ).not.toBeNull();
  });
});
