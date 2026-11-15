import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { cli, fixture, skipBrowserTests } from "../dev/server.test-support";

describe.skipIf(skipBrowserTests)("capture defaults", () => {
  it("exports a square canvas with a matching PDF MediaBox at the default path", async () => {
    const { dir } = await fixture(onTestFinished, {
      "deck.config.ts":
        'export default { title: "Square", canvas: { width: 1080, height: 1080 } };',
      "decks.json": '{"square":{"dir":"."}}',
    });
    const command = cli(dir, ["export", "square"]);
    expect((await command.exit)[0], command.output().stderr).toBe(0);
    const pdf = await readFile(join(dir, "dist/square.pdf"), "latin1");
    expect(pdf.match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
    expect(pdf).toMatch(/\/MediaBox\s*\[0 0 810 810\]/);
  });

  // Three CLI processes in a row. Each took about 11s when the full suite saturated a 2-vCPU CI
  // runner, so the default 30s limit is shorter than the work; this one only bounds a hang.
  it("preserves the PDF and built site across export, build and export", {
    timeout: 120_000,
  }, async () => {
    const { dir } = await fixture(onTestFinished, { "decks.json": '{"talk":{"dir":"."}}' });
    const first = cli(dir, ["export", "talk"]);
    expect((await first.exit)[0], first.output().stderr).toBe(0);
    const pdfPath = join(dir, "dist/talk.pdf");
    const pdf = await readFile(pdfPath);
    const build = cli(dir, ["build", "talk"]);
    expect((await build.exit)[0], build.output().stderr).toBe(0);
    expect(await readFile(pdfPath)).toEqual(pdf);
    const sitePath = join(dir, "dist/talk/index.html");
    const site = await readFile(sitePath, "utf8");
    expect(site).toContain('<meta name="decks:name" content="talk">');
    const second = cli(dir, ["export", "talk"]);
    expect((await second.exit)[0], second.output().stderr).toBe(0);
    expect(await readFile(sitePath, "utf8")).toBe(site);
    expect((await readFile(pdfPath, "latin1")).startsWith("%PDF-")).toBe(true);
  });

  it.each([
    { click: 0, flags: [] },
    { click: 1, flags: ["1"] },
  ])("shots slide 1 at click $click to its default filename", async ({ click, flags }) => {
    const { dir } = await fixture(onTestFinished, {
      "slides/01-first.mdx": "---\nclicks: 1\n---\n# Capture defaults",
    });
    const command = cli(dir, ["shot", ".", "1", ...flags]);
    expect((await command.exit)[0], command.output().stderr).toBe(0);
    const png = await readFile(join(dir, `slide-1-c${click}.png`));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1920, 1080]);
  });
});

it("rejects a nonnumeric shot width with the offending value", async () => {
  const { dir } = await fixture(onTestFinished);
  const command = cli(dir, ["shot", ".", "1", "--width", "abc"]);
  expect((await command.exit)[0]).toBe(1);
  expect(command.output().stderr).toContain('Invalid width "abc"');
  expect(command.output().stderr).not.toContain("This is a bug");
});
