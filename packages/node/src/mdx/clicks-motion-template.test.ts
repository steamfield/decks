import { expect, it } from "vitest";
import { readSlide } from "./slides";

const file = "slides/01-ferry.mdx";
const imported = 'import { MotionTemplate as Graphic } from "@steamfield/decks/kit"';
const count = (props: string) => readSlide(`${imported}\n\n<Graphic ${props} />`, file).clicks;

it("counts at for one-beat templates, at plus 1 for two-beat templates, and at plus length minus 1 for a literal list", () => {
  for (const name of [
    "title-reveal",
    "lower-third",
    "stat-burst",
    "stat-compare",
    "metric-grid",
    "quote-card",
    "section-wipe",
    "agenda",
    "end-card",
    "spotlight",
  ]) {
    expect(count(`template="${name}" at={3}`)).toBe(3);
    expect(count(`template="${name}"`)).toBe(0);
  }
  for (const name of ["comparison-split", "myth-fact"])
    expect(count(`template={"${name}"}`)).toBe(1);
  for (const [name, list] of [
    ["timeline-sweep", "events"],
    ["process-flow", "steps"],
    ["list-cascade", "items"],
  ]) {
    expect(count(`template="${name}" ${list}={[a,b,c]} at={3}`)).toBe(5);
    expect(count(`template="${name}" ${list}={[a]}`)).toBe(0);
  }
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
      message: `${file}:3:1: <Graphic template="title-revael">: unknown template. Valid templates: agenda, comparison-split, device-mockup, end-card, icon-array, list-cascade, logo-reveal, lower-third, metric-grid, myth-fact, photo-reveal, process-flow, quote-card, section-wipe, spotlight, stat-burst, stat-compare, team-grid, timeline-sweep, title-reveal, venn-overlap.`,
    }),
  );
});
