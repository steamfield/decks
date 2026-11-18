import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, onTestFinished, vi } from "vitest";
import { deck, remotePage } from "./remote.test-support";

it("the page shows Waiting for the deck until the first position arrives", () => {
  const page = remotePage();
  expect(screen.getByText("Waiting for the deck")).toBeVisible();
  page.deliver({ type: "deck", deck });
  expect(screen.getByText("Waiting for the deck")).toBeVisible();
  page.position();
  expect(screen.queryByText("Waiting for the deck")).toBeNull();
  page.deliver({ type: "waiting" });
  expect(screen.getByText("Waiting for the deck")).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Arrival" })).toBeNull();
});

it("the page shows position, click, current and next titles, and End of deck on the last slide", () => {
  const page = remotePage();
  page.position(1, 2);
  page.deliver({ type: "deck", deck });
  expect(screen.getByText("1 / 2")).toBeVisible();
  expect(screen.getByText("click 2 of 3")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Arrival" })).toBeVisible();
  expect(screen.getByText("Next: Departure")).toBeVisible();
  page.position(2);
  expect(screen.getByText("2 / 2")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Departure" })).toBeVisible();
  expect(screen.getByText("End of deck")).toBeVisible();
  expect(screen.queryByText(/click .* of/)).toBeNull();
});

it("the page marks the current click's note segment and shows No notes for this slide when empty", () => {
  const page = remotePage();
  page.present();
  const notes = within(screen.getByRole("region", { name: "Notes" }));
  expect(notes.getByRole("generic", { current: true })).toHaveTextContent("Introduce the site.");
  page.position(1, 2);
  expect(
    within(notes.getByRole("generic", { current: true })).getByRole("strong"),
  ).toHaveTextContent("Describe the river.");
  expect(notes.getByText("Introduce the site.")).toBeVisible();
  expect(notes.getByText("Show the map.")).toBeVisible();
  page.position(2);
  expect(screen.getByText("No notes for this slide")).toBeVisible();
});

it("the timer counts on from the received elapsed time and shows 00:00 while elapsed is null", async () => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
  vi.setSystemTime(new Date(2026, 0, 1, 15, 32));
  const page = remotePage();
  page.present();
  const elapsed = screen.getByRole("timer", { name: "Elapsed time" });
  await act(() => vi.advanceTimersByTimeAsync(2000));
  expect(elapsed).toHaveTextContent("00:00");
  page.position(1, 1, 59000);
  expect(elapsed).toHaveTextContent("00:59");
  vi.setSystemTime(new Date(2026, 0, 1, 16, 32));
  await act(() => vi.advanceTimersByTimeAsync(2000));
  expect(elapsed).toHaveTextContent("01:01");
  expect(screen.getByLabelText("Local time")).toHaveTextContent("16:32");
  page.position(1, 1, null);
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(elapsed).toHaveTextContent("00:00");
});

it("Reset timer sends reset-timer", async () => {
  const page = remotePage();
  page.present();
  await userEvent.setup().click(screen.getByRole("button", { name: "Reset timer" }));
  expect(page.sent).toEqual([{ type: "reset-timer" }]);
});

it("the Next and Previous buttons and the arrow, Page and Space keys send intents", async () => {
  const page = remotePage();
  page.present();
  const user = userEvent.setup();
  await user.tripleClick(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(document.body);
  await user.keyboard("{ArrowRight}{ArrowDown}{PageDown}[Space]{ArrowLeft}{ArrowUp}{PageUp}");
  const next = { type: "next" };
  const prev = { type: "prev" };
  expect(page.sent).toEqual([next, next, next, prev, next, next, next, next, prev, prev, prev]);
  expect(screen.getByText("click 0 of 3")).toBeVisible();
});

it("keys are ignored while focus is in the go-to control, and choosing a slide there sends go", async () => {
  const page = remotePage();
  page.present();
  const user = userEvent.setup();
  const go = screen.getByRole("combobox", { name: "Go to slide" });
  expect(
    within(go)
      .getAllByRole("option")
      .filter((option) => !option.hasAttribute("disabled"))
      .map((option) => option.textContent),
  ).toEqual(["Arrival", "Departure"]);
  await user.click(go);
  await user.keyboard("{ArrowRight}{PageUp}[Space]");
  await user.selectOptions(go, "2");
  expect(page.sent).toEqual([{ type: "go", slide: 2 }]);
  expect(screen.getByRole("heading", { name: "Arrival" })).toBeVisible();
});

it("a speaker can jump back to the beginning of the current slide", async () => {
  const page = remotePage();
  page.present();
  page.position(1, 2);
  const go = screen.getByRole("combobox", { name: "Go to slide" });
  const currentSlide = within(go).getByRole("option", { name: "Arrival", selected: false });
  await userEvent.setup().selectOptions(go, currentSlide);
  expect(page.sent).toEqual([{ type: "go", slide: 1 }]);
  expect(screen.getByText("click 2 of 3")).toBeVisible();
});

it("Space activates the focused Previous or Reset timer button", async () => {
  const page = remotePage();
  page.present();
  const user = userEvent.setup();
  for (const name of ["Previous", "Reset timer"]) {
    screen.getByRole("button", { name }).focus();
    await user.keyboard("[Space]");
  }
  expect(page.sent).toEqual([{ type: "prev" }, { type: "reset-timer" }]);
});

it("a disconnect keeps the last notes visible under the banner and disables the controls", async () => {
  const page = remotePage();
  page.present();
  page.position(1, 2, 3000);
  act(() => page.sockets[0]?.close());
  expect(screen.getByRole("status")).toHaveTextContent("Disconnected since");
  expect(screen.getByRole("heading", { name: "Arrival" })).toBeVisible();
  expect(screen.getByText("Next: Departure")).toBeVisible();
  expect(screen.getByText("click 2 of 3")).toBeVisible();
  expect(screen.getByText("Describe the river.")).toBeVisible();
  for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  expect(screen.getByRole("combobox")).toBeDisabled();
  await userEvent.setup().keyboard("{ArrowRight}");
  expect(page.sent).toEqual([]);
});
