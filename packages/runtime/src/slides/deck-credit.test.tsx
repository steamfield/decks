import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { expect, it, onTestFinished } from "vitest";
import { makeSource } from "../deck.test-support";
import { DeckContext } from "../hooks";
import { createDeckStore, type RenderContext, SlideHost } from "../index";
import { createSlideModules } from "../source";

async function renderSlides(credit?: ComponentType | false) {
  const source = { ...makeSource(), ...(credit === undefined ? {} : { layers: { credit } }) };
  window.history.replaceState(null, "", "/#/2");
  const store = createDeckStore(source.manifest);
  onTestFinished(() => store.destroy());
  const contexts: RenderContext[] = ["slide", "presenter", "preview", "overview", "print"];
  render(
    <DeckContext value={{ source, store, modules: createSlideModules(source) }}>
      {contexts.map((context) => (
        <SlideHost key={context} no={2} context={context} />
      ))}
    </DeckContext>,
  );
  await screen.findAllByText("Title 2");
  return contexts.length;
}

it("Every slide links to Decks in every context when the deck says nothing.", async () => {
  const slides = await renderSlides();
  const links = screen.getAllByRole("link", { name: "Created with Decks" });
  expect(links).toHaveLength(slides);
  for (const link of links) expect(link).toHaveAttribute("href", "https://decks.steamfield.io");
});

it("A deck that turns the credit off shows none.", async () => {
  await renderSlides(false);
  expect(screen.queryByRole("link", { name: "Created with Decks" })).toBeNull();
});

it("A deck's own credit replaces the built-in one.", async () => {
  const slides = await renderSlides(() => <p>Made by Ada</p>);
  expect(screen.getAllByText("Made by Ada")).toHaveLength(slides);
  expect(screen.queryByRole("link", { name: "Created with Decks" })).toBeNull();
});
