// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const manifest = (dir: string) =>
  JSON.parse(readFileSync(join(process.cwd(), dir, "package.json"), "utf8"));

// `playwright install` from one version garbage-collects browser revisions it does not
// know, so a site install on a different version deletes the root's Chromium.
it("pins the same Playwright version as the repository root", () => {
  expect(manifest(".").devDependencies["@playwright/test"]).toBe(
    manifest("..").devDependencies["@playwright/test"],
  );
});
