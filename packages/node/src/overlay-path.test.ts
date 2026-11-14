import { join, relative } from "node:path";
import { expect, it } from "vitest";
import { serve, waitForWatcher } from "./deck.test-support";

it("keeps the overlay file link absolute and its message relative to the working directory", async () => {
  const app = await serve();
  await app.get("/slides/01-first.mdx");
  await app.put("slides/01-first.mdx", '---\nclicks: "two"\n---\n# Broken');
  await waitForWatcher(() => {
    const errors = app.messages
      .map((message) => JSON.parse(message))
      .filter((message) => message.type === "error");
    expect(errors.length).toBeGreaterThan(0);
    const file = join(app.dir, "slides/01-first.mdx");
    expect(errors.at(-1).err.id).toBe(file);
    expect(errors.at(-1).err.message).toContain(`${relative(process.cwd(), file)}:`);
    expect(errors.at(-1).err.message).not.toContain(app.dir);
  });
});
