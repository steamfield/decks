import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HookDenial, SmokeRun } from "../../data/fixtures";
import type { Tape } from "../../lib/player/tape";
import {
  CompareTable,
  DeckProse,
  FitLists,
  Hero,
  HookPanel,
  JCard,
  ReleaseBanner,
  Transcript,
} from "./sections";

const run: SmokeRun = {
  source: "smoke.jsonl",
  session: "s",
  prompt: "make a deck",
  turns: 87,
  durationMs: 495_917,
  costUsd: 3.1690836,
  toolCalls: 85,
  steps: [
    { calls: ["Skill(building-a-deck)"], note: "Loads the workflow.", output: "Launching skill" },
    { calls: ["Read(a.md)", "Read(b.md)"], note: "", output: "" },
  ],
};

describe("landing sections", () => {
  it("links the announcement and renders nothing without one", () => {
    const { container, rerender } = render(
      <ReleaseBanner announcement={{ label: "v1 is out", href: "/releases" }} />,
    );
    expect(screen.getByRole("link", { name: "v1 is out" })).toHaveAttribute("href", "/releases");
    rerender(<ReleaseBanner announcement={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("puts the tagline in the page heading", () => {
    render(<Hero tagline="Slides that move" description="A Slidev addon." />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Slides that move");
  });

  it("lists what fits and what doesn't", () => {
    render(<FitLists yes={["You use Slidev."]} no={["You need light slides."]} />);
    expect(screen.getByRole("heading", { name: "Fits if" })).toBeInTheDocument();
    expect(screen.getByText("You need light slides.")).toBeInTheDocument();
  });

  it("labels each side of a comparison row, even when stacked", () => {
    render(<CompareTable rows={[{ topic: "Going back", vclick: "Snaps.", decks: "Reverses." }]} />);
    const row = screen.getByRole("heading", { name: "Going back" }).parentElement as HTMLElement;
    expect(row).toHaveTextContent("v-click and a chart librarySnaps.");
    expect(row).toHaveTextContent("Decks story slideReverses.");
  });

  it("numbers each side's tracks and links them to docs", () => {
    const track = { name: "Story engine", note: "story", href: "/docs/x/" };
    render(<JCard title="Decks 0.1.0" a={[track]} b={[{ ...track, name: "shot and snap" }]} />);
    expect(screen.getByText("Decks 0.1.0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Story engine" })).toHaveAttribute("href", "/docs/x/");
    expect(screen.getByRole("heading", { name: "Side B The repository" })).toBeInTheDocument();
  });

  it("labels the transcript as an abbreviated real run with its own figures", () => {
    render(<Transcript run={run} />);
    const figure = screen.getByRole("figure");
    expect(figure).toHaveTextContent(
      "Excerpt from the real run that drafted the tides deck, abbreviated",
    );
    expect(figure).toHaveTextContent("87 turns, 8.3 minutes, $3.17. 3 of 85 tool calls shown.");
    expect(figure).toHaveTextContent('claude -p "make a deck"');
    expect(within(figure).getAllByRole("listitem")).toHaveLength(3);
  });

  it("shows the planted line and the hook's own denial", () => {
    const denial: HookDenial = {
      hook: ".claude/hooks/lint.sh",
      tool: "Write",
      file: "pages/01.md",
      line: "<p>At its core.</p>",
      decision: "deny",
      rules: ["banned-phrase", "ai-vocab"],
      reason: ["BLOCKED: found.", "stdin:1 [banned-phrase]"],
    };
    render(<HookPanel denial={denial} />);
    expect(screen.getByText("<p>At its core.</p>")).toBeInTheDocument();
    expect(screen.getByText(/BLOCKED: found\./)).toBeInTheDocument();
    expect(screen.getByText("ai-vocab")).toBeInTheDocument();
  });

  it("prints a deck's text for readers without JavaScript", () => {
    const tape = {
      title: "Tides",
      href: "/demo/tides/",
      states: [
        { slide: 1, beat: 0, beats: 1, lead: "", body: "" },
        { slide: 2, beat: 1, beats: 3, lead: "Lead.", body: "Body." },
      ],
    } as Tape;
    const { container } = render(<DeckProse tape={tape} />);
    expect(container.firstElementChild).toHaveClass("no-js-only");
    expect(screen.getByText("Slide 2, step 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the example deck" })).toHaveAttribute(
      "href",
      "/demo/tides/",
    );
  });
});
