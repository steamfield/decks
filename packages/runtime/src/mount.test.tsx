import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";
import { makeSource } from "./deck.test-support";
import { mountDeck } from "./index";

beforeEach(() => window.history.replaceState(null, "", "/#/2?clicks=2"));
afterEach(() => window.history.replaceState(null, "", "/"));

it("mountDeck renders in deck-root and unmount removes the content and listeners", async () => {
  const root = document.createElement("div");
  root.id = "deck-root";
  document.body.append(root);
  let unmount = () => {};
  try {
    act(() => {
      unmount = mountDeck(makeSource());
    });
    expect(
      await screen.findByRole("status", { name: "Deck 2/5 click 2/3 view play print false" }),
    ).toBeVisible();
    const user = userEvent.setup();
    await user.keyboard("{ArrowRight}");
    expect(window.location.hash).toBe("#/2?clicks=3");
    act(unmount);
    expect(root).toBeEmptyDOMElement();
    await user.keyboard("{ArrowRight}");
    expect(window.location.hash).toBe("#/2?clicks=3");
    const changed = new Promise((resolve) =>
      window.addEventListener("hashchange", resolve, { once: true }),
    );
    await act(async () => {
      window.location.hash = "#/not-a-slide";
      await changed;
    });
    expect(window.location.hash).toBe("#/not-a-slide");
    expect(root).toBeEmptyDOMElement();
  } finally {
    act(unmount);
    root.remove();
  }
});

it("mountDeck accepts an explicit mount element", async () => {
  const root = document.createElement("main");
  document.body.append(root);
  let unmount = () => {};
  try {
    act(() => {
      unmount = mountDeck(makeSource(), root);
    });
    expect(await screen.findByRole("heading", { name: "Title 2" })).toBeVisible();
  } finally {
    act(unmount);
    root.remove();
  }
});

it("mountDeck names the missing mount element", () => {
  expect(() => mountDeck(makeSource())).toThrow("#deck-root");
});
