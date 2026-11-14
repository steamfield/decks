import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished } from "vitest";
import { makeSource, setup } from "./deck.test-support";
import { useSlide } from "./index";

function Slide() {
  const slide = useSlide();
  return <p>{`${slide.renderContext} slide ${slide.no} click ${slide.clicks}`}</p>;
}

function overview(hash = "#/overview/2?clicks=2") {
  const source = makeSource();
  return setup(hash, {
    ...source,
    slides: Object.fromEntries(
      source.manifest.slides.map(({ id }) => [id, async () => ({ default: Slide })]),
    ),
  });
}

it("overview mounts every slide at its last click and focuses the current slide", async () => {
  overview();
  const region = screen.getByRole("region", { name: "Slide overview" });
  const tiles = within(region).getAllByRole("button");
  expect(tiles).toHaveLength(5);
  for (const [index, click] of [0, 3, 0, 1, 0].entries()) {
    const tile = within(region).getByRole("button", {
      name: `Slide ${index + 1}: Title ${index + 1}`,
    });
    expect(
      await within(tile).findByText(`overview slide ${index + 1} click ${click}`),
    ).toBeVisible();
  }
  const current = within(region).getByRole("button", { name: "Slide 2: Title 2" });
  expect(current).toHaveAttribute("aria-current", "true");
  expect(current).toHaveFocus();
  expect(document.documentElement).toHaveAttribute("data-deck-motion", "instant");
});

it("arrows, Home and End move only focus, with boundaries, leaving talk position and history untouched", async () => {
  const user = userEvent.setup();
  const { store } = overview();
  const notifications: string[] = [];
  store.subscribe(() => notifications.push(window.location.hash));
  const length = window.history.length;
  for (const [key, no] of [
    ["{ArrowRight}", 3],
    ["{ArrowDown}", 4],
    ["{ArrowLeft}", 3],
    ["{ArrowUp}", 2],
    ["{Home}{ArrowLeft}", 1],
    ["{End}{ArrowDown}", 5],
  ] as const) {
    await user.keyboard(key);
    expect(screen.getByRole("button", { name: `Slide ${no}: Title ${no}` })).toHaveFocus();
    expect(store.getState().nav).toEqual({ slide: 2, click: 2 });
    expect(window.location.hash).toBe("#/overview/2?clicks=2");
  }
  expect(notifications).toEqual([]);
  expect(window.history.length).toBe(length);
});

it.each(["{Enter}", " ", "click"])(
  "native activation with %s selects another slide at click zero",
  async (key) => {
    const user = userEvent.setup();
    overview();
    const tile = screen.getByRole("button", { name: "Slide 4: Title 4" });
    if (key === "click") await user.click(tile);
    else {
      await user.keyboard("{ArrowDown}{ArrowDown}");
      await user.keyboard(key);
    }
    expect(window.location.hash).toBe("#/4");
    expect(await screen.findByText("slide slide 4 click 0")).toBeVisible();
  },
);

it("activating the current tile keeps the talk's click", async () => {
  overview();
  await userEvent.setup().keyboard("{Enter}");
  expect(window.location.hash).toBe("#/2?clicks=2");
});

it.each(["play", "presenter"] as const)(
  "o opens overview from %s and o or Escape returns home without changing clicks",
  async (home) => {
    const user = userEvent.setup();
    overview(home === "play" ? "#/2?clicks=2" : "#/presenter/2?clicks=2");
    for (const exit of ["o", "{Escape}"]) {
      await user.keyboard("o{End}");
      expect(window.location.hash).toBe("#/overview/2?clicks=2");
      await user.keyboard(exit);
      expect(window.location.hash).toBe(
        home === "play" ? "#/2?clicks=2" : "#/presenter/2?clicks=2",
      );
    }
  },
);

it("a presenter-named window loaded in overview returns to presenter", async () => {
  const previous = window.name;
  window.name = "react-decks-presenter:fixture";
  onTestFinished(() => {
    window.name = previous;
  });
  overview();
  await userEvent.setup().keyboard("{Escape}");
  expect(window.location.hash).toBe("#/presenter/2?clicks=2");
});

it("remote talk movement changes aria-current without moving the browsing focus", async () => {
  const { store } = overview();
  const user = userEvent.setup();
  await user.keyboard("{End}");
  act(() => store.setView("overview", { slide: 4, click: 1 }));
  expect(screen.getByRole("button", { name: "Slide 4: Title 4" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(screen.getByRole("button", { name: "Slide 5: Title 5" })).toHaveFocus();
});
