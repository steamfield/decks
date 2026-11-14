import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { cli } from "../deck.test-support";

async function project(files: Record<string, string> = {}) {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/check-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  for (const [file, contents] of Object.entries(files)) {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await writeFile(join(dir, file), contents);
  }
  return dir;
}

async function run(dir: string, args: string[] = []) {
  const process = cli(dir, ["check", ...args]);
  const [code] = await process.exit;
  return { code, ...process.output() };
}

const valid = {
  "decks.json": JSON.stringify({ q3: { dir: "decks/quarterly" } }),
  "decks/quarterly/deck.config.ts": 'export default { title: "Quarterly" };',
  "decks/quarterly/slides/01-cover.mdx": "# Replace this headline with your finding.",
};

it("refuses an unknown check option as an author error", async () => {
  const dir = await project();
  const result = await run(dir, ["--bogus"]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("--bogus");
  expect(result.stderr).not.toContain("This is a bug");
});

it("reports an unregistered deck under decksDir with its config path", async () => {
  const dir = await project({
    "decks.json": JSON.stringify({ _config: { decksDir: "talks" } }),
    "talks/forgotten/deck.config.ts": 'export default { title: "Forgotten" };',
    "talks/notes/README.md": "This is not a deck",
  });
  const result = await run(dir);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("unregistered: talks/forgotten (talks/forgotten/deck.config.ts)");
  expect(result.stderr).not.toContain("talks/notes");
});

it.each([false, true])(
  "reports a missing registered config with existing directory %s",
  async (existing) => {
    const dir = await project({
      "decks.json": JSON.stringify({ q3: { dir: "decks/q3" } }),
      ...(existing ? { "decks/q3/slides/01-cover.mdx": "# Claim." } : {}),
    });
    const result = await run(dir);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("missing: q3 -> decks/q3");
    expect(result.stderr).toContain("decks/q3/deck.config.ts");
  },
);

it.each(["missing", "empty", "hidden"])(
  "reports no visible slides with a %s slide directory",
  async (state) => {
    const dir = await project(valid);
    const slides = join(dir, "decks/quarterly/slides");
    await rm(join(slides, "01-cover.mdx"));
    if (state === "missing") await rm(slides, { recursive: true });
    if (state === "hidden")
      await writeFile(join(slides, "01-hidden.mdx"), "---\nhide: true\n---\n# Hidden.");
    const result = await run(dir);
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("no slides: q3\n");
    expect(result.stdout).not.toContain("All decks check out.");
  },
);

it("reports an alias that selects another entry's directory basename", async () => {
  const dir = await project({
    ...valid,
    "decks.json": JSON.stringify({
      q3: { dir: "decks/quarterly" },
      quarterly: { dir: "decks/annual" },
    }),
    "decks/annual/deck.config.ts": 'export default { title: "Annual" };',
  });
  const result = await run(dir);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(
    "alias collision: quarterly (decks/annual) matches q3 -> decks/quarterly",
  );
});

it("prefixes every config loader error with its alias and continues checking other files", async () => {
  const dir = await project({
    ...valid,
    "decks/quarterly/deck.config.ts": 'export default { titel: "Typo" };',
    "decks/quarterly/slides/2-intro.mdx": "# Fix the filename.",
  });
  const result = await run(dir);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("q3: decks/quarterly/deck.config.ts: title is required");
  expect(result.stderr).toContain('q3: decks/quarterly/deck.config.ts: unknown key "titel"');
  expect(result.stderr).toContain("q3: slide name: decks/quarterly/slides/2-intro.mdx");
});

it.each(["2-intro.mdx", "02-Uppercase.mdx", "02-no spaces.mdx"])(
  "reports malformed slide name %s",
  async (file) => {
    const dir = await project({ ...valid, [`decks/quarterly/slides/${file}`]: "# Claim." });
    const result = await run(dir);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(`q3: slide name: decks/quarterly/slides/${file}`);
  },
);

it("reports every slide sharing a numeric prefix, including hidden slides", async () => {
  const dir = await project({
    ...valid,
    "decks/quarterly/slides/01-other.mdx": "---\nhide: true\n---\n# Hidden.",
  });
  const result = await run(dir);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("q3: slide name: decks/quarterly/slides/01-cover.mdx");
  expect(result.stderr).toContain("q3: slide name: decks/quarterly/slides/01-other.mdx");
});

it("passes a clean deck and fails on an error-level prose hit", async () => {
  const clean = await run(await project(valid));
  expect(clean.code, clean.stderr).toBe(0);
  expect(clean.stdout).toBe("All decks check out.\n");
  const dir = await project({
    ...valid,
    "decks/quarterly/slides/02-core.mdx": "# At its core, the pipeline is fast.",
  });
  const result = await run(dir);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("1 error-level prose hit(s); run `decks lint` for all hits.");
});

it("checks a valid registry while normalizing directory paths and ignoring non-slide files", async () => {
  const dir = await project({
    ...valid,
    "decks.json": JSON.stringify({
      _config: { outDir: "site/{name}", base: "/talk/" },
      _metadata: "Ignored by the registry",
      q3: { dir: "./decks/quarterly/" },
    }),
    "decks/quarterly/slides/notes.md": "Not a slide",
    "decks/quarterly/slides/archive/2-intro.mdx": "Not a slide",
  });
  const result = await run(dir);
  expect(result.code, result.stderr).toBe(0);
  expect(result.stdout).toContain("All decks check out.");
});

it("checks an empty project without a registry using the registry defaults", async () => {
  const dir = await project();
  expect((await run(dir)).code).toBe(0);
  await mkdir(join(dir, "decks/orphan"), { recursive: true });
  await writeFile(join(dir, "decks/orphan/deck.config.ts"), 'export default { title: "Orphan" };');
  const result = await run(dir);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("unregistered: decks/orphan");
});

it.each([
  ["{", "malformed decks.json"],
  ["[]", "config must be a record"],
  ['{"_config":{"decksDir":42}}', "decksDir must be a string"],
  ['{"q3":{"dir":42}}', "dir must be a string"],
])("reports invalid registry %s without a stack trace", async (contents, message) => {
  const dir = await project({ "decks.json": contents });
  const result = await run(dir);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("decks.json");
  expect(result.stderr).toContain(message);
  expect(result.stderr).not.toContain("This is a bug");
});

it("passes against this repository's registry without modifying it", async () => {
  const before = await readFile(resolve("decks.json"), "utf8");
  const result = await run(process.cwd());
  expect(result.code, result.stderr).toBe(0);
  expect(result.stdout).toContain("All decks check out.");
  expect(await readFile(resolve("decks.json"), "utf8")).toBe(before);
});
