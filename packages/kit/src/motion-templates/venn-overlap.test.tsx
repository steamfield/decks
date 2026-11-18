import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "venn-overlap",
  sets: ["Workshop", "Field crew", "Design"],
  overlap: "Pilot",
} as const;
const parts = () => [
  ...props.sets.map((label) => screen.getByText(label).parentElement),
  screen.getByText(props.overlap),
];
beforeEach(() => installTheme(resolveTheme()));

it("venn-overlap hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={2} />);
  for (const part of parts()) expect(part).not.toBeVisible();
  await view.next();
  await tick(1.2);
  for (const part of parts()) expect(part).not.toBeVisible();
  await view.next();
  await tick(1.2);
  for (const part of parts()) expect(part).toBeVisible();
  await view.previous();
  await tick(1.2);
  for (const part of parts()) expect(part).not.toBeVisible();
});

it("venn-overlap with at 0 shows the finished pose outside the live slide", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "preview" });
  for (const part of parts()) expect(part).toBeVisible();
});

it("the venn-overlap entrance in the live slide plays and settles within about 1.2 s of virtual time", async () => {
  await setup(() => <MotionTemplate {...props} />);
  const [first] = parts();
  if (!first) throw new Error("Missing first part");
  expect(first).not.toBeVisible();
  await tick(0.06);
  const opacity = Number(getComputedStyle(first).opacity);
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  await tick(1.14);
  for (const part of parts()) expect(part).toHaveStyle({ opacity: "1" });
});

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "%s shows the finished venn-overlap pose for the click with no tween",
  async (mode) => {
    await setup(() => <MotionTemplate {...props} at={1} />, {
      click: 1,
      ...(mode === "instant" ? { instant: true } : { context: mode }),
    });
    for (const part of parts()) expect(part).toHaveStyle({ opacity: "1" });
  },
);

it("text is read once as the full sentence and is whole after unmount", async () => {
  const view = await setup(() => <MotionTemplate {...props} />, { instant: true });
  const text = screen.getByRole("heading", { name: props.overlap });
  expect(text).toHaveAccessibleName(props.overlap);
  expect(screen.getAllByText(text.textContent ?? "", { exact: true })).toEqual([text]);
  view.unmount();
  expect(text.firstChild).toBeInstanceOf(Text);
  expect(text.firstChild).toBe(text.lastChild);
  expect(text.textContent).toBe(props.overlap);
});

it.each([
  [{ at: -1 }, "venn-overlap: invalid at -1"],
  [{ at: Infinity }, "venn-overlap: invalid at Infinity"],
  [{ at: 0.5 }, "venn-overlap: invalid at 0.5"],
  [{ overlap: "" }, 'venn-overlap: invalid overlap ""'],
  [{ sets: ["Workshop", " "] }, 'venn-overlap: invalid sets[1] " "'],
] as const)(
  "venn-overlap throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it.each([0, 1, 4])("venn-overlap rejects a runtime list of %i sets", async (count) => {
  // MDX and JavaScript callers can supply lists outside the TypeScript tuple contract.
  const sets: [string, string] = ["Design", "Field"];
  sets.splice(0, sets.length, ...Array.from({ length: count }, () => "Region"));
  const { errors } = await setup(() => <MotionTemplate {...props} sets={sets} />, { error: true });
  expect(errors).toEqual([new Error(`venn-overlap: invalid sets ${JSON.stringify(sets)}`)]);
});
