import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { dev, loadDeck } from "@react-decks/node";

test("A deck renders inline and display math as KaTeX markup.", async ({ page }) => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/mdx-math-"));
  try {
    await mkdir(join(dir, "node_modules/@react-decks"), { recursive: true });
    for (const name of ["runtime", "motion"])
      await symlink(resolve("packages", name), join(dir, "node_modules/@react-decks", name), "dir");
    await mkdir(join(dir, "slides"));
    await writeFile(
      join(dir, "deck.config.ts"),
      `import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
export default { title: "Math fixture", mdx: {
  remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex]
} };`,
    );
    await writeFile(
      join(dir, "slides/01-math.mdx"),
      "# Math renders.\n\nInline $a^2+b^2=c^2$.\n\n$$\ne^{i\\pi}+1=0\n$$",
    );
    const server = await dev(await loadDeck(dir), { port: 0 });
    try {
      await page.goto(server.url);
      await expect(page.getByRole("heading", { name: "Math renders." })).toBeVisible();
      // The subject here is KaTeX's output, including accessible MathML and its TeX source.
      const math = page.locator("[data-deck-active] math");
      await expect(math).toHaveCount(2);
      await expect(math.last()).toBeVisible();
      await expect(math.last().locator("annotation")).toHaveText("e^{i\\pi}+1=0");
      await expect(page.locator("[data-deck-active] pre")).toHaveCount(0);
    } finally {
      await server.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
