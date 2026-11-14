import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, onTestFinished, vi } from "vitest";
import { makeSource, Status, setup } from "./deck.test-support";

function Broken(): never {
  throw new Error("Render failed");
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Count {count}
    </button>
  );
}

it("a slide loaded while mounted keeps local state across nearby navigation", async () => {
  const source = makeSource();
  setup("#/1", {
    ...source,
    slides: { ...source.slides, "slide-1": async () => ({ default: Counter }) },
  });
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Count 0" }));
  await user.click(document.body);
  await user.keyboard("{ArrowDown}");
  await screen.findByRole("heading", { name: "Title 2" });
  await user.keyboard("{ArrowUp}");
  expect(await screen.findByRole("button", { name: "Count 1" })).toBeVisible();
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

it("a neighbour whose loader never resolves does not block the current slide", async () => {
  const source = makeSource();
  setup("#/1", { ...source, slides: { ...source.slides, "slide-2": () => new Promise(() => {}) } });
  expect(await screen.findByRole("heading", { name: "Title 1" })).toBeVisible();
});

it("a rejected slide stays isolated and retries after it is mounted again", async () => {
  const source = makeSource();
  let attempts = 0;
  setup("#/1", {
    ...source,
    slides: {
      ...source.slides,
      "slide-2": async () => {
        attempts++;
        if (attempts === 1) throw new Error("Broken slide");
        return { default: Status };
      },
    },
  });
  const user = userEvent.setup();
  expect(await screen.findByRole("heading", { name: "Title 1" })).toBeVisible();
  await user.keyboard("{ArrowDown}");
  expect(
    await screen.findByText("Slide slide-2 failed to load. See the terminal or the error overlay."),
  ).toBeVisible();
  await user.keyboard("{End}");
  expect(await screen.findByRole("heading", { name: "Title 5" })).toBeVisible();
  await user.keyboard("{Home}{ArrowDown}");
  expect(await screen.findByRole("heading", { name: "Title 2" })).toBeVisible();
});

it("a throwing slide shows its id and leaves navigation working", async () => {
  const source = makeSource();
  setup("#/1", {
    ...source,
    slides: { ...source.slides, "slide-1": async () => ({ default: Broken }) },
  });
  expect(
    await screen.findByText("Slide slide-1 (slides/1.mdx) failed to render: Render failed"),
  ).toBeVisible();
  await userEvent.setup().keyboard("{End}");
  expect(await screen.findByRole("heading", { name: "Title 5" })).toBeVisible();
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

it("a failed idle prefetch is handled and the next mount tries again", async () => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const source = makeSource();
  let attempts = 0;
  setup("#/1", {
    ...source,
    slides: {
      ...source.slides,
      "slide-5": async () => {
        attempts++;
        if (attempts === 1) throw new Error("Prefetch failed");
        return { default: Status };
      },
    },
  });
  await act(async () => {
    await vi.runOnlyPendingTimersAsync();
  });
  expect(attempts).toBe(1);
  vi.useRealTimers();
  await userEvent.setup().keyboard("{End}");
  expect(await screen.findByRole("heading", { name: "Title 5" })).toBeVisible();
  expect(attempts).toBe(2);
});
