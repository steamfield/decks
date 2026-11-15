import { rename, rm } from "node:fs/promises";

import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { manifest, serve, virtual, virtualModule, waitForWatcher } from "./server.test-support";

describe("structure-changes", { timeout: 60_000 }, () => {
  it("hot-updates the body of a newly added slide after the manifest reload", async () => {
    const app = await serve();
    await app.get(virtual("manifest"));
    await app.put("slides/02-new.mdx", "# Added");
    await waitForWatcher(() =>
      expect(app.messages.some((message) => message.includes('"type":"full-reload"'))).toBe(true),
    );
    await waitForWatcher(async () => {
      expect(Object.keys((await manifest(app)).slides)).toContain("02-new");
      expect(app.server.watcher.getWatched()[join(app.dir, "slides")]).toContain("02-new.mdx");
    });
    await app.checkpoint();
    expect(await app.get("/slides/02-new.mdx")).toContain("Added");
    await app.checkpoint();
    const start = app.messages.length;
    await app.put("slides/02-new.mdx", "# Edited");
    await waitForWatcher(() =>
      expect(app.messages.slice(start).some((message) => message.includes('"type":"update"'))).toBe(
        true,
      ),
    );
    await app.checkpoint();
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
      app.messages.slice(Math.max(0, start - 4)).join("\n"),
    ).toBe(false);
    expect(await app.get("/slides/02-new.mdx")).toContain("Edited");
  });
  it.each(["add", "remove", "rename"])(
    "reloads and serves a new manifest after slide %s",
    async (action) => {
      const app = await serve({ "slides/02-other.mdx": "# Other" });
      expect(Object.keys((await manifest(app)).slides)).toContain("02-other");
      await app.checkpoint();
      const start = app.messages.length;
      if (action === "add") await app.put("slides/03-new.mdx", "# New");
      if (action === "remove") await rm(join(app.dir, "slides/02-other.mdx"));
      if (action === "rename")
        await rename(join(app.dir, "slides/02-other.mdx"), join(app.dir, "slides/03-new.mdx"));
      await waitForWatcher(() =>
        expect(
          app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
        ).toBe(true),
      );
      const after = Object.keys((await manifest(app)).slides);
      if (action !== "add") expect(after).not.toContain("02-other");
      if (action !== "remove") expect(after).toContain("03-new");
      await waitForWatcher(() => {
        const watched = app.server.watcher.getWatched()[join(app.dir, "slides")];
        if (action !== "add") expect(watched).not.toContain("02-other.mdx");
        if (action !== "remove") expect(watched).toContain("03-new.mdx");
      });
      await app.checkpoint();
      if (action === "rename")
        expect(
          app.messages.slice(start).filter((message) => message.includes('"type":"full-reload"')),
        ).toHaveLength(1);
    },
  );
  it.each(["add", "remove"])(
    "reloads and serves new components after component %s",
    async (action) => {
      const app = await serve({ "components/Before.tsx": "export function Before() {}" });
      expect(Object.keys((await virtualModule(app, "components")).components)).toEqual(["Before"]);
      await app.checkpoint();
      const start = app.messages.length;
      if (action === "add") await app.put("components/After.tsx", "export function After() {}");
      else await rm(join(app.dir, "components/Before.tsx"));
      await waitForWatcher(() =>
        expect(
          app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
        ).toBe(true),
      );
      const after = Object.keys((await virtualModule(app, "components")).components);
      expect(after.sort()).toEqual(action === "add" ? ["After", "Before"] : []);
    },
  );
});
