import { expect, it } from "vitest";
import { serve } from "./deck.test-support";

it("leaves a markdown file a deck imports as text alone", async () => {
  const app = await serve({ "notes.md": "# Plain *markdown*\n" });
  const code = await app.get("/notes.md?raw");
  expect(code).toContain("# Plain *markdown*");
  expect(code).not.toContain("jsx");
});
