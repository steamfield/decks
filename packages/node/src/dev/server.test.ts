import { describe, expect, it, onTestFinished } from "vitest";
import { dev, loadDeck } from "../index";
import { firstDevPort } from "./server";
import { fixture, testVite } from "./server.test-support";

describe("dev ports", () => {
  it.each([undefined, 0])("serves with port %s", async (port) => {
    const { dir } = await fixture(onTestFinished, {
      "deck.config.ts": `export default ${JSON.stringify({ title: "Port selection", vite: { ...testVite, server: { port: 1 } } })};`,
    });
    const server = await dev(await loadDeck(dir), { port });
    onTestFinished(() => server.close());
    expect(Number(new URL(server.url).port)).toBeGreaterThan(0);
    expect(Number(new URL(server.url).port)).not.toBe(1);
    if (port === undefined)
      expect(Number(new URL(server.url).port)).toBeGreaterThanOrEqual(firstDevPort);
    const response = await fetch(server.url);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Port selection");
  });
});
