import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function FirstFailure(): never {
  throw new Error("First failure");
}

function LaterFailure(): never {
  throw new Error("Later failure");
}

function FailsOnClicks() {
  const { clicks } = useSlide();
  if (clicks === 0) return <FirstFailure />;
  if (clicks === 2) return <LaterFailure />;
  return <h1>Between failures</h1>;
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

it("does not commit a previous component stack during a later failure", async () => {
  const user = userEvent.setup();
  const base = makeSource();
  const source = {
    ...base,
    slides: { ...base.slides, "slide-2": async () => ({ default: FailsOnClicks }) },
  };
  window.history.replaceState(null, "", "/#/2");
  const store = createDeckStore(source.manifest);
  onTestFinished(() => {
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  const committed: string[] = [];
  render(<Deck source={source} store={store} />, {
    onCaughtError: () => {
      committed.push(document.body.textContent ?? "");
    },
  });
  await screen.findByText(/failed to render: First failure/);
  await user.keyboard("{ArrowRight}");
  await screen.findByRole("heading", { name: "Between failures" });
  await user.keyboard("{ArrowRight}");
  await screen.findByText(/failed to render: Later failure/);
  const later = committed.filter((text) => text.includes("failed to render: Later failure"));
  expect(later.length).toBeGreaterThan(0);
  expect(later.join("\n")).not.toContain("FirstFailure");
});
