import { describe, expect, it } from "vitest";
import { manifest, serve, virtual, waitForWatcher } from "./deck.test-support";

describe("component-hmr", { timeout: 60_000 }, () => {
  it("hot-updates a component body when its exports and inferred totals stay the same", async () => {
    const app = await serve({
      "components/Label.tsx": "export function Label() { return <b>Before</b>; }",
      "slides/01-first.mdx": "<Label />",
    });
    await app.get(virtual("manifest"));
    await app.get(virtual("components"));
    await app.get("/components/Label.tsx");
    await app.checkpoint();
    const start = app.messages.length;
    await app.put("components/Label.tsx", "export function Label() { return <b>After</b>; }");
    await waitForWatcher(() =>
      expect(app.messages.slice(start).some((message) => message.includes('"type":"update"'))).toBe(
        true,
      ),
    );
    await app.checkpoint();
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
    ).toBe(false);
    expect(await app.get("/components/Label.tsx")).toContain("After");
  });
  it("updates inferred totals when a component starts and stops re-exporting motion", async () => {
    const app = await serve({
      "components/Own.tsx": 'export { Step } from "@react-decks/motion";',
      "slides/01-first.mdx": "<Step at={2} />",
    });
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(2);
    await app.get(virtual("components"));
    await app.get("/components/Own.tsx");
    for (const { source, total } of [
      { source: "export function Step() { return null; }", total: 0 },
      { source: 'export { Step } from "@react-decks/motion";', total: 2 },
    ]) {
      await app.checkpoint();
      const start = app.messages.length;
      await app.put("components/Own.tsx", source);
      await waitForWatcher(() =>
        expect(
          app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
        ).toBe(true),
      );
      expect((await manifest(app)).manifest.slides[0].clicks).toBe(total);
      await app.get("/components/Own.tsx");
    }
  });
});
