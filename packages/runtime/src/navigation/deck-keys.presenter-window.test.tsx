import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { install, setup } from "../deck.test-support";

it("Space on Reset timer uses native button activation and never advances the talk", async () => {
  setup("#/presenter/2?clicks=1");
  const user = userEvent.setup();
  const reset = screen.getByRole("button", { name: "Reset timer" });
  reset.focus();
  await user.keyboard(" ");
  expect(window.location.hash).toBe("#/presenter/2?clicks=1");
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00");
});

it("p opens a named presenter window, not a tab, at this URL and position and focuses it", async () => {
  const events: string[] = [];
  const popup = {
    location: { href: "about:blank" },
    focus() {
      events.push("focus");
    },
  };
  install(window, "open", (url: string, name: string, features: string) => {
    events.push(`${url}|${name}|${features}`);
    return popup;
  });
  setup("?custom=kept#/2?clicks=2");
  await userEvent.setup().keyboard("p");
  expect(events).toEqual([
    "|react-decks-presenter:react-decks:fixture:/|popup,width=1280,height=800",
    "focus",
  ]);
  expect(popup.location.href).toBe(`${window.location.origin}/?custom=kept#/presenter/2?clicks=2`);
});

it("p focuses an existing presenter without changing its location", async () => {
  const events: string[] = [];
  const popup = {
    location: { href: "http://localhost/#/overview/2?clicks=2" },
    focus() {
      events.push("focus");
    },
  };
  install(window, "open", () => popup);
  setup("#/3");
  await userEvent.setup().keyboard("p");
  expect(popup.location.href).toBe("http://localhost/#/overview/2?clicks=2");
  expect(events).toEqual(["focus"]);
});

it("a blocked presenter popup leaves the talk in place", async () => {
  const opened: string[] = [];
  install(window, "open", (url: string) => {
    opened.push(url);
    return null;
  });
  setup("#/2?clicks=1");
  await userEvent.setup().keyboard("p");
  expect(opened).toEqual([""]);
  expect(window.location.hash).toBe("#/2?clicks=1");
});

it.each(["?embedded#/2", "#/presenter/2", "#/overview/2", "#/print"])(
  "p is ignored at %s",
  async (hash) => {
    const opened: string[] = [];
    install(window, "open", (url: string) => {
      opened.push(url);
      return null;
    });
    setup(hash);
    await userEvent.setup().keyboard("p");
    expect(opened).toEqual([]);
  },
);
