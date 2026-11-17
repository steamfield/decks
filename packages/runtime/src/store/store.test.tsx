import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { setup } from "../deck.test-support";

it.each(["overview", "print"])(
  "dispatch in %s leaves the position and history unchanged",
  async (view) => {
    const { store } = setup(`#/${view}`);
    const notifications: string[] = [];
    store.subscribe(() => notifications.push(window.location.hash));
    const history = window.history.length;
    act(() => store.dispatch({ type: "nextSlide" }));
    expect(window.location.hash).toBe(view === "overview" ? "#/overview/1" : "#/print");
    expect(window.history.length).toBe(history);
    expect(notifications).toEqual([]);
    expect(await screen.findByRole("heading", { name: "Title 1" })).toBeVisible();
  },
);

it("creation parses search flags and clamps and canonicalizes the hash", async () => {
  const { store } = setup("?embedded&decks-bridge=1#/99?clicks=88");
  expect(store.getState()).toEqual({
    syncStamp: { seq: 0, started: expect.any(Number), origin: expect.any(String) },
    nav: { slide: 5, click: 0 },
    view: "play",
    embedded: true,
    bridge: true,
  });
  expect(window.location.hash).toBe("#/5");
  expect(window.location.search).toBe("?embedded&decks-bridge=1");
  expect(await screen.findByRole("heading", { name: "Title 5" })).toBeVisible();
});

it.each(["#/abc", "#/-1", "#/5/extra", "#/"])(
  "creation rewrites malformed hash %s",
  async (hash) => {
    setup(hash);
    expect(window.location.hash).toBe("#/1");
    expect(await screen.findByRole("heading", { name: "Title 1" })).toBeVisible();
  },
);

it("an unchanged dispatch adds no history and notifies nobody", async () => {
  const user = userEvent.setup();
  const { store } = setup();
  const notifications: string[] = [];
  store.subscribe(() => notifications.push(window.location.hash));
  const length = window.history.length;
  await user.click(await screen.findByRole("button", { name: "Previous click" }));
  expect(notifications).toEqual([]);
  expect(window.history.length).toBe(length);
  expect(window.location.hash).toBe("#/1");
});

it("a click dispatch replaces history and notifies once", async () => {
  const user = userEvent.setup();
  const { store } = setup("#/2");
  const notifications: string[] = [];
  store.subscribe(() => notifications.push(window.location.hash));
  const length = window.history.length;
  await user.click(await screen.findByRole("button", { name: "Next click" }));
  expect(window.history.length).toBe(length);
  expect(notifications).toEqual(["#/2?clicks=1"]);
  expect(
    screen.getByRole("status", { name: "Deck 2/5 click 1/3 view play print false" }),
  ).toBeVisible();
});

it("a slide dispatch pushes history and notifies once", async () => {
  const user = userEvent.setup();
  const { store } = setup();
  const notifications: string[] = [];
  store.subscribe(() => notifications.push(window.location.hash));
  const length = window.history.length;
  await user.click(await screen.findByRole("button", { name: "Next slide" }));
  expect(window.history.length).toBe(length + 1);
  expect(notifications).toEqual(["#/2"]);
  expect(await screen.findByRole("heading", { name: "Title 2" })).toBeVisible();
});

it("hand-edited hashes and browser back and forward move the rendered deck", async () => {
  const user = userEvent.setup();
  const { store } = setup();
  const notifications: string[] = [];
  store.subscribe(() => notifications.push(window.location.hash));
  await act(async () => {
    window.location.hash = "#/2?clicks=2";
  });
  expect(
    await screen.findByRole("status", { name: "Deck 2/5 click 2/3 view play print false" }),
  ).toBeVisible();
  await user.keyboard("{ArrowDown}");
  expect(window.location.hash).toBe("#/3");
  await act(async () => {
    window.history.back();
  });
  await waitFor(() => expect(window.location.hash).toBe("#/2?clicks=2"));
  expect(
    await screen.findByRole("status", { name: "Deck 2/5 click 2/3 view play print false" }),
  ).toBeVisible();
  await act(async () => {
    window.history.forward();
  });
  await waitFor(() => expect(window.location.hash).toBe("#/3"));
  expect(await screen.findByRole("heading", { name: "Title 3" })).toBeVisible();
  expect(notifications).toEqual(["#/2?clicks=2", "#/3", "#/2?clicks=2", "#/3"]);
});

it("URL events clamp and rewrite invalid positions without duplicate notifications", async () => {
  const { store } = setup("#/2");
  const notifications: string[] = [];
  store.subscribe(() => notifications.push(window.location.hash));
  await act(async () => {
    window.location.hash = "#/2?clicks=99";
  });
  expect(
    await screen.findByRole("status", { name: "Deck 2/5 click 3/3 view play print false" }),
  ).toBeVisible();
  expect(window.location.hash).toBe("#/2?clicks=3");
  await act(async () => {
    window.location.hash = "#/2?clicks=3&ignored=yes";
  });
  await waitFor(() => expect(window.location.hash).toBe("#/2?clicks=3"));
  expect(notifications).toEqual(["#/2?clicks=3"]);
  await act(async () => {
    window.location.hash = "#/wrong";
  });
  expect(await screen.findByRole("heading", { name: "Title 1" })).toBeVisible();
  expect(window.location.hash).toBe("#/1");
  expect(notifications).toEqual(["#/2?clicks=3", "#/1"]);
});

it("every hash write preserves the search string", async () => {
  const user = userEvent.setup();
  setup("?embedded&unrelated=value#/2");
  await user.click(await screen.findByRole("button", { name: "Next click" }));
  expect(window.location.search).toBe("?embedded&unrelated=value");
  await user.keyboard("{ArrowDown}");
  expect(window.location.search).toBe("?embedded&unrelated=value");
  await act(async () => {
    window.location.hash = "#/999";
  });
  await waitFor(() => expect(window.location.hash).toBe("#/5"));
  expect(window.location.search).toBe("?embedded&unrelated=value");
});

it("destroy removes URL listeners and unsubscribe stops notifications", async () => {
  const { store } = setup();
  const notifications: number[] = [];
  const unsubscribe = store.subscribe(() => notifications.push(store.getState().nav.slide));
  unsubscribe();
  act(() => store.dispatch({ type: "nextSlide" }));
  expect(notifications).toEqual([]);
  store.subscribe(() => notifications.push(store.getState().nav.slide));
  store.destroy();
  const changed = new Promise((resolve) =>
    window.addEventListener("hashchange", resolve, { once: true }),
  );
  await act(async () => {
    window.location.hash = "#/4";
    await changed;
  });
  expect(window.location.hash).toBe("#/4");
  expect(store.getState().nav.slide).toBe(2);
  expect(notifications).toEqual([]);
});
