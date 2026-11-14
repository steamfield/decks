import { describe, expect, it } from "vitest";
import { manifest, serve, virtual, virtualModule, waitForWatcher } from "./deck.test-support";

describe("slide-hmr", { timeout: 60_000 }, () => {
  it("reloads only when the inferred total changes and honours adding and removing an override", async () => {
    const app = await serve({
      "components/motion.tsx": 'export { Step } from "@react-decks/motion";',
      "slides/01-first.mdx": "<Step at={1} />\n\n<Step at={3} until={4} />",
    });
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(4);
    await app.get("/slides/01-first.mdx");
    const edit = async (body: string, reload: boolean, total: number) => {
      await app.checkpoint();
      const start = app.messages.length;
      await app.put("slides/01-first.mdx", body);
      await waitForWatcher(() =>
        expect(
          app.messages
            .slice(start)
            .some((message) =>
              message.includes(reload ? '"type":"full-reload"' : '"type":"update"'),
            ),
        ).toBe(true),
      );
      await app.checkpoint();
      expect(
        app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
      ).toBe(reload);
      expect((await manifest(app)).manifest.slides[0].clicks).toBe(total);
      await app.get("/slides/01-first.mdx");
    };
    await edit("---\nclicks: 2\n---\n<Step at={n} />", true, 2);
    await edit("<Step at={1} />\n\n<Step at={3} until={4} />", true, 4);
    await edit("<Step at={1} />\n\n<Step at={3} until={4} />\n\n<Step at={2} />", false, 4);
    await edit(
      "<Step at={1} />\n\n<Step at={3} until={4} />\n\n<Step at={2} />\n\n<Step at={5} />",
      true,
      5,
    );
  });
  it("hot-updates the first body edit of a hidden slide without reloading", async () => {
    const app = await serve({ "slides/02-hidden.mdx": "---\nhide: true\n---\n# Hidden before" });
    await app.get(virtual("manifest"));
    await app.get("/slides/02-hidden.mdx");
    await app.checkpoint();
    const start = app.messages.length;
    await app.put("slides/02-hidden.mdx", "---\nhide: true\n---\n# Hidden after");
    await waitForWatcher(() =>
      expect(app.messages.slice(start).some((message) => message.includes('"type":"update"'))).toBe(
        true,
      ),
    );
    await app.checkpoint();
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
    ).toBe(false);
    expect(await app.get("/slides/02-hidden.mdx")).toContain("Hidden after");
  });
  it("hot-updates a slide body and notes without a full reload", async () => {
    const app = await serve({ "slides/01-first.mdx": "# Before\n\n<Notes>Old notes</Notes>" });
    await app.get(virtual("entry"));
    await app.get(virtual("manifest"));
    expect(await app.get("/slides/01-first.mdx")).toContain("Before");
    expect((await virtualModule(app, "notes")).notes["01-first"]).toEqual([
      { click: 0, html: "<p>Old notes</p>" },
    ]);
    await app.checkpoint();
    const start = app.messages.length;
    await app.put("slides/01-first.mdx", "# After\n\n<Notes>New notes</Notes>");
    await waitForWatcher(() =>
      expect(app.messages.slice(start).some((message) => message.includes('"type":"update"'))).toBe(
        true,
      ),
    );
    await app.checkpoint();
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
      app.messages.slice(start).join("\n"),
    ).toBe(false);
    expect(await app.get("/slides/01-first.mdx")).toContain("After");
    expect((await virtualModule(app, "notes")).notes["01-first"]).toEqual([
      { click: 0, html: "<p>New notes</p>" },
    ]);
  });
  it("reloads the manifest after frontmatter changes", async () => {
    const app = await serve();
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(0);
    await app.get("/slides/01-first.mdx");
    await app.checkpoint();
    const start = app.messages.length;
    await app.put("slides/01-first.mdx", "---\ntitle: Revised\nclicks: 2\n---\n# First slide");
    await waitForWatcher(() =>
      expect(
        app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
      ).toBe(true),
    );
    expect((await manifest(app)).manifest.slides[0]).toMatchObject({ clicks: 2, title: "Revised" });
  });
});
