import { type CallExpression, parseSync, Visitor } from "oxc-parser";
import { createServer } from "vite";
import { describe, expect, it, onTestFinished } from "vitest";
import { fixture as createFixture } from "./deck.test-support";
import { loadDeck, reactDecks, scanSlides } from "./index";

const fixture = (files?: Record<string, string>) => createFixture(onTestFinished, files);

async function scan(body: string) {
  const { dir } = await fixture({
    "components/motion.tsx":
      'export { Step, Steps, Stagger, TextReveal, Highlight, CountUp, Draw } from "@react-decks/motion";',
    "slides/01-first.mdx": body,
  });
  return scanSlides(await loadDeck(dir));
}

describe("static click totals", () => {
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
  it.each(["TextReveal", "CountUp"])("counts at on %s", async (name) => {
    expect((await scan(`<${name} at={3} />`))[0]?.meta.clicks).toBe(3);
  });
  it("counts Steps from its first click and direct JSX element children", async () => {
    const slides = await scan(`<Steps from={2}>
  <div>
    <span>Nested child</span>
  </div>
  <span>
    Second child
  </span>
</Steps>`);
    expect(slides[0]?.meta.clicks).toBe(3);
  });
  it("counts no contribution for empty Steps", async () => {
    expect((await scan("<Steps from={7}>   </Steps>"))[0]?.meta.clicks).toBe(0);
  });
  it.each(["-", "1."])(
    "counts only top-level items in a single %s markdown list",
    async (marker) => {
      const slides = await scan(
        `<Steps from={2}>\n\n${marker} First\n${" ".repeat(marker.length + 1)}- Nested\n${marker} Second\n\n</Steps>`,
      );
      expect(slides[0]?.meta.clicks).toBe(3);
    },
  );
  it.each(["ul", "ol"])("counts the top-level li children of a sole JSX %s", async (name) => {
    const slides = await scan(
      `<Steps from={2}><${name}><li>One<ul><li>Nested</li></ul></li><li>Two</li></${name}></Steps>`,
    );
    expect(slides[0]?.meta.clicks).toBe(3);
  });
  it.each([
    "<Step at={1} {...props} />",
    "<Step at={1} {...{until: 4}} />",
    "<Steps from={1} {...props}><b /></Steps>",
    "<TextReveal {...props} at={1} />",
  ])("requires explicit clicks for a counted element with spread props: %s", async (body) => {
    await expect(scan(body)).rejects.toThrow(/01-first\.mdx.*(Step|TextReveal).*spread.*clicks/);
    expect((await scan(`---\nclicks: 4\n---\n${body}`))[0]?.meta.clicks).toBe(4);
  });
  it.each([
    ["adjacent li lines", "<li>One</li>\n<li>Two</li>"],
    ["adjacent div lines", "<div>One</div>\n<div>Two</div>"],
    ["li blocks", "<li>One</li>\n\n<li>Two</li>"],
    ["div blocks", "<div>One</div>\n\n<div>Two</div>"],
    ["a JSX list", "<ul>\n<li>One</li>\n<li>Two</li>\n</ul>"],
    ["a JSX ordered list with blank lines", "<ol>\n<li>One</li>\n\n<li>Two</li>\n</ol>"],
    ["a markdown list", "\n- One\n- Two\n"],
    ["multiline children", "<div>\nOne\n</div>\n<div>\nTwo\n</div>"],
    ["a non-breaking space", "<li>One</li>&nbsp;<li>Two</li>", true],
  ])(
    "matches the children MDX actually compiles for %s",
    async (_name, children, paragraph = false) => {
      const body = `<Steps from={1}>\n${children}\n</Steps>`;
      const { dir, put } = await fixture({
        "components/motion.tsx": 'export { Steps } from "@react-decks/motion";',
        // The override lets MDX compile a body the static counter should reject.
        "slides/01-first.mdx": paragraph ? `---\nclicks: 0\n---\n${body}` : body,
      });
      const deck = await loadDeck(dir);
      const server = await createServer({
        configFile: false,
        plugins: reactDecks(deck),
        server: { port: 0 },
        logLevel: "silent",
      });
      onTestFinished(() => server.close());
      const compiled = await server.transformRequest("/slides/01-first.mdx");
      if (!compiled) throw new Error("MDX did not compile");
      const childCalls = (call: CallExpression): CallExpression[] => {
        const props = call.arguments[1];
        if (props?.type !== "ObjectExpression") return [];
        const children = props.properties.find(
          (property) =>
            property.type === "Property" &&
            property.key.type === "Identifier" &&
            property.key.name === "children",
        );
        if (children?.type !== "Property") return [];
        const values =
          children.value.type === "ArrayExpression" ? children.value.elements : [children.value];
        return values.filter((value): value is CallExpression => value?.type === "CallExpression");
      };
      let compiledCount: number | undefined;
      new Visitor({
        CallExpression(call) {
          if (call.arguments[0]?.type !== "Identifier" || call.arguments[0].name !== "Steps")
            return;
          let children = childCalls(call);
          const first = children[0];
          const only = first?.arguments[0];
          if (
            children.length === 1 &&
            first &&
            ((only?.type === "Literal" && (only.value === "ul" || only.value === "ol")) ||
              (only?.type === "MemberExpression" &&
                only.property.type === "Identifier" &&
                (only.property.name === "ul" || only.property.name === "ol")))
          )
            children = childCalls(first);
          compiledCount = children.length;
        },
      }).visit(parseSync("compiled.js", compiled.code).program);
      expect(compiledCount).toBe(paragraph ? 1 : 2);
      if (paragraph) {
        await put("slides/01-first.mdx", body);
        await expect(scanSlides(deck)).rejects.toThrow(/01-first\.mdx.*Steps.*children/);
      } else expect((await scanSlides(deck))[0]?.meta.clicks).toBe(compiledCount);
    },
  );
  it("rejects a list mixed with other Steps children", async () => {
    await expect(scan("<Steps from={1}>\n\n- One\n\n<div />\n</Steps>")).rejects.toThrow(
      /01-first\.mdx.*Steps.*children/,
    );
  });
  it("uses the largest nested, block or inline contribution", async () => {
    const slides = await scan(
      "<Step at={1}><Step at={4} /></Step>\n\nInline <Highlight at={2} until={5}>text</Highlight>.",
    );
    expect(slides[0]?.meta.clicks).toBe(5);
  });
  it("allows literal zero as the first click", async () => {
    expect(
      (await scan("<Step at={0} />\n\n<Steps from={0}><i /><b /></Steps>"))[0]?.meta.clicks,
    ).toBe(1);
  });
  it("ignores member names and code samples even with motion imports", async () => {
    expect(
      (
        await scan(
          'import * as motion from "@react-decks/motion";\n\n<motion.Step at={9} />\n\n`<Step at={7} />`\n\n```mdx\n<Step at={6} />\n```',
        )
      )[0]?.meta.clicks,
    ).toBe(0);
  });
  it("leaves steps inside a deck component to an explicit clicks override", async () => {
    const { dir, put } = await fixture({
      "components/Stage.tsx":
        'import { Step } from "@react-decks/motion"; export function Stage() { return <Step at={3} />; }',
      "slides/01-first.mdx": "<Stage />",
    });
    const deck = await loadDeck(dir);
    expect((await scanSlides(deck))[0]?.meta.clicks).toBe(0);
    await put("slides/01-first.mdx", "---\nclicks: 3\n---\n<Stage />");
    expect((await scanSlides(deck))[0]?.meta.clicks).toBe(3);
  });
  it.each([
    ["at", "<Step />"],
    ["at", "<Step at />"],
    ["at", '<Step at="2" />'],
    ["at", "<Step at={n} />"],
    ["at", "<Step at={1 + 1} />"],
    ["at", "<Step at={1.5} />"],
    ["at", "<Step at={-1} />"],
    ["until", '<Step at={1} until="2" />'],
    ["until", "<Step at={1} until={n} />"],
    ["until", "<Step at={1} until={1.5} />"],
    ["until", "<Step at={1} until={-1} />"],
    ["until", "<Step at={1} until={1} />"],
    ["until", "<Step at={2} until={1} />"],
    ["from", "<Steps><b /></Steps>"],
    ["from", '<Steps from="2"><b /></Steps>'],
    ["from", "<Steps from={n}><b /></Steps>"],
    ["from", "<Steps from={1.5}><b /></Steps>"],
    ["from", "<Steps from={-1}><b /></Steps>"],
  ])(
    "rejects a non-literal or invalid %s in %s naming file and attribute",
    async (attribute, body) => {
      await expect(scan(body)).rejects.toThrow(new RegExp(`01-first\\.mdx:[\\s\\S]*${attribute}`));
    },
  );
  it.each(["Plain markdown", "{items}", "**bold**"])(
    "rejects non-JSX Steps children: %s",
    async (child) => {
      await expect(scan(`<Steps from={1}>\n${child}\n</Steps>`)).rejects.toThrow(
        /01-first\.mdx.*Steps.*children/,
      );
    },
  );
  it.each([
    "{cond && <Step at={1} />}",
    "{items.map(item => <Steps from={1}><b /></Steps>)}",
    "<div child={<CountUp at={1} to={3} />} />",
    "export const content = <Draw at={1} />;",
  ])("rejects counted names inside JavaScript expressions: %s", async (body) => {
    await expect(scan(body)).rejects.toThrow(/01-first\.mdx.*(Step|CountUp|Draw).*expression/);
  });
  it.each([0, 2])(
    "uses explicit clicks %s without validating the body for counting",
    async (clicks) => {
      const slides = await scan(
        `---\nclicks: ${clicks}\n---\n<Step at={n} />\n\n<Steps from={-1}>{items}</Steps>\n\n{cond && <Step at={1} />}`,
      );
      expect(slides[0]?.meta.clicks).toBe(clicks);
      expect(slides[0]?.frontmatter.clicks).toBe(clicks);
    },
  );
  it("leaves an unparseable body's cold-start total at zero for its compiler", async () => {
    expect((await scan("<Step at={3}>"))[0]?.meta.clicks).toBe(0);
  });
});
