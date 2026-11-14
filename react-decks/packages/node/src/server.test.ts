import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { fixture } from "./deck.test-support";
import { dev, loadDeck } from "./index";

describe("dev ports", () => {
  it.each([undefined, 0])(
    "serves with port %s and passes that choice to deck plugins",
    async (port) => {
      const { dir } = await fixture(onTestFinished, {
        "deck.config.ts": `import { writeFileSync } from "node:fs";
export default { title: "Port selection", vite: { plugins: [{
  name: "record-port",
  configResolved(config) {
    writeFileSync(new URL("./port.json", import.meta.url), JSON.stringify(config.server.port));
  }
}] } };`,
      });
      const server = await dev(await loadDeck(dir), { port });
      onTestFinished(() => server.close());
      const configured: unknown = JSON.parse(await readFile(join(dir, "port.json"), "utf8"));
      if (port === 0) expect(configured).toBe(0);
      else {
        expect(configured).toBeTypeOf("number");
        expect(configured).toBeGreaterThanOrEqual(3030);
      }
      expect(Number(new URL(server.url).port)).toBeGreaterThan(0);
      const response = await fetch(server.url);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain("Port selection");
    },
  );
});
