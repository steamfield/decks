import { expect, it } from "vitest";
import { DeckError } from "../dev/errors";
import { readSlide } from "./slides";

const file = "slides/45-tour.mdx";
for (const [name, prop, literal] of [
  ["Camera", "stops", "[{x: 1, y: 2, zoom: 1}, centre, end]"],
  ["ShapeMorph", "paths", '["M0 0H2", second, last]'],
] satisfies [string, string, string][]) {
  const element = (value: string) => `<${name} at={3} ${prop}={${value}} />`;
  it(`counts at plus length minus 2 for a literal stops or paths array (${name})`, () => {
    expect(readSlide(element(literal), file).clicks).toBe(4);
    expect(readSlide(`${element(literal)}\n\n<Step at={8} />`, file).clicks).toBe(8);
  });
  it(`throws the set-clicks error for a non-literal array without frontmatter clicks (${name})`, () => {
    const message = `${file}:1:1: <${name}> ${prop} must be an array literal of known length. To compute it, set clicks: in the frontmatter.`;
    for (const value of ["items", "[first, ...items]"]) {
      expect(() => readSlide(element(value), file)).toThrow(
        expect.objectContaining({ constructor: DeckError, file, message }),
      );
    }
  });
  it(`counts the final value of repeated ${name} attributes, as MDX renders them`, () => {
    const source = `<${name} at={1} ${prop}={items} at={3} ${prop}={${literal}} />`;
    expect(readSlide(source, file).clicks).toBe(4);
  });
  it(`frontmatter clicks replaces the count (${name})`, () => {
    expect(readSlide(element(literal), file).clicks).toBe(4);
    expect(readSlide(`---\nclicks: 0\n---\n${element(literal)}`, file).clicks).toBe(0);
    expect(readSlide(`---\nclicks: 0\n---\n${element("items")}`, file).clicks).toBe(0);
  });
}
