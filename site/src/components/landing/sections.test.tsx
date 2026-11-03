import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AgentRun, HookDenial } from "../../data/fixtures";
import type { Example } from "../../lib/player/example";
import {
  CompareTable,
  DeckProse,
  ExampleGallery,
  FileTree,
  HookPanel,
  ReleaseBanner,
  Requirements,
  Section,
  Transcript,
} from "./sections";

const run: AgentRun = {
  source: "smoke.jsonl",
  session: "s",
  prompt: "make a deck",
  turns: 87,
  durationMs: 495_917,
  costUsd: 3.1690836,
  toolCalls: 85,
  shownCalls: 3,
  steps: [
    { calls: ["Skill(building-a-deck)"], note: "Loads the workflow.", output: "Launching skill" },
    { calls: ["Read(a.md)", "Read(b.md)"], note: "", output: "" },
  ],
};

const example = (name: string, label: string, kind = "talk"): Example =>
  ({
    name,
    title: `${name} title`,
    href: `/demo/${name}/`,
    provenance: { kind, label },
    poster: { base: `/posters/${name}`, width: 1280, height: 720 },
    states: [],
  }) as unknown as Example;

describe("landing sections", () => {
  it("links the announcement and renders nothing without one", () => {
    const { container, rerender } = render(
      <ReleaseBanner announcement={{ label: "v1 is out", href: "/releases" }} />,
    );
    expect(screen.getByRole("link", { name: "v1 is out" })).toHaveAttribute("href", "/releases");
    rerender(<ReleaseBanner announcement={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists requirements as label and text, and renders nothing without any", () => {
    const { container, rerender } = render(
      <Requirements items={[{ label: "Runtime", text: "Node 22." }]} />,
    );
    expect(screen.getByText("Runtime").tagName).toBe("DT");
    expect(screen.getByText("Node 22.").tagName).toBe("DD");
    rerender(<Requirements items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("draws the generated files as a tree with notes on the files that have one", () => {
    render(
      <FileTree
        files={["CLAUDE.md", "decks/my-talk/slides.md", "decks/my-talk/pages/01-cover.md"]}
        notes={{ "decks/my-talk/slides.md": "The deck's manifest." }}
        commands={["decks init", "decks new my-talk --story"]}
      />,
    );
    const figure = screen.getByRole("figure");
    expect(figure).toHaveTextContent(
      "After bun add, then decks init and decks new my-talk --story",
    );
    expect(screen.getByText("slides.md").nextElementSibling).toHaveTextContent(
      "The deck's manifest.",
    );
    expect(screen.getByText("CLAUDE.md").nextElementSibling).toBeNull();
    // Directories come first, and a directory with one child folds into its path.
    const names = [...figure.querySelectorAll(".tree-name")].map((n) => n.textContent);
    expect(names[0]).toBe("decks/my-talk/");
    expect(names.at(-1)).toBe("CLAUDE.md");
  });

  it("labels each side of a comparison row, even when stacked", () => {
    render(<CompareTable rows={[{ topic: "Going back", vclick: "Snaps.", decks: "Reverses." }]} />);
    const row = screen.getByRole("heading", { name: "Going back" }).parentElement as HTMLElement;
    expect(row).toHaveTextContent("v-click and a chart librarySnaps.");
    expect(row).toHaveTextContent("Decks story slideReverses.");
  });

  it("labels the transcript as an abbreviated real run with its own figures", () => {
    render(<Transcript run={run} deck="the tides deck" />);
    const figure = screen.getByRole("figure");
    expect(figure).toHaveTextContent("The run that drafted the tides deck, abbreviated");
    expect(figure).toHaveTextContent("87 turns, 8 minutes, $3.17. 3 of 85 tool calls shown.");
    expect(figure).toHaveTextContent('claude -p "make a deck"');
    expect(within(figure).getAllByRole("listitem")).toHaveLength(3);
  });

  it("shows the planted line and the hook's own denial, kept out of the prose lint", () => {
    const denial: HookDenial = {
      hook: ".claude/hooks/decks.sh",
      tool: "Write",
      file: "pages/01.md",
      line: "<p>At its core.</p>",
      decision: "deny",
      rules: ["banned-phrase", "ai-vocab"],
      reason: ["BLOCKED: found.", "stdin:1 [banned-phrase]"],
    };
    render(<HookPanel denial={denial} />);
    const line = screen.getByText("<p>At its core.</p>");
    expect(line.closest("[data-lint-skip]")).not.toBeNull();
    expect(screen.getByText(/BLOCKED: found\./)).toBeInTheDocument();
    expect(screen.getByText("ai-vocab")).toBeInTheDocument();
  });

  it("links each example deck with its poster and how it was made", () => {
    render(
      <ExampleGallery examples={[example("a", "Template deck"), example("b", "From the talks")]} />,
    );
    const link = screen.getByRole("link", { name: /^a title/ });
    expect(link).toHaveAttribute("href", "/demo/a/");
    expect(link).toHaveAttribute("data-example", "a");
    expect(link.querySelector("img")).toHaveAttribute("src", "/posters/a-640.webp");
    expect(screen.getByText("From the talks")).toBeInTheDocument();
  });

  it("tags each example row with how the deck was made", () => {
    render(
      <ExampleGallery
        examples={[
          example("a", "Drafted by Claude Code", "agent"),
          example("b", "From a talk", "talk"),
          example("c", "Template deck", "template"),
          example("d", "Made by hand", "hand"),
        ]}
      />,
    );
    const rows = screen.getAllByRole("link");
    expect(rows.map((row) => row.getAttribute("data-kind"))).toEqual([
      "agent",
      "talk",
      "template",
      "hand",
    ]);
    expect(rows.map((row) => row.querySelector(".kind-tag")?.textContent)).toEqual([
      "Agent",
      "Talk",
      "Template",
      "By hand",
    ]);
  });

  it("sits a section on the canvas unless it asks for a band", () => {
    const { container, rerender } = render(
      <Section id="s" title="A claim.">
        <p>Body</p>
      </Section>,
    );
    expect(container.querySelector("section")).toHaveAttribute("data-tone", "canvas");
    expect(screen.getByRole("region", { name: "A claim." })).toBeInTheDocument();
    rerender(
      <Section id="s" title="A claim." tone="band">
        <p>Body</p>
      </Section>,
    );
    expect(container.querySelector("section")).toHaveAttribute("data-tone", "band");
  });

  it("prints a deck's text for readers without JavaScript", () => {
    const deck = {
      title: "Tides",
      href: "/demo/tides/",
      states: [
        { slide: 1, beat: 0, beats: 1, lead: "", body: "" },
        { slide: 2, beat: 1, beats: 3, lead: "Lead.", body: "Body." },
      ],
    } as Example;
    const { container } = render(<DeckProse example={deck} />);
    expect(container.firstElementChild).toHaveClass("no-js-only");
    expect(screen.getByText("Slide 2, step 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the example deck" })).toHaveAttribute(
      "href",
      "/demo/tides/",
    );
  });
});
