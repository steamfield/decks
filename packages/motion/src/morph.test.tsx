import { act, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Morph, Step } from "./index";
import { setupMotion } from "./motion.test-support";

it.each(["card", "_card-2", "Card_1"])(
  "Morph accepts the CSS identifier %s on the active slide",
  async (name) => {
    const { store } = await setupMotion(() => (
      <Morph name={name} as="h2">
        Moving card
      </Morph>
    ));
    const card = screen.getByRole("heading", { name: "Moving card" });
    expect(card.style.viewTransitionName).toBe(name);
    act(() => store.dispatch({ type: "nextSlide" }));
    expect(card.style.viewTransitionName).toBe("");
    act(() => store.dispatch({ type: "prevSlide" }));
    expect(card.style.viewTransitionName).toBe(name);
  },
);

it.each([
  "root",
  "deck-layer-above",
  "DECK-LAYER-ABOVE",
  "none",
  "",
  "1card",
  "has space",
  "--card",
  "a.b",
  "None",
  "ROOT",
  "Auto",
  "Match-element",
  "INITIAL",
  "InHerIt",
  "Unset",
  "revert",
  "REVERT-LAYER",
  "Default",
])("Morph rejects %j naming it", async (name) => {
  const { errors } = await setupMotion(() => <Morph name={name}>Card</Morph>, { error: true });
  expect(errors).toHaveLength(1);
  expect(errors[0]).toBeInstanceOf(Error);
  expect(String(errors[0])).toContain(`Invalid Morph name ${JSON.stringify(name)}`);
});

it.each(["presenter", "preview", "overview", "print"] as const)(
  "Morph has no name in %s context",
  async (context) => {
    await setupMotion(
      () => (
        <Morph name="card" as="h2">
          Moving card
        </Morph>
      ),
      { context },
    );
    expect(screen.getByRole("heading", { name: "Moving card" }).style.viewTransitionName).toBe("");
  },
);

it("an active Morph carries its name inside a hidden step even with instant motion", async () => {
  // A click round trip re-renders the Morph after instant motion is in effect.
  const view = await setupMotion(() => (
    <Step at={1}>
      <Morph name="hidden-card" as="h2">
        Hidden card
      </Morph>
    </Step>
  ));
  document.documentElement.setAttribute("data-deck-motion", "instant");
  await view.next();
  await view.previous();
  const card = screen.getByRole("heading", { name: "Hidden card", hidden: true });
  expect(card.style.viewTransitionName).toBe("hidden-card");
  expect(card.closest("[data-step-state]")).toHaveAttribute("data-step-state", "before");
});
