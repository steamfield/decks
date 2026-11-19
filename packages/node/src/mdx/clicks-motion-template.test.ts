import { expect, it } from "vitest";
import { readSlide } from "./slides";

const file = "slides/01-ferry.mdx";
const imported = 'import { MotionTemplate as Graphic } from "@steamfield/decks/kit"';
const count = (props: string) => readSlide(`${imported}\n\n<Graphic ${props} />`, file).clicks;

it.each([
  "agenda",
  "command-line",
  "device-mockup",
  "end-card",
  "icon-array",
  "logo-reveal",
  "lower-third",
  "metric-grid",
  "photo-reveal",
  "quote-card",
  "scramble-text",
  "section-wipe",
  "spotlight",
  "stat-burst",
  "stat-compare",
  "team-grid",
  "title-reveal",
  "venn-overlap",
])("counts at for the one-beat template %s, and 0 without at", (name) => {
  expect([count(`template="${name}" at={3}`), count(`template="${name}"`)]).toEqual([3, 0]);
});

it.each([
  ["bar-board", 'template="bar-board" at={2}', 3],
  ["comparison-split", 'template={"comparison-split"}', 1],
  ["myth-fact", 'template={"myth-fact"}', 1],
  ["myth-fact", 'template="myth-fact" at={3}', 4],
])("counts at plus 1 for the two-beat template %s: %s", (_name, props, clicks) => {
  expect(count(props)).toBe(clicks);
});

it.each([
  ["timeline-sweep", "events"],
  ["process-flow", "steps"],
  ["list-cascade", "items"],
  ["word-swap", "words"],
  ["donut-build", "segments"],
])("counts at plus length minus 1 for the %s literal %s list", (name, list) => {
  expect([
    count(`template="${name}" ${list}={[a,b,c]} at={3}`),
    count(`template="${name}" ${list}={[a]}`),
  ]).toEqual([5, 0]);
});

it("throws the set-clicks error for a non-literal list without frontmatter clicks", () => {
  for (const value of ["steps", "[first,...rest]"]) {
    const props = `template="process-flow" steps={${value}}`;
    expect(() => count(props)).toThrow(
      expect.objectContaining({
        name: "DeckError",
        file,
        message: `${file}:3:1: <Graphic> steps must be an array literal of known length. To compute it, set clicks: in the frontmatter.`,
      }),
    );
    expect(readSlide(`---\nclicks: 4\n---\n${imported}\n\n<Graphic ${props} />`, file).clicks).toBe(
      4,
    );
  }
});

it("requires frontmatter clicks for a computed template name", () => {
  expect(() => count("template={choice}")).toThrow(
    expect.objectContaining({
      name: "DeckError",
      file,
      message: `${file}:3:1: <Graphic> template must be a literal string. To compute it, set clicks: in the frontmatter.`,
    }),
  );
});

it("names the selected template and invalid at in an MDX counting error", () => {
  expect(() => count('template="spotlight" at={-1}')).toThrow(
    expect.objectContaining({
      name: "DeckError",
      message: `${file}:3:1: <Graphic template="spotlight" at={-1}>: at must be a literal whole number (at={2}). To compute it, set clicks: in the frontmatter.`,
    }),
  );
});

it("names an unknown template literal and lists the valid templates", () => {
  expect(() => count('template="title-revael" at={1}')).toThrow(
    expect.objectContaining({
      name: "DeckError",
      file,
      message: `${file}:3:1: <Graphic template="title-revael">: unknown template. Valid templates: agenda, bar-board, command-line, comparison-split, device-mockup, donut-build, end-card, icon-array, list-cascade, logo-reveal, lower-third, metric-grid, myth-fact, photo-reveal, process-flow, quote-card, scramble-text, section-wipe, spotlight, stat-burst, stat-compare, team-grid, timeline-sweep, title-reveal, venn-overlap, word-swap.`,
    }),
  );
});
