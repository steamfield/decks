import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { setup } from "../deck.test-support";

// The subject is the DOM contract: the main frame's --deck-text-scale.
const textScale = () =>
  document.querySelector<HTMLElement>("#deck-frame")?.style.getPropertyValue("--deck-text-scale");

beforeEach(() => window.localStorage.clear());

it("Ctrl and plus makes slide text larger, minus smaller, and zero restores the authored size.", async () => {
  setup();
  const user = userEvent.setup();
  expect(textScale()).toBe("1");
  await user.keyboard("{Control>}[Equal]{/Control}");
  const larger = Number(textScale());
  expect(larger).toBeGreaterThan(1);
  await user.keyboard("{Control>}[Equal]{/Control}");
  expect(Number(textScale())).toBeGreaterThan(larger);
  await user.keyboard("{Control>}[Digit0]{/Control}");
  expect(textScale()).toBe("1");
  await user.keyboard("{Control>}[Minus]{/Control}");
  expect(Number(textScale())).toBeLessThan(1);
});

it("Text stops growing and shrinking at its limits.", async () => {
  setup();
  const user = userEvent.setup();
  const press = (key: string, times: number) =>
    user.keyboard(`{Control>}${`[${key}]`.repeat(times)}{/Control}`);
  await press("Equal", 100);
  const largest = Number(textScale());
  expect(largest).toBeGreaterThan(1);
  await press("Equal", 1);
  expect(Number(textScale())).toBe(largest);
  await press("Minus", 200);
  const smallest = Number(textScale());
  expect(smallest).toBeLessThan(1);
  await press("Minus", 1);
  expect(Number(textScale())).toBe(smallest);
});

it("A deck opened after the size was changed starts at that size.", async () => {
  setup();
  await userEvent.setup().keyboard("{Control>}[Equal]{/Control}");
  const chosen = textScale();
  expect(chosen).not.toBe("1");
  document.body.replaceChildren();
  setup();
  expect(textScale()).toBe(chosen);
});

it("A size chosen in another window of the deck is applied here.", async () => {
  setup();
  // Learn the storage key from the module's own write instead of copying its format.
  await userEvent.setup().keyboard("{Control>}[Equal]{/Control}");
  const key = window.localStorage.key(0);
  if (key === null) throw new Error("Changing the text size wrote nothing to localStorage");
  act(() => {
    window.localStorage.setItem(key, "1.33");
    window.dispatchEvent(new StorageEvent("storage"));
  });
  expect(textScale()).toBe("1.33");
});

it("Plus and minus without Ctrl leave the size alone.", async () => {
  setup();
  await userEvent.setup().keyboard("[Equal][Minus]");
  expect(textScale()).toBe("1");
});
