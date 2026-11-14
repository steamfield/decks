import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { install, setup } from "./deck.test-support";

it("fullscreen is ignored when disabled", async () => {
  const requests: string[] = [];
  install(document, "fullscreenEnabled", false);
  install(document.documentElement, "requestFullscreen", async () => {
    requests.push("enter");
  });
  setup();
  await userEvent.setup().keyboard("f");
  expect(requests).toEqual([]);
});

it.each([false, true])(
  "a refused fullscreen toggle is handled when already fullscreen is %s",
  async (fullscreen) => {
    const requests: string[] = [];
    install(document, "fullscreenEnabled", true);
    install(document, "fullscreenElement", fullscreen ? document.documentElement : null);
    const refuse = async () => {
      requests.push(fullscreen ? "exit" : "enter");
      throw new Error("Fullscreen refused by the browser");
    };
    install(document, "exitFullscreen", refuse);
    install(document.documentElement, "requestFullscreen", refuse);
    setup();
    await userEvent.setup().keyboard("f");
    expect(requests).toEqual([fullscreen ? "exit" : "enter"]);
  },
);

it("missing wake-lock and fullscreen APIs leave the deck usable", async () => {
  install(navigator, "wakeLock", undefined);
  install(document.documentElement, "requestFullscreen", undefined);
  setup();
  await userEvent.setup().keyboard("f{ArrowDown}");
  expect(window.location.hash).toBe("#/2");
});

it.each(["play", "presenter", "overview", "print"])(
  "f toggles document fullscreen in %s",
  async (view) => {
    install(document, "fullscreenEnabled", true);
    const events: string[] = [];
    let fullscreen: Element | null = null;
    const previous = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreen,
    });
    onTestFinished(() => {
      if (previous) Object.defineProperty(document, "fullscreenElement", previous);
      else Reflect.deleteProperty(document, "fullscreenElement");
    });
    install(document.documentElement, "requestFullscreen", async () => {
      events.push("enter");
      fullscreen = document.documentElement;
    });
    install(document, "exitFullscreen", async () => {
      events.push("exit");
      fullscreen = null;
    });
    setup(view === "play" ? "#/1" : `#/${view}`);
    await userEvent.setup().keyboard("ff");
    expect(events).toEqual(["enter", "exit"]);
  },
);
