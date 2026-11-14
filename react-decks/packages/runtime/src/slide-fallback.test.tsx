import { act, render, screen } from "@testing-library/react";
import { expect, it, onTestFinished } from "vitest";
import { makeSource } from "./deck.test-support";
import { createDeckStore, Deck, useSlide } from "./index";

function BrokenAtZero() {
  if (useSlide().clicks === 0) throw new Error("Choose the next click");
  return <h1>Recovered at click one</h1>;
}

function Broken(): never {
  throw new Error("Old component");
}

it("resets a rendering failure when the click changes", async () => {
  const base = makeSource();
  const source = {
    ...base,
    slides: { ...base.slides, "slide-2": async () => ({ default: BrokenAtZero }) },
  };
  window.history.replaceState(null, "", "/#/2");
  const store = createDeckStore(source.manifest);
  onTestFinished(() => {
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  render(<Deck source={source} store={store} />, { onCaughtError: () => {} });
  expect(
    await screen.findByText("Slide slide-2 (slides/2.mdx) failed to render: Choose the next click"),
  ).toBeVisible();
  act(() => store.dispatch({ type: "next" }));
  expect(await screen.findByRole("heading", { name: "Recovered at click one" })).toBeVisible();
});

it("resets a rendering failure when its source module changes", async () => {
  const base = makeSource();
  const source = {
    ...base,
    slides: { ...base.slides, "slide-1": async () => ({ default: Broken }) },
  };
  window.history.replaceState(null, "", "/#/1");
  const store = createDeckStore(source.manifest);
  onTestFinished(() => {
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  const view = render(<Deck source={source} store={store} />, { onCaughtError: () => {} });
  expect(
    await screen.findByText("Slide slide-1 (slides/1.mdx) failed to render: Old component"),
  ).toBeVisible();
  view.rerender(
    <Deck
      source={{
        ...base,
        slides: {
          ...base.slides,
          "slide-1": async () => ({ default: () => <h1>New component</h1> }),
        },
      }}
      store={store}
    />,
  );
  expect(await screen.findByRole("heading", { name: "New component" })).toBeVisible();
});
