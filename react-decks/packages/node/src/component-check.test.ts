import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { expect, it } from "vitest";
import { checkComponents } from "./component-check";

it.each([
  "{[1,2].map((Item) => <Item key={Item} />)}",
  "export function Wrap({ As }) { return <As /> }\n\n<Wrap />",
  "export const Wrap = function({ As }) { return <As /> }\n\n<Wrap />",
  "{(() => { const Local = () => null; return <Local /> })()}",
])("accepts locally bound component names: %s", async (source) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(checkComponents(() => new Set()));
  await expect(processor.run(processor.parse(source))).resolves.toBeDefined();
});
