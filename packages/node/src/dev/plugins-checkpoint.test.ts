import { expect, it } from "vitest";
import { manifest, serve, waitForWatcher } from "./server.test-support";

it("serves the new slide after its coalesced reload and a later CSS update", async () => {
  const app = await serve();
  await manifest(app);
  const start = app.messages.length;
  await app.put("slides/02-second.mdx", "# Added slide");
  await waitForWatcher(() =>
    expect(
      app.messages.slice(start).some((message) => message.includes('"type":"full-reload"')),
    ).toBe(true),
  );
  await app.checkpoint();
  expect((await manifest(app)).manifest.slides.map(({ id }: { id: string }) => id)).toEqual([
    "01-first",
    "02-second",
  ]);
  expect(await app.get("/slides/02-second.mdx")).toContain("Added slide");
});
