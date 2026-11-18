import { expect, it } from "vitest";
import { readSlide } from "./slides";

const imported = 'import { ChartSteps as CS } from "@steamfield/decks/kit"';
const file = "slides/01-chart.mdx";
const dynamic = `${imported}\n\n<CS at={2} specs={series} />`;

it("counts at plus specs length minus 2 for a literal specs array", () => {
  expect(
    readSlide(`${imported}\n\n<CS at={2} specs={[first, second, third]} />`, file).clicks,
  ).toBe(3);
});

it("throws the set-clicks error for a non-literal specs without frontmatter clicks", () => {
  expect(() => readSlide(dynamic, file)).toThrow(
    expect.objectContaining({
      name: "DeckError",
      message:
        "slides/01-chart.mdx:3:1: <CS specs={series}>: specs must be a literal array. To compute it, set clicks: in the frontmatter.",
    }),
  );
});

it("frontmatter clicks replaces the count", () => {
  expect(readSlide(`---\nclicks: 5\n---\n${dynamic}`, file).clicks).toBe(5);
});

it("counts the last specs prop when the prop is repeated, as MDX applies it", () => {
  expect(
    readSlide(`${imported}\n\n<CS at={2} specs={[only]} specs={[a, b, c, d]} />`, file).clicks,
  ).toBe(4);
});

it("counts the last at prop when the prop is repeated, as MDX applies it", () => {
  expect(readSlide(`${imported}\n\n<CS at={2} at={5} specs={[a, b]} />`, file).clicks).toBe(5);
});
