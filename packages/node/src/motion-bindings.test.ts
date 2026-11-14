import { describe, expect, it, onTestFinished } from "vitest";
import { fixture as createFixture, scanMotion as scan } from "./deck.test-support";
import { loadDeck, scanSlides } from "./index";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);
describe("motion bindings", () => {
  it.each([
    {
      component: 'export { Step as Reveal } from "@steamfield/decks/motion";',
      slide: "<Reveal at={3} />",
    },
    {
      component: "export {};",
      slide: 'import { Step as Reveal } from "@steamfield/decks/motion";\n\n<Reveal at={3} />',
    },
  ])("counts public motion bindings in $slide", async ({ component, slide }) => {
    const { dir } = await fixture({
      "components/motion.tsx": component,
      "slides/01-first.mdx": slide,
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(3);
  });
  it("counts Step re-exported from motion by the deck", async () => {
    const { dir } = await fixture({
      "components/motion.tsx": 'export { Step } from "@react-decks/motion";',
      "slides/01-first.mdx": "<Step at={2} />",
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(2);
  });
  it("counts a motion re-export alias using the original component's rules", async () => {
    const { dir } = await fixture({
      "components/motion.tsx": 'export { Step as Reveal } from "@react-decks/motion";',
      "slides/01-first.mdx": "<Reveal at={3} />",
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(3);
  });
  it.each([
    ['import { Step } from "@react-decks/motion"; export { Step };', "Step"],
    ['import { Step as Local } from "@react-decks/motion"; export { Local };', "Local"],
    ['import { Step } from "@react-decks/motion"; export { Step as Reveal };', "Reveal"],
    ['import { Step as Local } from "@react-decks/motion"; export { Local as Reveal };', "Reveal"],
  ])("counts a locally exported motion import: %s", async (source, name) => {
    const { dir } = await fixture({
      "components/motion.tsx": source,
      "slides/01-first.mdx": `<${name} at={3} />`,
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(3);
  });
  it("counts Steps imported in MDX under a local name", async () => {
    const { dir } = await fixture({
      "slides/01-first.mdx": `import { Steps as List } from "@react-decks/motion";

<List from={1}>
  <div>
    One
  </div>

  <div>
    Two
  </div>

  <div>
    Three
  </div>
</List>`,
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(3);
  });
  it("counts a provided Step without a deck re-export", async () => {
    const { dir } = await fixture({ "slides/01-first.mdx": "<Step at={2} />" });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(2);
  });
  it("lets a slide's motion import override a local deck component", async () => {
    const { dir } = await fixture({
      "components/Step.tsx": "export function Step() { return null; }",
      "slides/01-first.mdx": 'import { Step } from "@react-decks/motion";\n\n<Step at={2} />',
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(2);
  });
  it("does not count a motion export overwritten by the same file's default component basename", async () => {
    const { dir } = await fixture({
      "components/Step.tsx":
        'export { Step } from "@react-decks/motion"; export default function LocalStep() { return null; }',
      "slides/01-first.mdx": "<Step at={n} />",
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(0);
  });
  it("lets a slide's relative import override a deck motion binding", async () => {
    const { dir } = await fixture({
      "components/motion.tsx": 'export { Step } from "@react-decks/motion";',
      "components/Local.tsx": "export function Local() { return null; }",
      "slides/01-first.mdx":
        'import { Local as Step } from "../components/Local";\n\n<Step at={n} {...props} />\n\n{true && <Step at={n} />}',
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(0);
  });
  it.each([
    "export const Step = () => null;",
    "export function Step() { return null; }",
    "export class Step {}",
    "export const { Local: Step } = { Local: () => null };",
  ])(
    "does not count a motion name shadowed by a top-level declaration: %s",
    async (declaration) => {
      const { dir } = await fixture({
        "components/motion.tsx": 'export { Step } from "@react-decks/motion";',
        "slides/01-first.mdx": `${declaration}\n\n<Step at={n} {...props} />\n\n{true && <Step at={n} />}`,
      });
      expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(0);
    },
  );
  it.each(["deck", "slide"])(
    "does not count a lowercase motion alias from the %s",
    async (owner) => {
      const { dir } = await fixture({
        "components/motion.tsx":
          owner === "deck" ? 'export { Step as reveal } from "@react-decks/motion";' : "export {};",
        "slides/01-first.mdx": `${owner === "slide" ? 'import { Step as reveal } from "@react-decks/motion";' : ""}\n\n<reveal at={3}>Evidence</reveal>`,
      });
      expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(0);
    },
  );
  it("counts an import from multiline ESM syntax without treating import text as a binding", async () => {
    const { dir } = await fixture({
      "slides/01-first.mdx": `import {
  Step /* alias */ as Reveal
} from "@react-decks/motion";

export const example = 'import { Step } from "@react-decks/motion"';

<Reveal at={2} until={4} />

<Step at={2} />`,
    });
    expect((await scanSlides(await loadDeck(dir)))[0]?.meta.clicks).toBe(4);
  });
  it.each([
    ["Step", "<Reveal at={n} />", "at"],
    ["Step", "<Reveal at={1} {...props} />", "spread"],
    ["Step", "{true && <Reveal at={1} />}", "expression"],
    ["Steps", "<Reveal from={1}>Plain text</Reveal>", "children"],
  ])("validates an imported %s alias in %s", async (imported, body, error) => {
    const { dir } = await fixture({
      "slides/01-first.mdx": `import { ${imported} as Reveal } from "@react-decks/motion";\n\n${body}`,
    });
    await expect(scanSlides(await loadDeck(dir))).rejects.toThrow(
      new RegExp(`01-first\\.mdx.*${error}`),
    );
  });
  it.each(["Step", "Stagger", "Highlight", "Draw"])(
    "counts at or until on %s elements",
    async (name) => {
      const slides = await scan(`<${name} at={2} />\n\n<${name} at={3} until={4} />`);
      expect(slides[0]?.meta.clicks).toBe(4);
      expect(slides[0]?.frontmatter).not.toHaveProperty("clicks");
      expect((await scan(`<${name} at={2} />`))[0]?.meta.clicks).toBe(2);
    },
  );
});
