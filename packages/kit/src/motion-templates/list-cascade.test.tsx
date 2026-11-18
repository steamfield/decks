import { act, screen, within } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "list-cascade",
  items: ["Read the field notes", "Trace the missed handoff", "Try the revised checklist"],
} as const;
const part = () => screen.getByText("Read the field notes");
function opacity(text: Element) {
  let value = 1;
  for (let part: Element | null = text; part; part = part.parentElement)
    value *= Number(getComputedStyle(part).opacity || 1);
  return value;
}
beforeEach(() => installTheme(resolveTheme()));

it("list-cascade hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={2} />);
  expect(part()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(part()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(part()).toBeVisible();
  await view.previous();
  await tick(1.2);
  expect(part()).not.toBeVisible();
});

it("list-cascade with at 0 shows the finished pose outside the live slide", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "overview" });
  expect(part()).toBeVisible();
});

it("the list-cascade entrance in the live slide plays and settles within about 1.2 s of virtual time per beat", async () => {
  await setup(() => <MotionTemplate {...props} />);
  expect(part()).not.toBeVisible();
  const element = part();
  if (!element) throw new Error("Missing entrance text");
  const opacities = [];
  for (let frame = 0; frame < 12; frame++) {
    await tick(0.1);
    opacities.push(opacity(element));
  }
  expect(opacities.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
  expect(opacity(part())).toBe(1);
});

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "%s shows the finished list-cascade pose for the click with no tween",
  async (mode) => {
    await setup(() => <MotionTemplate {...props} at={1} />, {
      click: 1,
      ...(mode === "instant" ? { instant: true } : { context: mode }),
    });
    expect(opacity(part())).toBe(1);
    expect(part()).toBeVisible();
  },
);

it("text is read once as the full sentence and is whole after unmount", async () => {
  const view = await setup(() => <MotionTemplate {...props} />, { instant: true });
  const text = within(screen.getByRole("listitem")).getByText("Read the field notes");
  expect(text).toHaveTextContent("Read the field notes");
  view.unmount();
  expect(text.textContent).toBe("Read the field notes");
});

it.each([
  [{ at: -1 }, "list-cascade: invalid at -1"],
  [{ at: Number.NaN }, "list-cascade: invalid at NaN"],
  [{ at: Infinity }, "list-cascade: invalid at Infinity"],
  [{ at: 1.5 }, "list-cascade: invalid at 1.5"],
  [{ items: [] }, "list-cascade: invalid items []"],
  [{ items: [" "] }, 'list-cascade: invalid items[0] " "'],
  [
    { items: Array(7).fill("Item") },
    'list-cascade: invalid items ["Item","Item","Item","Item","Item","Item","Item"]',
  ],
] as const)(
  "list-cascade throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it("list-cascade shows item i from click at plus i and dims earlier items", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={1} />);
  const rows = props.items.map((item) => screen.getByText(item));
  for (let click = 1; click <= rows.length; click++) {
    await view.next();
    await tick(1.2);
    for (const [index, row] of rows.entries()) {
      if (!row) throw new Error("Missing list item");
      if (index + 1 > click) expect(row).not.toBeVisible();
      else if (index + 1 === click) expect(opacity(row)).toBe(1);
      else {
        expect(row).toBeVisible();
        expect(opacity(row)).toBeLessThan(1);
      }
    }
  }
});

it("preserves the leading item after leaving the completed arrival list and coming back", async () => {
  const view = await setup(() => <MotionTemplate {...props} />);
  await tick(1.2);
  for (let click = 1; click <= 3; click++) {
    await view.next();
    await tick(1.2);
  }
  const finished = props.items.map((item) => opacity(screen.getByText(item)));
  expect(finished[0]).toBeLessThan(1);
  await view.next();
  await screen.findByRole("heading", { name: "Second slide" });
  await act(() => view.store.dispatch({ type: "prev" }));
  expect(props.items.map((item) => opacity(screen.getByText(item)))).toEqual(finished);
});

it("accepts six items", async () => {
  const items = Array.from({ length: 6 }, (_, index) => String(index + 1));
  await setup(() => <MotionTemplate {...props} items={items} />, { instant: true });
  expect(screen.getByRole("list").children).toHaveLength(6);
});
