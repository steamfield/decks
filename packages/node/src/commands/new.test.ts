import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, it, onTestFinished } from "vitest";
import { cli } from "../deck.test-support";

async function project(registry?: Record<string, unknown>) {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/new-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  if (registry) await writeFile(join(dir, "decks.json"), JSON.stringify(registry));
  return dir;
}

async function run(dir: string, args: string[]) {
  const process = cli(dir, ["new", ...args]);
  const [code] = await process.exit;
  return { code, ...process.output() };
}

it("scaffolds a conventional deck and registers it with project defaults", async () => {
  const dir = await project();
  const author = 'Riley "R"\\Notes\nNext';
  const result = await run(dir, ["q3", "quarterly", "--author", author]);
  expect(result.code, result.stderr).toBe(0);
  expect(JSON.parse(await readFile(join(dir, "decks.json"), "utf8"))).toEqual({
    _config: { decksDir: "decks", outDir: "dist/{name}", base: "./" },
    q3: { dir: "decks/quarterly" },
  });
  const deckDir = join(dir, "decks/quarterly");
  expect((await readdir(deckDir)).sort()).toEqual([
    "deck.config.ts",
    "setup.ts",
    "slides",
    "styles",
  ]);
  expect(await readdir(join(deckDir, "slides"))).toEqual(["01-cover.mdx", "02-first-point.mdx"]);
  const config = await readFile(join(deckDir, "deck.config.ts"), "utf8");
  expect(config).toContain('title: "Quarterly"');
  expect(config).toContain(`author: ${JSON.stringify(author)}`);
  expect(config).toContain("Replace this description");
  expect(await readFile(join(deckDir, "styles/index.css"), "utf8")).toContain(
    '@import "@steamfield/decks/kit/styles.css"',
  );
});

it("scaffolds a story with a stage, provenance, theme setup and story transition", async () => {
  const dir = await project();
  const result = await run(dir, ["q3", "--story"]);
  expect(result.code, result.stderr).toBe(0);
  const deck = join(dir, "decks/q3");
  expect(await readFile(join(deck, "deck.config.ts"), "utf8")).toContain('transition: "story"');
  expect(await readFile(join(deck, "slides/02-first-point.mdx"), "utf8")).toContain(
    "<FirstStage />",
  );
  expect(await readFile(join(deck, "components/FirstStage.tsx"), "utf8")).toContain("StoryCard");
  expect(await readFile(join(deck, "data/01-first.ts"), "utf8")).toContain(
    "not measured observations",
  );
  expect(await readFile(join(deck, "data-sources.md"), "utf8")).toContain("Sources for q3");
  expect(await readFile(join(deck, "setup.ts"), "utf8")).toContain("installTheme(resolveTheme())");
});

it.each([false, true])("writes a brand URL and loads its theme with story %s", async (story) => {
  const dir = await project();
  const result = await run(dir, ["q3", ...(story ? ["--story"] : []), "--url", "example.com"]);
  expect(result.code, result.stderr).toBe(0);
  expect(JSON.parse(await readFile(join(dir, "decks/q3/theme.json"), "utf8"))).toEqual({
    brand: { url: "example.com" },
  });
  expect(await readFile(join(dir, "decks/q3/setup.ts"), "utf8")).toContain(
    'import theme from "./theme.json"',
  );
  expect(await readFile(join(dir, "decks/q3/setup.ts"), "utf8")).toContain("resolveTheme(theme)");
});

it("uses the alias as the directory when the directory is omitted", async () => {
  const dir = await project();
  expect((await run(dir, ["q3"])).code).toBe(0);
  expect((await stat(join(dir, "decks/q3/deck.config.ts"))).isFile()).toBe(true);
});

it("refuses a registered alias without overwriting its files or registry", async () => {
  const dir = await project();
  expect((await run(dir, ["q3", "--story"])).code).toBe(0);
  const before = await readFile(join(dir, "decks.json"), "utf8");
  const config = await readFile(join(dir, "decks/q3/deck.config.ts"), "utf8");
  const result = await run(dir, ["q3", "different"]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('Alias "q3" is already registered');
  expect(await readFile(join(dir, "decks.json"), "utf8")).toBe(before);
  expect(await readFile(join(dir, "decks/q3/deck.config.ts"), "utf8")).toBe(config);
  expect(await readdir(join(dir, "decks"))).toEqual(["q3"]);
});

it("refuses an existing directory without writing a registry or replacing its contents", async () => {
  const dir = await project();
  await mkdir(join(dir, "decks/q3"), { recursive: true });
  await writeFile(join(dir, "decks/q3/keep.txt"), "Keep this");
  const result = await run(dir, ["q3"]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("decks/q3 already exists");
  expect(await readdir(dir)).toEqual(["decks"]);
  expect(await readdir(join(dir, "decks/q3"))).toEqual(["keep.txt"]);
  expect(await readFile(join(dir, "decks/q3/keep.txt"), "utf8")).toBe("Keep this");
});

it.each(["nested/q3", "..", "nested\\q3"])(
  "refuses directory %s before writing anything",
  async (value) => {
    const dir = await project();
    const result = await run(dir, ["q3", value]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(value);
    expect(await readdir(dir)).toEqual([]);
  },
);

it("refuses a missing alias before writing anything", async () => {
  const dir = await project();
  const result = await run(dir, []);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("ALIAS");
  expect(await readdir(dir)).toEqual([]);
});

it.each(["_config", "_q3"])("refuses reserved alias %s before writing anything", async (alias) => {
  const dir = await project();
  const result = await run(dir, [alias]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(alias);
  expect(await readdir(dir)).toEqual([]);
});

it("preserves project metadata and honors a custom decksDir", async () => {
  const registry = {
    _config: { decksDir: "talks", outDir: "web/{name}", base: "/talks/", future: true },
    _notes: "Keep this metadata",
    previous: { dir: "talks/previous", future: "keep" },
  };
  const dir = await project(registry);
  const result = await run(dir, ["q3"]);
  expect(result.code, result.stderr).toBe(0);
  expect(JSON.parse(await readFile(join(dir, "decks.json"), "utf8"))).toEqual({
    ...registry,
    q3: { dir: "talks/q3" },
  });
  expect(result.stdout).toContain("Wrote talks/q3/deck.config.ts");
  expect(result.stdout).toContain('Registered "q3" in decks.json');
  expect(result.stdout).toContain("Next: decks dev q3");
});

it.each([
  ["q3", "--stroy"],
  ["q3", "--author"],
  ["q3", "one", "extra"],
])("refuses invalid arguments %s before writing anything", async (...args) => {
  const dir = await project();
  const result = await run(dir, args);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(args[args.length - 1]);
  expect(result.stderr).not.toContain("This is a bug");
  expect(await readdir(dir)).toEqual([]);
});

it("reports an unwritable registry before creating an unregistered deck", async () => {
  const dir = await project({ _config: { decksDir: "decks" } });
  await chmod(join(dir, "decks.json"), 0o444);
  const result = await run(dir, ["q3"]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("decks.json");
  expect(result.stderr).not.toContain("This is a bug");
  expect(await readdir(dir)).toEqual(["decks.json"]);
});

it("reports an invalid destination as an author error naming the path", async () => {
  const dir = await project();
  await writeFile(join(dir, "decks"), "A file cannot contain decks");
  const result = await run(dir, ["q3"]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("decks");
  expect(result.stderr).not.toContain("This is a bug");
});

it("prints a shell-safe next command for an alias containing spaces and quotes", async () => {
  const dir = await project();
  const alias = "q3 team's review";
  const result = await run(dir, [alias, "q3"]);
  expect(result.code, result.stderr).toBe(0);
  const command = result.stdout.split("Next: ")[1]?.trim();
  if (!command) throw new Error("Scaffold did not print a next command");
  const { stdout } = await promisify(execFile)("sh", [
    "-c",
    `set -- ${command}; printf '%s\\n' "$#"; printf '%s' "$3"`,
  ]);
  expect(stdout).toBe(`3\n${alias}`);
});
