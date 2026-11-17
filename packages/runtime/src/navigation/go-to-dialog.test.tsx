import { createMemoryHub } from "@react-decks/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { install, makeSource } from "../deck.test-support";
import { createDeckStore, Deck } from "../index";

function setup(hash = "#/2?clicks=2", renders?: number[], total = 5) {
  // jsdom does not implement the native dialog methods or Escape's cancel event.
  install(HTMLDialogElement.prototype, "showModal", function (this: HTMLDialogElement) {
    this.open = true;
  });
  install(HTMLDialogElement.prototype, "close", function (this: HTMLDialogElement) {
    this.open = false;
  });
  window.history.replaceState(null, "", `/${hash}`);
  const original = makeSource();
  const extra = Array.from({ length: Math.max(0, total - 5) }, (_, index) => ({
    no: index + 6,
    id: `slide-${index + 6}`,
    file: `slides/${index + 6}.mdx`,
    title: `Title ${index + 6}`,
    clicks: 0,
  }));
  const base = {
    ...original,
    manifest: { ...original.manifest, slides: [...original.manifest.slides, ...extra] },
  };
  const source = {
    ...base,
    slides: Object.fromEntries(
      base.manifest.slides.map(({ id, no }) => [
        id,
        async () => ({
          default: () => {
            renders?.push(no);
            return <h1>Slide {no}</h1>;
          },
        }),
      ]),
    ),
    manifest: {
      ...base.manifest,
      slides: base.manifest.slides.map((meta) => (meta.no === 5 ? { ...meta, title: "" } : meta)),
    },
  };
  const store = createDeckStore(source.manifest, { transport: createMemoryHub().connect() });
  const result = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    result.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  return userEvent.setup();
}

it("opening, filtering and closing go-to leaves the mounted slides untouched", async () => {
  const renders: number[] = [];
  const user = setup("#/2?clicks=2", renders);
  for (const no of [1, 2, 3])
    await screen.findByRole("heading", { name: `Slide ${no}`, hidden: true });
  const before = [...renders];
  for (const query of ["3", "Title", "missing"]) {
    await user.keyboard("g");
    await user.type(screen.getByRole("searchbox", { name: "Slide" }), query);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(renders).toEqual(before);
  }
  await user.keyboard("{ArrowRight}");
  expect(window.location.hash).toBe("#/2?clicks=3");
});

it.each(["#/2?clicks=2", "#/presenter/2?clicks=2"])(
  "g opens a focused modal with every slide in %s",
  async (hash) => {
    const user = setup(hash);
    await user.keyboard("g");
    const dialog = screen.getByRole("dialog", { name: "Go to slide" });
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByRole("searchbox", { name: "Slide" })).toHaveFocus();
    expect(
      within(dialog)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["1  Title 1", "2  Title 2", "3  Title 3", "4  Title 4", "5"]);
    expect(within(dialog).getByRole("option", { selected: true })).toHaveTextContent("1 Title 1");
  },
);

it.each(["#/overview/2?clicks=2", "#/print", "?embedded#/2"])(
  "g does not open a dialog in %s",
  async (hash) => {
    const user = setup(hash);
    await user.keyboard("g");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.hash).toBe(hash.slice(hash.indexOf("#")));
  },
);

it("a number matches only that slide and Enter goes there at click zero", async () => {
  const user = setup();
  await user.keyboard("g");
  await user.type(screen.getByRole("searchbox", { name: "Slide" }), "3");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(screen.getByRole("option", { selected: true })).toHaveTextContent("3 Title 3");
  await user.keyboard("{Enter}");
  expect(window.location.hash).toBe("#/3");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("title filtering ignores case and clicking a match goes there at click zero", async () => {
  const user = setup();
  await user.keyboard("g");
  await user.type(screen.getByRole("searchbox", { name: "Slide" }), "tItLe 2");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  await user.click(screen.getByRole("option", { name: "2 Title 2" }));
  expect(window.location.hash).toBe("#/2");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("arrow selection starts at the first match and Enter chooses the selected slide", async () => {
  const user = setup();
  await user.keyboard("g{ArrowDown}{ArrowDown}{ArrowUp}");
  expect(screen.getByRole("option", { selected: true })).toHaveTextContent("2 Title 2");
  await user.keyboard("{Enter}");
  expect(window.location.hash).toBe("#/2");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it.each(["Escape", "cancel"])(
  "%s keeps the position, restores deck keys and reopening clears the query",
  async (how) => {
    const user = setup();
    await user.keyboard("g");
    await user.type(screen.getByRole("searchbox", { name: "Slide" }), "Title 3");
    if (how === "Escape") await user.keyboard("{Escape}");
    else fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/2?clicks=2");
    await user.keyboard("{ArrowRight}");
    expect(window.location.hash).toBe("#/2?clicks=3");
    await user.keyboard("g");
    expect(screen.getByRole("searchbox", { name: "Slide" })).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(5);
  },
);

it("a text query matching several slides lists all of them in order", async () => {
  const user = setup();
  await user.keyboard("g");
  await user.type(screen.getByRole("searchbox", { name: "Slide" }), "title");
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "1  Title 1",
    "2  Title 2",
    "3  Title 3",
    "4  Title 4",
  ]);
  expect(screen.getByRole("option", { selected: true })).toHaveTextContent("1 Title 1");
});

it("a number query matches that slide number only, not slides whose number contains it", async () => {
  const user = setup("#/2?clicks=2", undefined, 12);
  await user.keyboard("g");
  await user.type(screen.getByRole("searchbox", { name: "Slide" }), "1");
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["1  Title 1"]);
  await user.type(screen.getByRole("searchbox", { name: "Slide" }), "2");
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "12  Title 12",
  ]);
});

it("deck shortcuts do not navigate from the input or a focused option", async () => {
  const user = setup();
  await user.keyboard("g{ArrowRight}{ArrowLeft}{PageDown}{Home}o");
  expect(window.location.hash).toBe("#/2?clicks=2");
  await user.clear(screen.getByRole("searchbox", { name: "Slide" }));
  screen.getByRole("option", { selected: true }).focus();
  await user.keyboard("{ArrowRight}{End}");
  expect(window.location.hash).toBe("#/2?clicks=2");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(window.location.hash).toBe("#/2");
});

it("a query with no matches has no selection and Enter leaves the dialog open", async () => {
  const user = setup();
  await user.keyboard("g");
  await user.type(screen.getByRole("searchbox", { name: "Slide" }), "missing title");
  await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");
  expect(screen.queryByRole("option")).not.toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(window.location.hash).toBe("#/2?clicks=2");
  await user.clear(screen.getByRole("searchbox", { name: "Slide" }));
  expect(screen.getByRole("option", { selected: true })).toHaveTextContent("1 Title 1");
});

it("IME candidate keys do not move the selection, confirm or dismiss the dialog", async () => {
  const user = setup();
  await user.keyboard("g");
  const input = screen.getByRole("searchbox", { name: "Slide" });
  fireEvent.compositionStart(input);
  for (const key of ["ArrowDown", "Enter", "Escape"]) {
    fireEvent.keyDown(input, { key, isComposing: true });
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent("1 Title 1");
    expect(window.location.hash).toBe("#/2?clicks=2");
  }
  fireEvent.compositionEnd(input);
  await user.keyboard("{ArrowDown}{Enter}");
  expect(window.location.hash).toBe("#/2");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
