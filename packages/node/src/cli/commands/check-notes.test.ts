import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { cli, repoPath } from "../../dev/server.test-support";

async function check(slides: Record<string, string>) {
  await mkdir(repoPath(".tmp"), { recursive: true });
  const dir = await mkdtemp(repoPath(".tmp/check-notes-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  const files = {
    "decks.json": JSON.stringify({ q3: { dir: "decks/quarterly" } }),
    "decks/quarterly/deck.config.ts": 'export default { title: "Quarterly" };',
    ...Object.fromEntries(
      Object.entries(slides).map(([name, source]) => [`decks/quarterly/slides/${name}`, source]),
    ),
  };
  for (const [file, contents] of Object.entries(files)) {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await writeFile(join(dir, file), contents);
  }
  const process = cli(dir, ["check"]);
  const [code] = await process.exit;
  return { code, ...process.output() };
}

function slide(clicks: number, notes: string, hide = false) {
  return `---\nclicks: ${clicks}\n${hide ? "hide: true\n" : ""}---\n\n# Revenue grew in every region.\n\n<Notes>\n${notes}\n</Notes>\n`;
}

it.each([
  ["more cues than clicks", 1, "- Open\n\n[click]\n- First\n\n[click]\n- Second", 2],
  ["fewer cues than clicks", 3, "- Open\n\n[click]\n- First", 1],
])(
  "reports a slide whose notes have %s, naming the slide and both counts",
  async (_, clicks, notes, cues) => {
    const result = await check({ "01-growth.mdx": slide(clicks, notes) });
    expect(result.code).toBe(1);
    expect(result.stderr).toBe(
      `q3: notes: decks/quarterly/slides/01-growth.mdx has [click] cues for ${cues} click(s), but the slide has ${clicks}\n`,
    );
    expect(result.stdout).toBe("");
  },
);

it("passes notes with one cue per click, counted [click:n] steps, and notes without click markers", async () => {
  const result = await check({
    "01-growth.mdx": slide(2, "- Open\n\n[click]\n- First\n\n[click]\n- Second"),
    "02-skip.mdx": slide(3, "- Open\n\n[click]\n- First\n\n[click:2]\n- Third"),
    "03-whole.mdx": slide(2, "- Talk through both reveals"),
  });
  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
  expect(result.stdout).toBe("All decks check out.\n");
});

it("skips a hidden slide's cues until the slide is restored, then reports them", async () => {
  const extra = slide(2, "- Open\n\n[click]\n- First", true);
  const hidden = await check({ "01-growth.mdx": slide(0, "- Open"), "02-extra.mdx": extra });
  expect(hidden.stderr).toBe("");
  expect(hidden.code).toBe(0);
  const restored = await check({
    "01-growth.mdx": slide(0, "- Open"),
    "02-extra.mdx": extra.replace("hide: true\n", ""),
  });
  expect(restored.code).toBe(1);
  expect(restored.stderr).toBe(
    "q3: notes: decks/quarterly/slides/02-extra.mdx has [click] cues for 1 click(s), but the slide has 2\n",
  );
});
