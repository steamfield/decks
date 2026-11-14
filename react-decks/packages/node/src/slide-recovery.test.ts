import { describe, expect, it } from "vitest";
import { manifest, serve, virtual, waitForWatcher } from "./deck.test-support";

describe("slide-recovery", { timeout: 60_000 }, () => {
  it("keeps the last valid total when invalid frontmatter is removed during a syntax error", async () => {
    const app = await serve({
      "components/motion.tsx": 'export { Step } from "@react-decks/motion";',
      "slides/01-first.mdx": "<Step at={4} />",
    });
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(4);
    await app.get("/slides/01-first.mdx");
    const invalid = app.messages.length;
    await app.put("slides/01-first.mdx", "---\nclicks: -1\n---\n<Step at={4} />");
    await waitForWatcher(() =>
      expect(
        app.messages
          .slice(invalid)
          .some(
            (message) =>
              message.includes('"type":"error"') || message.includes('"type":"full-reload"'),
          ),
      ).toBe(true),
    );
    await fetch(new URL(virtual("manifest"), app.url));
    const repair = app.messages.length;
    await app.put("slides/01-first.mdx", "<Step at={5}>");
    await waitForWatcher(() =>
      expect(
        app.messages
          .slice(repair)
          .some(
            (message) =>
              message.includes('"type":"update"') || message.includes('"type":"full-reload"'),
          ),
      ).toBe(true),
    );
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(4);
  });
  it("retains the last total through a parse error, a new manifest request and a repair", async () => {
    const app = await serve({
      "components/motion.tsx": 'export { Step } from "@react-decks/motion";',
      "slides/01-first.mdx": "<Step at={3} />",
    });
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(3);
    await app.get("/slides/01-first.mdx");
    await app.checkpoint();
    const start = app.messages.length;
    await app.put("slides/01-first.mdx", "<Step at={4}>");
    await waitForWatcher(() =>
      expect(app.messages.slice(start).some((message) => message.includes('"type":"update"'))).toBe(
        true,
      ),
    );
    const broken = await fetch(new URL("/slides/01-first.mdx", app.url));
    expect(broken.status).toBe(500);
    expect(await broken.text()).toContain("01-first.mdx");
    await app.checkpoint();
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
    ).toBe(false);
    // Frontmatter forces a fresh manifest load while the body is still incomplete.
    await app.put("slides/01-first.mdx", "---\ntitle: Still editing\n---\n<Step at={4}>");
    await waitForWatcher(() =>
      expect(
        app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
      ).toBe(true),
    );
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(3);
    const repair = app.messages.length;
    await app.put("slides/01-first.mdx", "---\ntitle: Still editing\n---\n<Step at={4} />");
    await waitForWatcher(() =>
      expect(
        app.messages.slice(repair).some((message) => message.includes('"type":"full-reload"')),
      ).toBe(true),
    );
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(4);
  });
  it("serves a broken cold-start slide with zero clicks while its neighbour remains available", async () => {
    const app = await serve({
      "slides/01-first.mdx": "<Step at={3}>",
      "slides/02-good.mdx": "# Neighbour",
    });
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(0);
    expect(await app.get("/slides/02-good.mdx")).toContain("Neighbour");
    expect((await fetch(new URL("/slides/01-first.mdx", app.url))).status).toBe(500);
  });
});
