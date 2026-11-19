import { isInaccessible, screen, within } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "end-card",
  title: "Take the checklist to your next shift.",
  link: "https://example.org/checklist",
} as const;
// The title is split into masked words, so it is found by the label SplitText gives it.
const part = () => screen.getByLabelText(props.title);
beforeEach(() => installTheme(resolveTheme()));

it("end-card hides its parts before click at and shows the finished pose from click at", async () => {
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

it("the end-card entrance in the live slide plays and settles within about 1.2 s of virtual time per beat", async () => {
  await setup(() => <MotionTemplate {...props} />);
  expect(part()).not.toBeVisible();
  const element = part();
  if (!element) throw new Error("Missing entrance text");
  const opacities = [];
  for (let frame = 0; frame < 12; frame++) {
    await tick(0.1);
    opacities.push(Number(getComputedStyle(element).opacity));
  }
  expect(opacities.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
  expect(part()).toHaveStyle({ opacity: "1" });
});

it("end-card shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, context: "print" });
  expect(part()).toHaveStyle({ opacity: "1" });
  expect(part()).toBeVisible();
});

it("reads the split link once as the whole address and leaves it whole after unmount", async () => {
  const view = await setup(() => <MotionTemplate {...props} />, { instant: true });
  const link = screen.getByRole("link", { name: props.link });
  expect(link.children.length).toBeGreaterThan(1);
  for (const char of link.children) expect(isInaccessible(char)).toBe(true);
  view.unmount();
  expect(Array.from(link.childNodes, (node) => node.nodeValue)).toEqual([props.link]);
});

it.each([
  [{ at: -1 }, "end-card: invalid at -1"],
  [{ at: 1.5 }, "end-card: invalid at 1.5"],
  [{ title: " " }, 'end-card: invalid title " "'],
] as const)(
  "end-card throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it("end-card renders without a link", async () => {
  await setup(() => <MotionTemplate template="end-card" title={props.title} />, { instant: true });
  const title = screen.getByRole("heading", { name: props.title });
  expect(title).toBeVisible();
  if (!title.parentElement) throw new Error("Missing closing card");
  expect(within(title.parentElement).queryByRole("link")).toBeNull();
});

it("types the link from left to right while keeping the full address accessible", async () => {
  await setup(() => <MotionTemplate {...props} />);
  await tick(0.55);
  const link = screen.getByRole("link", { name: props.link });
  const visibleText = () => {
    const nodes = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
    let text = "";
    for (let node = nodes.nextNode(); node; node = nodes.nextNode()) {
      let part = node.parentElement;
      while (part && part !== link && getComputedStyle(part).opacity !== "0")
        part = part.parentElement;
      if (part === link) text += node.textContent;
    }
    return text;
  };
  const prefix = visibleText();
  expect(prefix.length).toBeGreaterThan(0);
  expect(prefix.length).toBeLessThan(props.link.length);
  expect(props.link.startsWith(prefix)).toBe(true);
  await tick(0.65);
  expect(visibleText()).toBe(props.link);
});

it("keeps the decorative closing rule out of the reading order before the entrance", async () => {
  await setup(() => <MotionTemplate {...props} at={1} />);
  expect(screen.queryByRole("separator")).toBeNull();
});
