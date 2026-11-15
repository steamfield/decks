import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { expect, it } from "vitest";
import { checkComponents } from "./component-check";

const check = (source: string) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(checkComponents(() => new Set()));
  return processor.run(processor.parse(source));
};

// Each accepted source is paired with a source that lacks the binding which makes it valid, so a
// checker that accepts everything cannot pass.
it.each([
  {
    accepted: "export function Wrap({ As }) { return <As /> }\n\n<Wrap />",
    rejected: "<Wrap />",
    missing: "Wrap",
  },
  {
    accepted: "export const Wrap = function({ As }) { return <As /> }\n\n<Wrap />",
    rejected: "<Wrap />",
    missing: "Wrap",
  },
  {
    accepted: "{[1,2].map((Item) => <Item key={Item} />)}",
    rejected: "{[1,2].map((Item) => <Item key={Item} />)}\n\n<Item />",
    missing: "Item",
  },
  {
    accepted: "{(() => { const Local = () => null; return <Local /> })()}",
    rejected: "{(() => { const Local = () => null; return <Local /> })()}\n\n<Local />",
    missing: "Local",
  },
])("accepts locally bound component names: $accepted", async ({ accepted, rejected, missing }) => {
  await expect(check(accepted)).resolves.toBeDefined();
  await expect(check(rejected)).rejects.toThrow(`<${missing}> is not defined`);
});
