import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished, vi } from "vitest";
import { setup } from "./deck.test-support";

it("presenter shortcuts navigate clicks", async () => {
  setup("#/presenter/2?clicks=1");
  await userEvent.setup().keyboard("{ArrowRight}");
  expect(window.location.hash).toBe("#/presenter/2?clicks=2");
});

it("holding a navigation key advances once in presenter", async () => {
  setup("#/presenter/2");
  await userEvent.setup().keyboard("{ArrowRight>4/}");
  expect(window.location.hash).toBe("#/presenter/2?clicks=1");
});

it.each(["Input", "Textarea", "Select", "Editable"])(
  "presenter shortcuts ignore focus in %s",
  async (label) => {
    setup("#/presenter/2?clicks=1");
    const user = userEvent.setup();
    const current = screen.getByRole("region", { name: "Current slide" });
    const control = await within(current).findByRole(
      label === "Select" ? "combobox" : label === "Editable" ? "article" : "textbox",
      { name: label },
    );
    await user.click(control);
    await user.keyboard("{ArrowRight}o{Escape}p");
    expect(window.location.hash).toBe("#/presenter/2?clicks=1");
  },
);

it("idle is set after three seconds, cleared by pointer movement and when leaving play", async () => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const { store, unmount } = setup();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  await act(async () => vi.advanceTimersByTimeAsync(2999));
  expect(document.documentElement).not.toHaveAttribute("data-deck-idle");
  await act(async () => vi.advanceTimersByTimeAsync(1));
  expect(document.documentElement).toHaveAttribute("data-deck-idle");
  vi.setTimerTickMode("interval", 1);
  await user.pointer({ target: document.body, coords: { x: 2, y: 2 } });
  vi.setTimerTickMode("manual");
  expect(document.documentElement).not.toHaveAttribute("data-deck-idle");
  await act(async () => vi.advanceTimersByTimeAsync(3000));
  act(() => store.setView("overview"));
  expect(document.documentElement).not.toHaveAttribute("data-deck-idle");
  await act(async () => vi.advanceTimersByTimeAsync(3000));
  expect(document.documentElement).not.toHaveAttribute("data-deck-idle");
  unmount();
});
