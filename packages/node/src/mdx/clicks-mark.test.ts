import { expect, it, onTestFinished } from "vitest";
import { fixture, scanMotion, testServer } from "../dev/server.test-support";
import { loadDeck } from "../index";

it("counts a Mark until click as the slide's final click", async () => {
  const slides = await scanMotion("Inline <Mark at={2} until={4}>evidence</Mark>.");
  expect(slides[0]?.meta.clicks).toBe(4);
});

it("counts a Mark at click when until is omitted", async () => {
  const slides = await scanMotion("Inline <Mark at={3}>evidence</Mark>.");
  expect(slides[0]?.meta.clicks).toBe(3);
});

it("compiles a Mark as a default slide component without an import", async () => {
  const { dir } = await fixture(onTestFinished, {
    "slides/01-first.mdx": "<Mark at={1}>Evidence</Mark>",
  });
  const server = await testServer(await loadDeck(dir));
  const result = await server.transformRequest("/slides/01-first.mdx");
  expect(result?.code).toContain("Evidence");
});
