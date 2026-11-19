import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Example } from "../../lib/player/example";
import {
  CompareTable,
  DeckProse,
  ExampleGallery,
  FileTree,
  ReleaseBanner,
  Requirements,
  Section,
} from "./sections";

const example = (name: string, label: string, kind = "talk"): Example =>
  ({
    name,
    title: `${name} title`,
    href: `/d/${name}/`,
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

  it("links each example deck with its poster and how it was made", () => {
    render(
      <ExampleGallery examples={[example("a", "Template deck"), example("b", "From the talks")]} />,
    );
    const link = screen.getByRole("link", { name: /^a title/ });
    expect(link).toHaveAttribute("href", "/d/a/");
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
      href: "/d/tides/",
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
      "/d/tides/",
    );
  });
});
