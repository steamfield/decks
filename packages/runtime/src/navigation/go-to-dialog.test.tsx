import { createMemoryHub } from "@react-decks/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { install, makeSource } from "../deck.test-support";
import { createDeckStore, Deck } from "../index";

function setup(hash = "#/2?clicks=2") {
  // jsdom does not implement the native dialog methods or Escape's cancel event.
  install(HTMLDialogElement.prototype, "showModal", function (this: HTMLDialogElement) {
    this.open = true;
  });
  install(HTMLDialogElement.prototype, "close", function (this: HTMLDialogElement) {
    this.open = false;
  });
  window.history.replaceState(null, "", `/${hash}`);
  const base = makeSource();
  const source = {
    ...base,
    slides: Object.fromEntries(
      base.manifest.slides.map(({ id, no }) => [
        id,
        async () => ({ default: () => <h1>Slide {no}</h1> }),
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

it.each(["#/overview/2?clicks=2", "#/print"])("g does not open a dialog in %s", async (hash) => {
  const user = setup(hash);
  await user.keyboard("g");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(window.location.hash).toBe(hash);
});

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

it("cancel keeps the position, restores deck keys and reopening clears the query", async () => {
  const user = setup();
  await user.keyboard("g");
  await user.type(screen.getByRole("searchbox", { name: "Slide" }), "Title 3");
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(window.location.hash).toBe("#/2?clicks=2");
  await user.keyboard("{ArrowRight}");
  expect(window.location.hash).toBe("#/2?clicks=3");
  await user.keyboard("g");
  expect(screen.getByRole("searchbox", { name: "Slide" })).toHaveValue("");
  expect(screen.getAllByRole("option")).toHaveLength(5);
});

it("Escape closes a populated search input without changing the position", async () => {
  const user = setup();
  await user.keyboard("g");
  await user.type(screen.getByRole("searchbox", { name: "Slide" }), "Title 3");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(window.location.hash).toBe("#/2?clicks=2");
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
