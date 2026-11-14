import { act, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { InkChip } from "./ink-chip";
import { setup, tick } from "./kit.test-support";
import { ink, installTheme, resolveTheme } from "./theme";

beforeEach(() => {
  installTheme(resolveTheme());
});

it.each([{ context: "overview" as const }, { instant: true }])(
  "renders a settled chip without transitions: %j",
  async (options) => {
    await setup(() => <InkChip x={960} y={540} text="Note" />, options);
    expect(screen.getByText("Note")).toHaveStyle({ opacity: "1", transition: "none", top: "50%" });
    await tick(1);
    expect(screen.getByText("Note")).toBeVisible();
  },
);

it("positions a left-anchored chip from x", async () => {
  await setup(() => <InkChip x={480} y={540} text="Note" />, { instant: true });
  expect(screen.getByText("Note").style.left).toBe("calc(25% + 0.520833 * var(--sw))");
});
it("positions a chip vertically from y", async () => {
  await setup(() => <InkChip x={960} y={270} text="Note" />, { instant: true });
  expect(screen.getByText("Note")).toHaveStyle({ top: "25%" });
});
it("anchors its right edge at x", async () => {
  await setup(() => <InkChip x={480} y={540} text="Note" anchor="right" />, { instant: true });
  expect(screen.getByText("Note")).toHaveStyle({ right: "75%" });
  expect(screen.getByText("Note").style.left).toBe("");
});
it("uses the requested hue", async () => {
  await setup(() => <InkChip x={0} y={0} text="Note" hue="rose" />, { instant: true });
  expect(screen.getByText("Note").style.getPropertyValue("--od-chip-ink")).toBe(ink("rose", 3));
});
it("keeps progress controlled by the current beat, including in overview", async () => {
  await setup(() => <InkChip x={0} y={0} text="Note" progress={0.25} />, { context: "overview" });
  expect(screen.getByText("Note")).toHaveStyle({ opacity: "0.25", pointerEvents: "none" });
});
it("uses text as the chip's visible content", async () => {
  await setup(() => <InkChip x={0} y={0} text="A second note" />, { instant: true });
  expect(screen.getByText("A second note")).toBeVisible();
});
it("makes href a usable new-tab link only after it appears", async () => {
  await setup(
    () => (
      <InkChip x={0} y={0} text="Read source" href="https://example.com/source" progress={0.6} />
    ),
    { instant: true },
  );
  const link = screen.getByRole("link", { name: "Read source" });
  expect(link).toHaveAttribute("href", "https://example.com/source");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener");
  expect(link).toHaveStyle({ pointerEvents: "auto" });
});
it("keeps a link below the visibility threshold from receiving pointer events", async () => {
  await setup(() => (
    <InkChip x={0} y={0} text="Read source" href="https://example.com" progress={0.5} />
  ));
  expect(screen.getByRole("link", { name: "Read source" })).toHaveStyle({ pointerEvents: "none" });
});
it("drops transitions while inactive", async () => {
  const app = await setup(() => <InkChip x={0} y={0} text="Note" />);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  expect(screen.getByText("Note")).toHaveStyle({ transition: "none", opacity: "1" });
});
