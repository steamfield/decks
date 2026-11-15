import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { cli, fixture as createFixture, waitForWatcher } from "../dev/server.test-support";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);

describe("decks CLI", () => {
  it.each(["1.5", "1e3", "abc", "65536"])("rejects --port %s with its value", async (port) => {
    const { dir } = await fixture();
    const process = cli(dir, ["dev", dir, "--port", port]);
    expect((await process.exit)[0]).toBe(1);
    expect(process.output().stderr).toContain(`Invalid --port "${port}"`);
  });
  it.each(["{", '{"_config":{"base":42}}', '{"talk":{"dir":42}}'])(
    "names malformed decks.json without a validation dump: %s",
    async (contents) => {
      const { dir, put } = await fixture();
      await put("decks.json", contents);
      const process = cli(dir, ["build", "talk"]);
      expect((await process.exit)[0]).toBe(1);
      expect(process.output().stderr).toContain("decks.json");
      expect(process.output().stderr).not.toContain('"expected"');
    },
  );
  it("build defaults to relative asset URLs", async () => {
    const { dir } = await fixture();
    const process = cli(dir, ["build", dir]);
    expect((await process.exit)[0], process.output().stderr).toBe(0);
    expect(await readFile(join(dir, `dist/${dir.split("/").at(-1)}/index.html`), "utf8")).toContain(
      'src="./assets/',
    );
  });
  it("dev resolves an alias and prints a URL that serves the deck", async () => {
    const { dir, put } = await fixture();
    await put("decks.json", JSON.stringify({ talk: { dir: "." } }));
    const process = cli(dir, ["dev", "talk", "--port", "0"]);
    const url = await process.url();
    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<meta name="decks:name" content="talk">');
    await expect(access(join(dir, "index.html"))).rejects.toThrow();
  });
  it("build uses registry outDir and base defaults", async () => {
    const { dir, put } = await fixture();
    await put(
      "decks.json",
      JSON.stringify({ _config: { outDir: "site/{name}", base: "/default/" }, talk: { dir: "." } }),
    );
    const process = cli(dir, ["build", "talk"]);
    expect((await process.exit)[0], process.output().stderr).toBe(0);
    expect(await readFile(join(dir, "site/talk/index.html"), "utf8")).toContain(
      'src="/default/assets/',
    );
  });
  it("reports an invalid config edit and recovers after the next valid save", async () => {
    const { dir, put } = await fixture();
    const process = cli(dir, ["dev", dir, "--port", "0"]);
    const url = await process.url();
    expect((await fetch(url)).status).toBe(200);
    await put("deck.config.ts", "export default {title:42};");
    await waitForWatcher(() => expect(process.output().stderr).toContain("deck.config.ts"));
    await put("deck.config.ts", 'export default {title:"Recovered deck"};');
    await waitForWatcher(async () => {
      expect(process.child.exitCode, process.output().stderr).toBe(null);
      const response = await fetch(url);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain("Recovered deck");
    });
  }, 40_000);
  it("build accepts a directory and explicit output and base", async () => {
    const { dir } = await fixture();
    const process = cli(dir, ["build", dir, "--out", "custom", "--base", "./"]);
    expect((await process.exit)[0], process.output().stderr).toBe(0);
    expect(await readFile(join(dir, "custom/index.html"), "utf8")).toContain('src="./assets/');
  });
  it.each(["unknown-talk"])("exits 1 and names unknown alias %s in stderr", async (alias) => {
    const { dir } = await fixture();
    const process = cli(dir, ["dev", alias]);
    expect((await process.exit)[0]).toBe(1);
    expect(process.output().stderr).toContain(alias);
  });
  it("exits 1 and names a directory's missing deck.config.ts in stderr", async () => {
    const { dir, put } = await fixture();
    await put("missing/file.txt", "No config here");
    const process = cli(dir, ["build", "./missing"]);
    expect((await process.exit)[0]).toBe(1);
    expect(process.output().stderr).toContain("no deck.config.ts in missing.");
  });
});
