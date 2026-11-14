import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { setup } from "./deck.test-support";

// The subject is the DOM contract: the main frame's --deck-text-scale.
const textScale = () =>
  document.querySelector<HTMLElement>("#deck-frame")?.style.getPropertyValue("--deck-text-scale");

beforeEach(() => window.localStorage.clear());

it("Ctrl and plus makes slide text larger, minus smaller, and zero restores the authored size.", async () => {
  setup();
  const user = userEvent.setup();
  expect(textScale()).toBe("1");
  await user.keyboard("{Control>}[Equal][Equal]{/Control}");
  expect(textScale()).toBe("1.21");
  await user.keyboard("{Control>}[Minus]{/Control}");
  expect(textScale()).toBe("1.1");
  await user.keyboard("{Control>}[Digit0]{/Control}");
  expect(textScale()).toBe("1");
  await user.keyboard("{Control>}[Minus]{/Control}");
  expect(textScale()).toBe("0.91");
});

it("Text stops growing at two and a half times and shrinking at half.", async () => {
  setup();
  const user = userEvent.setup();
  await user.keyboard(`{Control>}${"[Equal]".repeat(15)}{/Control}`);
  expect(textScale()).toBe("2.5");
  await user.keyboard(`{Control>}${"[Minus]".repeat(30)}{/Control}`);
  expect(textScale()).toBe("0.5");
});

it("A deck opened after the size was changed starts at that size.", async () => {
  setup();
  await userEvent.setup().keyboard("{Control>}[Equal]{/Control}");
  document.body.replaceChildren();
  setup();
  expect(textScale()).toBe("1.1");
});

it("A size chosen in another window of the deck is applied here.", () => {
  setup();
  act(() => {
    window.localStorage.setItem("react-decks:text-scale:react-decks:fixture:/", "1.33");
    window.dispatchEvent(new StorageEvent("storage"));
  });
  expect(textScale()).toBe("1.33");
});

it("Plus and minus without Ctrl leave the size alone.", async () => {
  setup();
  await userEvent.setup().keyboard("[Equal][Minus]");
  expect(textScale()).toBe("1");
});
