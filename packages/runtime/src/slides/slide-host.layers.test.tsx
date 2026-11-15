import { act, render, screen } from "@testing-library/react";
import { expect, it, onTestFinished } from "vitest";
import { makeSource } from "../deck.test-support";
import { DeckContext } from "../hooks";
import { createDeckStore, type RenderContext, SlideHost, useDeck, useSlide } from "../index";
import { createSlideModules } from "../source";

function Above() {
  const { no, renderContext } = useSlide();
  const { total } = useDeck();
  return (
    <p>
      Above {no} / {total} in {renderContext}
    </p>
  );
}
function layerTransitionName(layer: HTMLElement | null): string {
  if (!layer) throw new Error("Missing layer element");
  return layer.style.getPropertyValue("view-transition-name");
}

function Below() {
  return <p>Below {useSlide().no}</p>;
}

it.each([undefined, false, "above", "below"])(
  "renders the selected layers for frontmatter %s in every context",
  async (layers) => {
    const base = makeSource();
    const source = {
      ...base,
      frontmatter: { "slide-2": { layers } },
      layers: { above: Above, below: Below },
    };
    window.history.replaceState(null, "", "/#/2");
    const store = createDeckStore(source.manifest);
    onTestFinished(() => store.destroy());
    const modules = createSlideModules(source);
    const contexts: RenderContext[] = ["slide", "presenter", "preview", "overview", "print"];
    const { container } = render(
      <DeckContext value={{ source, store, modules }}>
        {contexts.map((context) => (
          <SlideHost key={context} no={2} context={context} />
        ))}
        <SlideHost no={1} context="slide" />
      </DeckContext>,
    );
    await screen.findByText("Title 2", { selector: '[data-deck-context="print"] h1' });
    for (const context of contexts) {
      const root = container.querySelector(`[data-deck-slide="2"][data-deck-context="${context}"]`);
      if (!root) throw new Error(`Missing ${context} slide`);
      const above = root.querySelector<HTMLElement>('[data-deck-layer="above"]');
      const below = root.querySelector<HTMLElement>('[data-deck-layer="below"]');
      if (layers !== false && layers !== "below") {
        expect(above).toHaveTextContent(`Above 2 / 5 in ${context}`);
        expect(above).not.toHaveAttribute("id");
        expect(layerTransitionName(above)).toBe(context === "slide" ? "deck-layer-above" : "");
      } else expect(above).toBeNull();
      if (layers !== false && layers !== "above") {
        expect(below).toHaveTextContent("Below 2");
        expect(layerTransitionName(below)).toBe("");
      } else expect(below).toBeNull();
      expect(
        Array.from(root.children)
          .map((child) => child.getAttribute("data-deck-layer"))
          .filter(Boolean),
      ).toEqual([...(below ? ["below"] : []), "credit", ...(above ? ["above"] : [])]);
    }
    const inactive = container.querySelector<HTMLElement>(
      '[data-deck-slide="1"] [data-deck-layer="above"]',
    );
    expect(layerTransitionName(inactive)).toBe("");
    act(() => store.dispatch({ type: "go", slide: 1 }));
    expect(layerTransitionName(inactive)).toBe("deck-layer-above");
    expect(
      container
        .querySelector('[data-deck-slide="2"] [data-deck-layer="above"]')
        ?.getAttribute("style") ?? "",
    ).not.toContain("deck-layer-above");
  },
);
