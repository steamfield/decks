import { expect, test } from "vitest";
import { remoteFixture } from "./remote.test-support";

test("serves the remote page and its script with the token", async () => {
  const app = await remoteFixture({ "public/private.txt": "deck-only" });
  const response = await fetch(app.url);
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toContain("<title>Test deck remote</title>");
  const src = html.match(/<script[^>]*\bsrc="([^"]+)"/)?.[1];
  if (!src) throw new Error("No remote page script");
  const script = new URL(src, app.url);
  const js = await fetch(script);
  expect(js.status).toBe(200);
  expect(js.headers.get("content-type")).toContain("javascript");
  expect((await js.text()).trim()).not.toBe("");
  script.search = "";
  expect((await fetch(script)).status).toBe(403);
  expect((await fetch(new URL(`/private.txt${app.url.search}`, app.url))).status).toBe(404);
});
