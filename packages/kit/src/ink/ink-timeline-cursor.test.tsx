import { act, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { useScriptedDemo } from "../story/scripted-demo";
import { DUR } from "../theme/easings";
import { ink, installTheme, resolveTheme } from "../theme/theme";
import { InkTimeline } from "./ink-timeline";
import { InkTimelineCursor } from "./ink-timeline-cursor";

beforeEach(() => installTheme(resolveTheme()));
const base: ComponentProps<typeof InkTimelineCursor> = {
  position: 5,
  domain: [0, 10],
  range: [200, 1200],
  y: 400,
  hue: "amber",
};
const image = () => screen.getByRole("img", { name: "Cursor" });
const circle = () => image().getElementsByTagName("circle").item(0);
function Cursor() {
  return (
    <svg role="img" aria-label="Cursor">
      <InkTimelineCursor {...base} />
    </svg>
  );
}
function ChangingCursor({
  changed,
}: {
  changed: Partial<ComponentProps<typeof InkTimelineCursor>>;
}) {
  const { clicks } = useScriptedDemo();
  return (
    <svg role="img" aria-label="Cursor">
      <InkTimelineCursor {...base} {...(clicks ? changed : {})} />
    </svg>
  );
}
it.each([{ context: "overview" as const }, { instant: true }])(
  "renders the settled cursor in %j",
  async (options) => {
    await setup(Cursor, options);
    expect(circle()).toHaveAttribute("cx", "700");
    expect(circle()).toHaveAttribute("cy", "400");
    expect(image().getElementsByTagName("line").item(0)).toHaveAttribute("x2", "700");
  },
);
it.each([
  ["position", { position: 8 }, "cx", "1000"],
  ["domain", { domain: [0, 20] }, "cx", "450"],
  ["range", { range: [100, 500] }, "cx", "300"],
  ["y", { y: 600 }, "cy", "600"],
] satisfies [string, Partial<ComponentProps<typeof InkTimelineCursor>>, string, string][])(
  "uses %s to place the cursor",
  async (_, changed, attribute, expected) => {
    const app = await setup(() => <ChangingCursor changed={changed} />);
    await app.next();
    expect(circle()).toHaveAttribute(attribute, expected);
  },
);
it("uses the chosen hue", async () => {
  await setup(() => (
    <svg role="img" aria-label="Cursor">
      <InkTimelineCursor {...base} hue="rose" />
    </svg>
  ));
  expect(circle()?.parentElement).toHaveStyle({ color: ink("rose", 3) });
});
it("aligns with a timeline tick in print", async () => {
  await setup(
    () => (
      <svg role="img" aria-label="Cursor">
        <InkTimeline
          ticks={[{ id: "now", at: 5, label: "Now" }]}
          domain={base.domain}
          range={base.range}
          y={base.y}
        />
        <InkTimelineCursor {...base} />
      </svg>
    ),
    { context: "print" },
  );
  expect(circle()).toHaveAttribute("cx", screen.getByText("Now").getAttribute("x"));
  expect(circle()).toHaveAttribute(
    "cy",
    image().getElementsByTagName("line").item(0)?.getAttribute("y1"),
  );
  expect(screen.getByText("Now").parentElement).toHaveStyle({ opacity: 1 });
});
it("does not animate while inactive", async () => {
  const app = await setup(Cursor);
  const held = circle();
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  await tick(DUR.trace);
  expect(held).toHaveAttribute("cx", "700");
  expect(held).toHaveAttribute("cy", "400");
});
