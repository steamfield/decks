import { createLogger } from "vite";
import { expect, it, onTestFinished } from "vitest";
import { loadDeck } from "./config";
import { bugNotice } from "./errors";
import { dev } from "./server";
import { fixture, testVite, virtual } from "./server.test-support";

async function reportingDeck(files: Record<string, string> = {}) {
  const app = await fixture(onTestFinished, files);
  const messages: string[] = [];
  const infos: string[] = [];
  const logger = createLogger("silent");
  logger.error = (message) => messages.push(message);
  logger.info = (message) => infos.push(message);
  const deck = await loadDeck(app.dir);
  const server = await dev(
    { ...deck, config: { ...deck.config, vite: { ...testVite, customLogger: logger } } },
    { port: 0 },
  );
  onTestFinished(() => server.close());
  return { ...app, ...server, messages, infos };
}

it("leaves Vite's missing-package diagnostic without blaming the framework", async () => {
  const app = await reportingDeck({
    "components/Badge.tsx":
      'import Missing from "missing-package-for-error-test"; export const Badge = Missing;',
  });
  const response = await fetch(new URL("/components/Badge.tsx", app.url));
  expect(response.status).toBe(500);
  expect(await response.text()).toContain("missing-package-for-error-test");
  expect(app.messages.join("\n")).toContain("missing-package-for-error-test");
  expect(app.messages.join("\n")).not.toContain(bugNotice);
});

it("retains the stack and bug classification for a failure inside the framework compiler", async () => {
  const app = await reportingDeck({
    "deck.config.ts": `function malformed(){return tree => {tree.children.push({type:"element",tagName:"code",children:[]})}};
export default {title:"Failure", mdx:{rehypePlugins:[malformed]}}`,
  });
  const response = await fetch(new URL("/slides/01-first.mdx", app.url));
  expect(response.status).toBe(500);
  expect(await response.text()).toMatch(/at .*\.ts:\d+:\d+/);
  expect(app.messages.join("\n")).toMatch(/at .*\.ts:\d+:\d+/);
  expect(app.messages.join("\n")).toContain(bugNotice);
});

it("reports a component parse error once across the scan and Vite transform", async () => {
  const app = await reportingDeck({ "components/Badge.tsx": "export function Badge( {" });
  expect((await fetch(new URL(virtual("manifest"), app.url))).status).toBe(500);
  expect((await fetch(new URL("/components/Badge.tsx", app.url))).status).toBe(500);
  expect(app.messages).toHaveLength(1);
  expect(app.messages[0]).not.toContain(bugNotice);
});

it("keeps a compiler TypeError and its stack instead of converting it to author input", async () => {
  const app = await reportingDeck({
    "deck.config.ts": `function broken(){ return () => { throw new TypeError("Compiler exploded") } };
export default {title:"Failure", mdx:{remarkPlugins:[broken]}}`,
  });
  const response = await fetch(new URL("/slides/01-first.mdx", app.url));
  expect(response.status).toBe(500);
  const text = await response.text();
  expect(text).toContain("Compiler exploded");
  expect(text).toContain("stack");
  expect(app.messages.join("\n")).toMatch(/at .*deck.config.ts:\d+:\d+/);
  expect(app.messages.join("\n")).not.toContain("Check the slide and its MDX plugins");
});

it("keeps a notes parser failure without a source position and stack intact", async () => {
  const app = await reportingDeck({
    "slides/01-first.mdx": "---\nclicks: 0\n---\n# Notes",
    "deck.config.ts": `function broken(){ throw new TypeError("Parser exploded") };
export default {title:"Failure", mdx:{remarkPlugins:[broken]}}`,
  });
  const response = await fetch(new URL(virtual("notes"), app.url));
  expect(response.status).toBe(500);
  expect(await response.text()).toContain("Parser exploded");
  expect(app.messages.join("\n")).toMatch(/at .*deck.config.ts:\d+:\d+/);
  expect(app.messages.join("\n")).not.toContain("Check the slide and its MDX plugins");
});

it("reports a counting parser TypeError with its stack instead of serving an incorrect manifest", async () => {
  const app = await reportingDeck({
    "deck.config.ts": `import {existsSync} from "node:fs";
function broken(){if(existsSync(new URL("./fail-counting",import.meta.url))) throw new TypeError("Counting parser failed")};
export default {title:"Counting", mdx:{remarkPlugins:[broken]}}`,
  });
  await app.put("fail-counting", "Fail");
  const response = await fetch(new URL(virtual("manifest"), app.url));
  expect(response.status).toBe(500);
  expect(await response.text()).toContain("Counting parser failed");
  expect(app.messages.join("\n")).toMatch(/at .*deck.config.ts:\d+:\d+/);
});

it("checks component names after a deck remark plugin rewrites JSX", async () => {
  const app = await reportingDeck({
    "slides/01-first.mdx": "<Tweet />",
    "deck.config.ts": `function rewrite(){return tree => { for (const node of tree.children) if(node.name === "Tweet") node.name = "div" }};
export default {title:"Rewrite", mdx:{remarkPlugins:[rewrite]}}`,
  });
  const response = await fetch(new URL("/slides/01-first.mdx", app.url));
  expect(response.status, await response.text()).toBe(200);
});
