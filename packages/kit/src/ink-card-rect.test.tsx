import { act, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, expect, it } from "vitest";
import { FILTER_IDS, filterUrl } from "./filters";
import { InkCardRect } from "./ink-card-rect";
import { setup, tick } from "./kit.test-support";
import { ink, installTheme, resolveTheme } from "./theme";

beforeEach(() => {
  installTheme(resolveTheme());
});
function card(props: Partial<ComponentProps<typeof InkCardRect>> = {}) {
  return () => (
    <svg role="img" aria-label="Card">
      <InkCardRect x={10} y={20} width={300} height={200} {...props} />
    </svg>
  );
}
function drawing() {
  return screen.getByRole("img", { name: "Card", hidden: true });
}

it.each([{ context: "overview" as const }, { instant: true }])(
  "renders a finished outline with no transition: %j",
  async (options) => {
    await setup(card({ lit: true }), options);
    const rects = drawing().getElementsByTagName("rect");
    expect(rects).toHaveLength(3);
    expect(rects[2]).toHaveStyle({ strokeOpacity: "1", transition: "none" });
    await tick(1);
    expect(rects[1]).toHaveStyle({ opacity: "1" });
  },
);
it.each(["x", "y", "width", "height", "radius"] as const)(
  "applies %s to every card layer",
  async (prop) => {
    await setup(card({ [prop]: 60 }), { instant: true });
    for (const rect of drawing().getElementsByTagName("rect"))
      expect(rect).toHaveAttribute(prop === "radius" ? "rx" : prop, "60");
  },
);
it("fills the surface with the requested paint", async () => {
  await setup(card({ surface: "var(--od-canvas)" }), { instant: true });
  expect(drawing().getElementsByTagName("rect")[0]).toHaveAttribute("fill", "var(--od-canvas)");
});
it("colors the glow from its hue", async () => {
  await setup(card({ hue: "rose" }), { instant: true });
  expect(drawing().getElementsByTagName("stop")[0]).toHaveAttribute("stop-color", ink("rose", 3));
});
it.each(["glowCx", "glowCy", "glowR", "glowEdge", "glowOpacity"] as const)(
  "draws the %s glow setting",
  async (prop) => {
    await setup(card({ [prop]: 0.6 }), { instant: true });
    const gradient = drawing().getElementsByTagName("radialGradient")[0];
    const stops = drawing().getElementsByTagName("stop");
    if (prop === "glowCx") expect(gradient).toHaveAttribute("cx", "0.6");
    if (prop === "glowCy") expect(gradient).toHaveAttribute("cy", "0.6");
    if (prop === "glowR") expect(gradient).toHaveAttribute("r", "0.6");
    if (prop === "glowEdge") expect(stops[1]).toHaveAttribute("offset", "0.6");
    if (prop === "glowOpacity") expect(stops[0]).toHaveStyle({ stopOpacity: "0.6" });
  },
);
it("hides the glow when unlit", async () => {
  await setup(card({ lit: false }), { instant: true });
  expect(drawing().getElementsByTagName("rect")[1]).toHaveStyle({ opacity: "0" });
});
it.each(["stroke", "strokeWidth", "strokeOpacity", "dash", "glowFilter"] as const)(
  "draws the %s outline setting",
  async (prop) => {
    await setup(
      card({
        stroke: prop === "stroke" ? "var(--od-border)" : undefined,
        strokeWidth: prop === "strokeWidth" ? 4 : undefined,
        strokeOpacity: prop === "strokeOpacity" ? 0.6 : undefined,
        dash: prop === "dash" ? "4 6" : undefined,
        glowFilter: prop === "glowFilter",
      }),
      { instant: true },
    );
    const outline = drawing().getElementsByTagName("rect")[2];
    if (prop === "stroke") expect(outline).toHaveAttribute("stroke", "var(--od-border)");
    if (prop === "strokeWidth") expect(outline).toHaveAttribute("stroke-width", "4");
    if (prop === "strokeOpacity") expect(outline).toHaveStyle({ strokeOpacity: "0.6" });
    if (prop === "dash") expect(outline).toHaveAttribute("stroke-dasharray", "4 6");
    if (prop === "glowFilter")
      expect(outline).toHaveAttribute("filter", filterUrl(FILTER_IDS.glow));
  },
);
it("draws children above the finished outline", async () => {
  await setup(card({ children: <text>Card title</text> }), { instant: true });
  expect(screen.getByText("Card title")).toBeVisible();
  expect(drawing().firstElementChild?.lastElementChild).toBe(screen.getByText("Card title"));
});
it("gives simultaneous cards independent gradients", async () => {
  await setup(
    () => (
      <svg role="img" aria-label="Card">
        <InkCardRect x={0} y={0} width={100} height={100} />
        <InkCardRect x={200} y={0} width={100} height={100} />
      </svg>
    ),
    { instant: true },
  );
  const gradients = Array.from(drawing().getElementsByTagName("radialGradient"));
  expect(new Set(gradients.map((gradient) => gradient.id)).size).toBe(2);
  const fills = Array.from(drawing().getElementsByTagName("rect"), (rect) =>
    rect.getAttribute("fill"),
  );
  for (const gradient of gradients) expect(fills).toContain(`url(#${gradient.id})`);
});
it("disables transitions when inactive", async () => {
  const app = await setup(card({ lit: true }));
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  for (const rect of Array.from(drawing().getElementsByTagName("rect")).slice(1))
    expect(rect).toHaveStyle({ transition: "none" });
});
