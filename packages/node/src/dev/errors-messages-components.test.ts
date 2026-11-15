import { expect, it } from "vitest";
import { serve } from "./server.test-support";

it.each(
  [
    [
      "framework components",
      "<Center><Step at={0}>Provided</Step><Morph name='card'>Card</Morph></Center>",
      {},
    ],
    [
      "deck components",
      "<Badge />",
      { "components/Badge.tsx": "export default function Badge(){return null}" },
    ],
    [
      "slide imports",
      'import { Badge as Local } from "../components/nested/Local"\n\n<Local />',
      { "components/nested/Local.tsx": "export function Badge(){return null}" },
    ],
    ["slide declarations", "export const Badge = () => <span>Local</span>\n\n<Badge />", {}],
    ["member names", "<motion.div />", {}],
    ["lowercase elements", "<custom-element />", {}],
    ["code fences", "```mdx\n<Nonexistent />\n```", {}],
  ].map(([name, source, files]) => ({ name, source, files })),
)("$name do not trigger undefined-component errors", async ({ source, files }) => {
  if (typeof source !== "string" || typeof files !== "object") throw new Error("Invalid fixture");
  const app = await serve({ ...files, "slides/01-first.mdx": source });
  const response = await fetch(new URL("/slides/01-first.mdx", app.url));
  expect(response.status, await response.text()).toBe(200);
});

it("checks JSX inside expressions too", async () => {
  const app = await serve({ "slides/01-first.mdx": "{true && <Missing />}" });
  const response = await fetch(new URL("/slides/01-first.mdx", app.url));
  expect(response.status).toBe(500);
  expect(await response.text()).toContain("Missing> is not defined");
});

it("requires the local name of an aliased import", async () => {
  const app = await serve({
    "components/nested/Local.tsx": "export function Badge(){return null}",
    "slides/01-first.mdx":
      'import { Badge as Local } from "../components/nested/Local"\n\n<Badge />',
  });
  const response = await fetch(new URL("/slides/01-first.mdx", app.url));
  expect(response.status).toBe(500);
  expect(await response.text()).toContain("Badge> is not defined");
});
