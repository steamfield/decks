import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished, vi } from "vitest";
import { makeSource, Status } from "./deck.test-support";
import { createDeckStore, Deck } from "./index";

function setup(hash = "#/1", source = makeSource()) {
  window.history.replaceState(null, "", `/${hash}`);
  const store = createDeckStore(source.manifest);
  onTestFinished(() => {
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  return { ...render(<Deck source={source} store={store} />), store, source };
}

function EditingBoundaries() {
  return (
    <article contentEditable suppressContentEditableWarning>
      <button type="button" contentEditable={false}>
        Noneditable child
      </button>
    </article>
  );
}

it("a noneditable child inside an editing boundary allows deck navigation", async () => {
  const source = makeSource();
  setup("#/2?clicks=1", {
    ...source,
    slides: { ...source.slides, "slide-2": async () => ({ default: EditingBoundaries }) },
  });
  const user = userEvent.setup();
  const child = await screen.findByRole("button", { name: "Noneditable child" });
  await user.click(child);
  expect(child).toHaveFocus();
  await user.keyboard("{ArrowRight}");
  expect(window.location.hash).toBe("#/2?clicks=2");
});

it.each([
  ["{ArrowRight}", "#/2?clicks=2"],
  [" ", "#/2?clicks=2"],
  ["{PageDown}", "#/2?clicks=2"],
  ["{ArrowLeft}", "#/2"],
  ["{Shift>} {/Shift}", "#/2"],
  ["{PageUp}", "#/2"],
  ["{ArrowDown}", "#/3"],
  ["{ArrowUp}", "#/1"],
  ["{Home}", "#/1"],
  ["{End}", "#/5"],
])("key %s navigates to %s", async (key, hash) => {
  const user = userEvent.setup();
  setup("#/2?clicks=1");
  await screen.findByRole("heading", { name: "Title 2" });
  await user.keyboard(key);
  expect(window.location.hash).toBe(hash);
});

it.each(["Input", "Textarea", "Select", "Editable"])(
  "keys are ignored with focus in %s",
  async (label) => {
    const user = userEvent.setup();
    setup("#/2?clicks=1");
    const control = await screen.findByRole(
      label === "Select" ? "combobox" : label === "Editable" ? "article" : "textbox",
      { name: label },
    );
    await user.click(control);
    for (const key of [
      "{ArrowRight}",
      " ",
      "{PageDown}",
      "{ArrowLeft}",
      "{Shift>} {/Shift}",
      "{PageUp}",
      "{ArrowDown}",
      "{ArrowUp}",
      "{Home}",
      "{End}",
    ]) {
      await user.keyboard(key);
      expect(window.location.hash).toBe("#/2?clicks=1");
    }
  },
);

it.each([
  ["#/1", [1, 2], 1],
  ["#/3", [2, 3, 4], 3],
  ["#/5", [4, 5], 5],
])(
  "play at %s mounts exactly its neighbors with only the current slide active",
  async (hash, numbers, active) => {
    const { container } = setup(hash);
    await screen.findByRole("heading", { name: `Title ${active}` });
    const roots = Array.from(container.querySelectorAll("[data-deck-slide]"));
    expect(roots.map((root) => Number(root.getAttribute("data-deck-slide")))).toEqual(numbers);
    for (const root of roots) {
      expect(root).toHaveAttribute("data-deck-context", "slide");
      if (Number(root.getAttribute("data-deck-slide")) === active) {
        expect(root).toHaveAttribute("data-deck-active");
        expect(root).not.toHaveAttribute("hidden");
      } else {
        expect(root).not.toHaveAttribute("data-deck-active");
        expect(root).toHaveAttribute("hidden");
      }
    }
  },
);

it("a slide stays empty until its loader resolves", async () => {
  const source = makeSource();
  let resolve: ((module: { default: typeof Status }) => void) | undefined;
  const promise = new Promise<{ default: typeof Status }>((done) => {
    resolve = done;
  });
  const { container } = setup("#/1", {
    ...source,
    slides: { ...source.slides, "slide-1": () => promise },
  });
  expect(container.querySelector('[data-deck-slide="1"]')).toBeEmptyDOMElement();
  if (!resolve) throw new Error("Missing test loader resolver");
  await act(async () => {
    resolve?.({ default: Status });
  });
  expect(
    await screen.findByRole("heading", { name: source.manifest.slides[0]?.title }),
  ).toBeVisible();
});

it("idle prefetch requests every loader once without mounting distant slides", async () => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const source = makeSource();
  const requested: string[] = [];
  const slides = Object.fromEntries(
    source.manifest.slides.map(({ id }) => [
      id,
      async () => {
        requested.push(id);
        return { default: Status };
      },
    ]),
  );
  const { container } = setup("#/1", { ...source, slides });
  expect(requested.toSorted()).toEqual(
    source.manifest.slides
      .slice(0, 2)
      .map(({ id }) => id)
      .toSorted(),
  );
  await act(async () => {
    await vi.runOnlyPendingTimersAsync();
  });
  expect(requested.toSorted()).toEqual(source.manifest.slides.map(({ id }) => id).toSorted());
  expect(container.querySelector('[data-deck-slide="5"]')).toBeNull();
  vi.useRealTimers();
  const user = userEvent.setup();
  await user.keyboard("{End}{Home}{End}");
  await screen.findByRole("heading", { name: "Title 5" });
  expect(requested.toSorted()).toEqual(source.manifest.slides.map(({ id }) => id).toSorted());
});
