import { expect, it } from "vitest";
import { serve, virtual, waitForWatcher } from "./deck.test-support";

it("serves setup as the first entry import before auto-imported components", async () => {
  const app = await serve({ "setup.ts": "export {};" });
  const entry = await app.get(virtual("entry"));
  const imports = Array.from(entry.matchAll(/^import .+$/gm), (match) => match[0]);
  expect(imports[0]).toContain("/setup.ts");
});

it("adds setup to the generated entry when the file is created after serving", async () => {
  const app = await serve();
  expect(await app.get(virtual("entry"))).not.toContain("/setup.ts");
  await app.put("setup.ts", "export {};");
  await waitForWatcher(() =>
    expect(app.messages.some((message) => message.includes('"type":"full-reload"'))).toBe(true),
  );
  expect(await app.get(virtual("entry"))).toContain("/setup.ts");
});
