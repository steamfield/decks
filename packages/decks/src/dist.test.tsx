// @vitest-environment jsdom
import { execFile, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { act, render, screen } from "@testing-library/react";
import { beforeAll, expect, inject, it, onTestFinished, vi } from "vitest";

let runtime: typeof import("@react-decks/runtime");
let motion: typeof import("@react-decks/motion");
const packageDir = inject("builtPackage");

beforeAll(async () => {
  runtime = await vi.importActual(join(packageDir, "dist/index.js"));
  motion = await vi.importActual(join(packageDir, "dist/motion.js"));
}, 30_000);

function Slide() {
  const { Step, useStepState } = motion;
  const state = useStepState(1);
  return (
    <>
      <p role="status">{state}</p>
      <Step at={1}>
        <h1>Shared store</h1>
      </Step>
    </>
  );
}

it("shares the deck store and slide context between the built runtime and motion", async () => {
  const { createDeckStore, Deck } = runtime;
  window.history.replaceState(null, "", "/#/1");
  const source = {
    manifest: {
      name: "dist-test",
      title: "Built package",
      canvas: { width: 1920, height: 1080 },
      slides: [{ no: 1, id: "first", title: "First", file: "slides/01.mdx", clicks: 1 }],
    },
    slides: { first: async () => ({ default: Slide }) },
    frontmatter: {},
    components: {},
  };
  const store = createDeckStore(source.manifest);
  const rendered = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    rendered.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  expect((await screen.findByRole("status")).textContent).toBe("before");
  expect(screen.queryByRole("heading", { name: "Shared store" })).toBeNull();
  await act(async () => store.dispatch({ type: "next" }));
  expect(screen.getByRole("status").textContent).toBe("current");
  expect(screen.getByRole("heading", { name: "Shared store" })).not.toBeNull();
});

it("ships compiled entry points, bundled declarations, executable CLI, styles and fonts", async () => {
  const dist = join(packageDir, "dist");
  for (const name of ["index", "motion", "kit", "node", "cli"]) {
    expect((await stat(join(dist, `${name}.js`))).isFile()).toBe(true);
    expect((await stat(join(dist, `${name}.d.ts`))).isFile()).toBe(true);
  }
  for (const file of await readdir(dist)) {
    if (!file.endsWith(".js") && !file.endsWith(".d.ts")) continue;
    const contents = await readFile(join(dist, file), "utf8");
    expect(contents, file).not.toMatch(/(?:from\s*|import\s*(?:\(\s*)?)["']@react-decks\//);
  }
  const cli = join(dist, "cli.js");
  expect(await readFile(cli, "utf8")).toMatch(/^#!\/usr\/bin\/env node\n/);
  expect((await stat(cli)).mode & 0o111).not.toBe(0);
  expect(await readFile(join(dist, "motion.css"), "utf8")).toContain("data-step-state");
  expect((await stat(join(dist, "kit/fonts/inter-latin-wght-normal.woff2"))).size).toBeGreaterThan(
    0,
  );
  expect(await readFile(join(packageDir, "docs/README.md"), "utf8")).not.toBe("");
  expect(await readFile(join(dist, "lint/ai-rhetoric-patterns.tsv"), "utf8")).toBe(
    await readFile(resolve("packages/node/lint/ai-rhetoric-patterns.tsv"), "utf8"),
  );
});

it("uses the shipped lint patterns and prompt reminder under plain Node", async () => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/published-lint-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  const cli = join(packageDir, "dist/cli.js");
  const lint = spawnSync("node", [cli, "lint", "--stdin"], {
    cwd: dir,
    input: "It's not just a chart, it's a story.",
    encoding: "utf8",
  });
  if (lint.error) throw lint.error;
  expect(lint.status, lint.stderr).toBe(1);
  expect(lint.stdout).toContain("stdin:1:1  error  not-just-reveal");
  const prompt = spawnSync("node", [cli, "hook", "prompt"], {
    cwd: dir,
    input: JSON.stringify({ prompt: "write a deck" }),
    encoding: "utf8",
  });
  if (prompt.error) throw prompt.error;
  expect(prompt.status, prompt.stderr).toBe(0);
  expect(JSON.parse(prompt.stdout).hookSpecificOutput.additionalContext).toContain("slides/*.mdx");
});

it("builds public motion imports and the kit stylesheet with working font URLs under Node", async () => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/published-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, "slides"));
  await mkdir(join(dir, "styles"));
  await writeFile(join(dir, "package.json"), '{"type":"module"}');
  await writeFile(
    join(dir, "deck.config.ts"),
    'import { defineDeck } from "@steamfield/decks/node"; export default defineDeck({ title: "Public deck", vite: { base: "/talks/x/" } });',
  );
  await writeFile(
    join(dir, "slides/01-first.mdx"),
    'import { Step as Reveal } from "@steamfield/decks/motion";\n\n<Step at={1}>Provided step</Step>\n\n<Reveal at={2}>Imported step</Reveal>',
  );
  await writeFile(join(dir, "styles/index.css"), '@import "@steamfield/decks/kit/styles.css";');
  await promisify(execFile)(
    "node",
    [join(packageDir, "dist/cli.js"), "build", ".", "--out", "site"],
    { cwd: dir },
  );
  expect(await readFile(join(dir, "site/index.html"), "utf8")).toContain('src="/talks/x/assets/');
  const assets = await readdir(join(dir, "site/assets"));
  const stylesheet = assets.find((file) => file.endsWith(".css"));
  if (!stylesheet) throw new Error("Public deck has no built stylesheet");
  const css = await readFile(join(dir, "site/assets", stylesheet), "utf8");
  expect(css).toContain("Inter");
  expect(css).toContain("data-step-state");
  const fonts = Array.from(css.matchAll(/url\(\/talks\/x\/assets\/([^)]*\.woff2)\)/g));
  expect(fonts.length).toBeGreaterThan(0);
  for (const font of fonts) {
    expect(assets).toContain(font[1]);
  }
  expect(
    assets.some((file) => file.startsWith("inter-latin-wght-normal") && file.endsWith(".woff2")),
  ).toBe(true);
});
