import { isInaccessible, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const content = { title: "The river changed course.", subtitle: "Tracing the May flood" };

function EditableTitle() {
  const [title, setTitle] = useState(content.title);
  return (
    <>
      <button type="button" onClick={() => setTitle("The banks shifted.")}>
        Edit headline
      </button>
      <MotionTemplate template="title-reveal" title={title} />
    </>
  );
}

it("reads the edited title as a whole sentence", async () => {
  const view = await setup(EditableTitle, { instant: true });
  expect(screen.getByRole("heading", { name: content.title })).toBeVisible();
  await view.user.click(screen.getByRole("button", { name: "Edit headline" }));
  expect(screen.getByRole("heading", { name: "The banks shifted." })).toBeVisible();
  expect(screen.queryByRole("heading", { name: content.title })).toBeNull();
});
beforeEach(() => installTheme(resolveTheme()));
function show(at: number, options?: Parameters<typeof setup>[1]) {
  return setup(() => <MotionTemplate template="title-reveal" {...content} at={at} />, options);
}
function finished() {
  expect(screen.getByText("Tracing the May flood")).toBeVisible();
  expect(screen.getByRole("heading", { name: content.title })).toBeVisible();
}
it("title-reveal hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await show(2);
  expect(screen.getByText("Tracing the May flood")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(screen.getByText("Tracing the May flood")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  finished();
  await view.previous();
  await tick(1.2);
  expect(screen.getByText("Tracing the May flood")).not.toBeVisible();
});
it.each([0, 1])(
  "the title-reveal entrance in the live slide plays and settles within about 1.2 s of virtual time (at %i)",
  async (at) => {
    const view = await show(at);
    if (at) await view.next();
    const pose = () => getComputedStyle(screen.getByText("The")).transform;
    const start = pose();
    await tick(0.08);
    const moving = pose();
    expect(moving).not.toBe(start);
    await tick(1.12);
    const end = pose();
    expect(end).not.toBe(moving);
    finished();
    await tick(0.6);
    expect(pose()).toBe(end);
  },
);
it("title-reveal shows its finished pose for the click in print", async () => {
  await show(2, { click: 2, context: "print" });
  finished();
});

it.each([
  [{ title: " " }, 'title-reveal title must contain text, got " "'],
  [{ at: -1 }, "title-reveal at must be a nonnegative integer, got -1"],
  [{ at: NaN }, "title-reveal at must be a nonnegative integer, got NaN"],
] as const)(
  "title-reveal throws naming itself and the prop for invalid input %j",
  async (overrides, message) => {
    const view = await setup(
      () => <MotionTemplate template="title-reveal" {...content} {...overrides} />,
      { error: true },
    );
    expect(view.errors).toEqual([new Error(message)]);
  },
);

it("reads the split title once as the whole sentence and leaves it whole after unmount", async () => {
  const view = await show(0, { context: "print" });
  const heading = screen.getByRole("heading", { name: content.title });
  for (const word of content.title.split(" "))
    expect(isInaccessible(screen.getByText(word))).toBe(true);
  view.unmount();
  expect(heading.innerHTML).toBe(content.title);
});
