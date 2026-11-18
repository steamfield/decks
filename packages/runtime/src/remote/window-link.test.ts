import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { install, makeSource } from "../deck.test-support";
import { mountDeck } from "../index";
import { recordingLink } from "./remote.test-support";

async function mount(url = "/#/2?clicks=1", remote = recordingLink()) {
  history.replaceState(null, "", url);
  let focused = true;
  install(document, "hasFocus", () => focused);
  const root = document.createElement("div");
  document.body.append(root);
  let stop: (() => void) | undefined;
  function unmount() {
    act(() => stop?.());
    stop = undefined;
    root.remove();
  }
  onTestFinished(() => {
    unmount();
    history.replaceState(null, "", "/");
  });
  await act(async () => {
    stop = mountDeck(makeSource(), root, { remote: remote.link });
  });
  return {
    ...remote,
    unmount,
    focus(value: boolean) {
      focused = value;
      window.dispatchEvent(new Event(value ? "focus" : "blur"));
    },
  };
}

const initial = { slide: 2, click: 1, view: "play", focused: true };

it("a mounted play window reports its slide, click, view and focus", async () => {
  expect((await mount()).reports).toEqual([initial]);
});

it("a window reports again when the slide or click changes, and when it gains or loses focus", async () => {
  const { reports, focus } = await mount();
  const user = userEvent.setup();
  await user.keyboard("{ArrowRight}{ArrowDown}");
  focus(false);
  focus(true);
  expect(reports).toEqual([
    initial,
    { ...initial, click: 2 },
    { ...initial, slide: 3, click: 0 },
    { ...initial, slide: 3, click: 0, focused: false },
    { ...initial, slide: 3, click: 0 },
  ]);
});

it("a window reports the overview view when the overview opens", async () => {
  const { reports, emit } = await mount();
  await userEvent.setup().keyboard("o");
  emit({ type: "next" });
  expect(location.hash).toBe("#/overview/2?clicks=1");
  expect(reports).toEqual([initial, { ...initial, view: "overview" }]);
});

it("a next intent advances one click exactly as the arrow key does", async () => {
  const { emit } = await mount();
  await userEvent.setup().keyboard("{ArrowRight}");
  expect(location.hash).toBe("#/2?clicks=2");
  emit({ type: "next" });
  expect(location.hash).toBe("#/2?clicks=3");
});

it("a prev intent goes back one click", async () => {
  const { emit } = await mount();
  emit({ type: "prev" });
  expect(location.hash).toBe("#/2");
});

it("a go intent moves to the slide at click 0", async () => {
  const { emit } = await mount();
  emit({ type: "go", slide: 4 });
  expect(location.hash).toBe("#/4");
});

it("an embedded mount reports nothing and ignores intents", async () => {
  const remote = await mount("/?embedded#/2?clicks=1");
  remote.emit({ type: "next" });
  expect(location.hash).toBe("#/2?clicks=1");
  expect(remote.reports).toEqual([]);
});

it("a print mount reports nothing and ignores intents", async () => {
  const remote = await mount("/#/print");
  remote.emit({ type: "next" });
  expect(location.hash).toBe("#/print");
  expect(remote.reports).toEqual([]);
});

it("unmounting stops applying intents", async () => {
  const { emit, unmount, reports, focus } = await mount();
  emit({ type: "next" });
  expect(location.hash).toBe("#/2?clicks=2");
  unmount();
  emit({ type: "next" });
  focus(false);
  expect(location.hash).toBe("#/2?clicks=2");
  expect(reports).toEqual([initial, { ...initial, click: 2 }]);
});

it("a bridge mount stays independent of the relay", async () => {
  const page = await mount("/?decks-bridge#/2?clicks=1");
  page.emit({ type: "next" });
  expect(location.hash).toBe("#/2?clicks=1");
  expect(page.reports).toEqual([]);
});

it("returning from print reports play even at the previous position", async () => {
  const page = await mount("/#/1");
  for (const hash of ["#/print", "#/1"]) {
    await act(async () => {
      const changed = new Promise((resolve) =>
        window.addEventListener("hashchange", resolve, { once: true }),
      );
      location.hash = hash;
      await changed;
    });
  }
  const play = { ...initial, slide: 1, click: 0 };
  expect(page.reports).toEqual([play, play]);
});
