import { createMemoryHub } from "@react-decks/core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { makeSource } from "../deck.test-support";
import { createDeckStore, Deck, Toc } from "../index";

it("the contents list links every slide's title or number and marks the current slide", async () => {
  window.history.replaceState(null, "", "/#/2?clicks=2");
  const base = makeSource();
  const source = {
    ...base,
    manifest: {
      ...base.manifest,
      slides: base.manifest.slides.map((meta) => (meta.no === 5 ? { ...meta, title: "" } : meta)),
    },
    slides: Object.fromEntries(
      base.manifest.slides.map(({ id }) => [id, async () => ({ default: Toc })]),
    ),
  };
  const store = createDeckStore(source.manifest, { transport: createMemoryHub().connect() });
  const result = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    result.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  const list = await screen.findByRole("list");
  const items = within(list).getAllByRole("listitem");
  expect(items.map((item) => item.textContent)).toEqual([
    "Title 1",
    "Title 2",
    "Title 3",
    "Title 4",
    "5",
  ]);
  for (const [index, item] of items.entries()) {
    expect(within(item).getByRole("link")).toHaveAttribute("href", `#/${index + 1}`);
    if (index === 1) expect(item).toHaveAttribute("aria-current", "page");
    else expect(item).not.toHaveAttribute("aria-current");
  }
  await userEvent.setup().click(within(list).getByRole("link", { name: "Title 3" }));
  expect(window.location.hash).toBe("#/3");
  const nextItems = within(await screen.findByRole("list")).getAllByRole("listitem");
  expect(nextItems[2]).toHaveAttribute("aria-current", "page");
  expect(nextItems[1]).not.toHaveAttribute("aria-current");
});
