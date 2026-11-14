import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { manifest, serve } from "./deck.test-support";
import { build, loadDeck } from "./index";

describe("virtual-modules", () => {
  it("loads a deck's own Highlight without counting or validating its at expression", async () => {
    const app = await serve({
      "components/Highlight.tsx": "export function Highlight() { return <b>Local highlight</b>; }",
      "slides/01-first.mdx": "export const n = 3;\n\n<Highlight at={n} />",
    });
    expect((await manifest(app)).manifest.slides[0].clicks).toBe(0);
    expect(await app.get("/slides/01-first.mdx")).toContain("Highlight");
    await build(await loadDeck(app.dir), { outDir: join(app.dir, "site") });
  });
  it.each([
    'export { Step, Steps, Stagger, TextReveal, Highlight, CountUp, Draw } from "@react-decks/motion";',
    'import { Step, Steps, Stagger, TextReveal, Highlight, CountUp, Draw } from "@react-decks/motion"; export { Step, Steps, Stagger, TextReveal, Highlight, CountUp, Draw };',
  ])("allows motion re-exports without loading them on the server: %s", async (source) => {
    const app = await serve({
      "components/Motion.tsx": source,
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/components");
    expect(Object.keys(module.components).sort()).toEqual(
      ["Step", "Steps", "Stagger", "TextReveal", "Highlight", "CountUp", "Draw"].sort(),
    );
  });
  it("serves manifest loaders and all frontmatter while hidden slides never compile", async () => {
    const app = await serve({
      "slides/02-hidden.mdx": "---\nhide: true\n---\n<broken",
      "slides/03-last.mdx": "---\ncustom: yes\n---\n# Last",
    });
    const module = await manifest(app);
    expect(module.manifest.slides).toMatchObject([
      { no: 1, id: "01-first" },
      { no: 2, id: "03-last" },
    ]);
    expect(module.frontmatter["03-last"]).toEqual({ hide: false, title: "03-last", custom: "yes" });
    expect(Object.keys(module.slides)).toEqual(["01-first", "03-last"]);
    expect(typeof (await module.slides["01-first"]()).default).toBe("function");
    expect(await app.get("/slides/01-first.mdx")).toContain("First slide");
  });
  it("provides named exports and defaults under basenames and ignores subdirectories", async () => {
    const app = await serve({
      "components/Badge.tsx":
        "export default function Badge() { return <span>Badge</span> }; export const Accent = () => <b>Accent</b>;",
      "components/Other.tsx": "export function Other() { return <i>Other</i> }",
      "components/nested/ignored.tsx": 'throw new Error("must not load")',
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/components");
    expect(Object.keys(module.components).sort()).toEqual(["Accent", "Badge", "Other"]);
    for (const component of Object.values(module.components))
      expect(typeof component).toBe("function");
  });
  it("names both files when component exports collide", async () => {
    const app = await serve({
      "components/Badge.tsx": "export default function Badge() {}",
      "components/Other.tsx": "export function Badge() {}",
    });
    const response = await fetch(new URL("/@id/__x00__virtual:react-decks/manifest", app.url));
    expect(response.status).toBe(500);
    expect(await response.text()).toMatch(/Badge.*components\/Badge\.tsx.*components\/Other\.tsx/);
  });
  it("accepts a component exported as both named and default from the same file", async () => {
    const app = await serve({
      "components/Badge.tsx": "export function Badge() {} export default Badge;",
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/components");
    expect(Object.keys(module.components)).toEqual(["Badge"]);
    expect(typeof module.components.Badge).toBe("function");
  });
  it("ignores type exports while providing explicit re-exports", async () => {
    const app = await serve({
      "components/Barrel.tsx":
        'export type * from "./nested/Badge"; export type Props = {}; export { Badge as Renamed } from "./nested/Badge";',
      "components/nested/Badge.tsx": "export function Badge() { return null; }",
    });
    const module = await app.server.ssrLoadModule("virtual:react-decks/components");
    expect(Object.keys(module.components)).toEqual(["Renamed"]);
    expect(typeof module.components.Renamed).toBe("function");
  });
  it("uses components passed through props without importing an MDX provider", async () => {
    const app = await serve({
      "render.tsx":
        'import { renderToStaticMarkup } from "react-dom/server"; import Slide from "./slides/01-first.mdx"; export function render() { return renderToStaticMarkup(<Slide components={{ h1: "header" }} />); }',
    });
    const slide = await app.get("/slides/01-first.mdx");
    expect(slide).not.toContain("@mdx-js/react");
    expect((await app.server.ssrLoadModule("/render.tsx")).render()).toBe(
      "<header>First slide</header>",
    );
  });
  it("exports only the component from slides with object-valued frontmatter for Fast Refresh", async () => {
    const app = await serve({ "slides/01-first.mdx": "---\ncustom:\n  colour: blue\n---\n# Body" });
    expect(Object.keys(await app.server.ssrLoadModule("/slides/01-first.mdx"))).toEqual([
      "default",
    ]);
    expect((await manifest(app)).frontmatter["01-first"]).toEqual({
      hide: false,
      title: "01-first",
      custom: { colour: "blue" },
    });
  });
});
