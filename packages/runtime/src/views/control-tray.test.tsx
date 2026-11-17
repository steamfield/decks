import { syncChannelId } from "@react-decks/core";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { stepTextScale } from "../canvas/text-scale";
import { install, makeSource, setup } from "../deck.test-support";

function tray() {
  return within(screen.getByRole("toolbar", { name: "Deck controls" }));
}

it("Previous is disabled only on the first frame and otherwise steps back a click or slide", async () => {
  setup();
  const user = userEvent.setup();
  const previous = tray().getByRole("button", { name: "Previous" });
  expect(previous).toBeDisabled();
  await user.keyboard("{ArrowDown}{ArrowRight}");
  expect(previous).toBeEnabled();
  await user.click(previous);
  expect(window.location.hash).toBe("#/2");
  await user.click(previous);
  expect(window.location.hash).toBe("#/1");
  expect(previous).toBeDisabled();
});

it("Next advances clicks and slides and is disabled only on the last frame", async () => {
  const original = makeSource();
  const source = {
    ...original,
    manifest: {
      ...original.manifest,
      slides: original.manifest.slides.map((slide) => ({
        ...slide,
        clicks: slide.no === 5 ? 1 : slide.clicks,
      })),
    },
  };
  setup("#/4", source);
  const user = userEvent.setup();
  const next = tray().getByRole("button", { name: "Next" });
  await user.click(next);
  expect(window.location.hash).toBe("#/4?clicks=1");
  await user.click(next);
  expect(window.location.hash).toBe("#/5");
  expect(next).toBeEnabled();
  await user.click(next);
  expect(window.location.hash).toBe("#/5?clicks=1");
  expect(next).toBeDisabled();
});

it("the Go to slide button displays the current slide and total", async () => {
  setup("#/2?clicks=1");
  expect(tray().getByRole("button", { name: "Go to slide" })).toHaveTextContent("2 / 5");
  await userEvent.setup().keyboard("{ArrowDown}");
  expect(tray().getByRole("button", { name: "Go to slide" })).toHaveTextContent("3 / 5");
});

it("Overview opens at the talk position and Escape returns to play with the tray", async () => {
  setup("#/2?clicks=1");
  const user = userEvent.setup();
  await user.click(tray().getByRole("button", { name: "Overview" }));
  expect(window.location.hash).toBe("#/overview/2?clicks=1");
  expect(screen.queryByRole("toolbar", { name: "Deck controls" })).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(window.location.hash).toBe("#/2?clicks=1");
  expect(screen.getByRole("toolbar", { name: "Deck controls" })).toBeInTheDocument();
});

it("Open presenter opens the current frame and then focuses the same window without navigating it", async () => {
  const events: string[] = [];
  const popup = { location: { href: "about:blank" }, focus: () => events.push("focus") };
  install(window, "open", (url: string, name: string, features: string) => {
    events.push(`${url}|${name}|${features}`);
    return popup;
  });
  setup("?custom=kept#/2?clicks=2");
  const user = userEvent.setup();
  const presenter = tray().getByRole("button", { name: "Open presenter" });
  await user.click(presenter);
  expect(popup.location.href).toBe(`${window.location.origin}/?custom=kept#/presenter/2?clicks=2`);
  popup.location.href = `${window.location.origin}/?custom=kept#/overview/3`;
  await user.click(presenter);
  expect(popup.location.href).toBe(`${window.location.origin}/?custom=kept#/overview/3`);
  const opened = `|react-decks-presenter:${syncChannelId("fixture", "/")}|popup,width=1280,height=800`;
  expect(events).toEqual([opened, "focus", opened, "focus"]);
});

it("a blocked presenter popup leaves the deck usable", async () => {
  const opened: string[] = [];
  install(window, "open", (url: string) => {
    opened.push(url);
    return null;
  });
  setup("#/2");
  const user = userEvent.setup();
  await user.click(tray().getByRole("button", { name: "Open presenter" }));
  await user.click(tray().getByRole("button", { name: "Next" }));
  expect(opened).toEqual([""]);
  expect(window.location.hash).toBe("#/2?clicks=1");
});

it("Fullscreen is absent when the browser disables it", () => {
  install(document, "fullscreenEnabled", false);
  setup();
  expect(tray().queryByRole("button", { name: /fullscreen/ })).not.toBeInTheDocument();
});

it("mounting play while already fullscreen offers Exit fullscreen", async () => {
  install(document, "fullscreenEnabled", true);
  install(document, "fullscreenElement", document.documentElement);
  setup("#/overview/2");
  await userEvent.setup().keyboard("{Escape}");
  expect(tray().getByRole("button", { name: "Exit fullscreen" })).toBeInTheDocument();
  expect(tray().queryByRole("button", { name: "Enter fullscreen" })).not.toBeInTheDocument();
});

it("Fullscreen enters and exits document fullscreen and follows external fullscreen changes", async () => {
  install(document, "fullscreenEnabled", true);
  install(document, "fullscreenElement", null);
  const events: string[] = [];
  function change(element: Element | null) {
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: element });
    document.dispatchEvent(new Event("fullscreenchange"));
  }
  install(document.documentElement, "requestFullscreen", async () => {
    events.push("enter");
    change(document.documentElement);
  });
  install(document, "exitFullscreen", async () => {
    events.push("exit");
    change(null);
  });
  setup();
  const user = userEvent.setup();
  await user.click(tray().getByRole("button", { name: "Enter fullscreen" }));
  await user.click(tray().getByRole("button", { name: "Exit fullscreen" }));
  expect(events).toEqual(["enter", "exit"]);
  expect(tray().getByRole("button", { name: "Enter fullscreen" })).toBeInTheDocument();
  act(() => change(document.documentElement));
  expect(tray().getByRole("button", { name: "Exit fullscreen" })).toBeInTheDocument();
  act(() => change(null));
  expect(tray().getByRole("button", { name: "Enter fullscreen" })).toBeInTheDocument();
});

it.each([false, true])(
  "a refused fullscreen request leaves its label unchanged (fullscreen %s)",
  async (fullscreen) => {
    install(document, "fullscreenEnabled", true);
    install(document, "fullscreenElement", fullscreen ? document.documentElement : null);
    const refused: string[] = [];
    const refuse = async () => {
      refused.push("refused");
      throw new Error("Fullscreen refused by the browser");
    };
    install(document, "exitFullscreen", refuse);
    install(document.documentElement, "requestFullscreen", refuse);
    setup();
    const label = fullscreen ? "Exit fullscreen" : "Enter fullscreen";
    await userEvent.setup().click(tray().getByRole("button", { name: label }));
    expect(refused).toEqual(["refused"]);
    expect(tray().getByRole("button", { name: label })).toBeInTheDocument();
  },
);

it("Smaller text and Larger text change the slide text scale", async () => {
  stepTextScale("fixture", 0);
  onTestFinished(() => stepTextScale("fixture", 0));
  setup();
  const user = userEvent.setup();
  await user.click(tray().getByRole("button", { name: "Larger text" }));
  expect(document.getElementById("deck-frame")?.style.getPropertyValue("--deck-text-scale")).toBe(
    "1.1",
  );
  await user.click(tray().getByRole("button", { name: "Smaller text" }));
  expect(document.getElementById("deck-frame")?.style.getPropertyValue("--deck-text-scale")).toBe(
    "1",
  );
});

it.each(["?embedded#/2", "?decks-bridge#/2", "#/presenter/2", "#/overview/2", "#/print"])(
  "the tray is absent at %s",
  (hash) => {
    setup(hash);
    expect(screen.queryByRole("toolbar", { name: "Deck controls" })).not.toBeInTheDocument();
  },
);

it("leaving the tray blurs a focused button so Space navigates again", async () => {
  setup("#/2");
  const user = userEvent.setup();
  const larger = tray().getByRole("button", { name: "Larger text" });
  await user.click(larger);
  expect(larger).toHaveFocus();
  await user.unhover(screen.getByRole("toolbar", { name: "Deck controls" }));
  expect(larger).not.toHaveFocus();
  await user.keyboard(" ");
  expect(window.location.hash).toBe("#/2?clicks=1");
});
