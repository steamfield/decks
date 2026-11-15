import { useSlide } from "@react-decks/runtime";
import { act, screen, within } from "@testing-library/react";
import { type ComponentProps, useState } from "react";
import { beforeEach, expect, it, onTestFinished, vi } from "vitest";
import { setup } from "../kit.test-support";
import { ink, installTheme, resolveTheme } from "../theme/theme";
import { Graph3D } from "./graph-3d";

beforeEach(() => {
  installTheme(resolveTheme());
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
});

async function advanceFrames() {
  await act(async () => vi.advanceTimersByTimeAsync(2000));
}

const nodes = [
  { id: "a", label: "Alpha", category: "First" },
  { id: "b", label: "Beta", category: "Second" },
];
const edges = [{ source: "a", target: "b", confidence: 0.8 }];
function Subject() {
  return <Graph3D nodes={nodes} edges={edges} />;
}

it("draws nodes and edges whose optional metadata is absent", async () => {
  await setup(() => <Graph3D nodes={[{ id: "plain" }]} edges={[]} />, { context: "overview" });
  expect(screen.getByLabelText("plain")).toBeVisible();
});

it.each([{ context: "overview" as const }, { instant: true }])(
  "shows a settled SVG still without a WebGL canvas in %j",
  async (options) => {
    const app = await setup(Subject, options);
    expect(screen.getByRole("img", { name: "Similarity graph" })).toBeVisible();
    expect(screen.getByLabelText("Alpha")).toBeVisible();
    expect(screen.getByLabelText("Beta")).toBeVisible();
    expect(app.container.querySelector("canvas")).toBeNull();
    const before = screen.getByLabelText("Alpha").querySelector("circle")?.getAttribute("cx");
    await advanceFrames();
    expect(screen.getByLabelText("Alpha").querySelector("circle")).toHaveAttribute("cx", before);
  },
);

function ChangingGraph({ next }: { next: Partial<ComponentProps<typeof Graph3D>> }) {
  const [props, setProps] = useState<Partial<ComponentProps<typeof Graph3D>>>({});
  return (
    <>
      <button type="button" onClick={() => setProps(next)}>
        Change
      </button>
      <Graph3D nodes={nodes} edges={edges} {...props} />
    </>
  );
}

async function change(next: Partial<ComponentProps<typeof Graph3D>>) {
  const app = await setup(() => <ChangingGraph next={next} />, { context: "overview" });
  return { ...app, change: () => app.user.click(screen.getByRole("button", { name: "Change" })) };
}

it("draws the supplied nodes and their labels", async () => {
  const app = await change({ nodes: [{ id: "c", label: "Gamma", category: "Third" }], edges: [] });
  await app.change();
  expect(screen.getByLabelText("Gamma")).toBeVisible();
  expect(screen.queryByLabelText("Alpha")).not.toBeInTheDocument();
});

it("draws only the supplied edges between nodes", async () => {
  const app = await change({ edges: [] });
  const graph = screen.getByRole("img", { name: "Similarity graph" });
  expect(graph.querySelectorAll("path")).toHaveLength(1);
  await app.change();
  expect(graph.querySelectorAll("path")).toHaveLength(0);
});

it("uses confidence to change edge width", async () => {
  const app = await change({ edges: [...edges, { source: "a", target: "b", confidence: 0.1 }] });
  await app.change();
  const widths = Array.from(
    screen.getByRole("img", { name: "Similarity graph" }).querySelectorAll("path"),
    (path) => path.getAttribute("stroke-width"),
  );
  expect(widths[0]).not.toBe(widths[1]);
});

it("dims the whole graph with dim", async () => {
  const app = await change({ dim: 0.35 });
  await app.change();
  expect(screen.getByRole("img", { name: "Similarity graph" }).parentElement).toHaveStyle({
    opacity: "0.35",
  });
});

it("projects a closer framing when zoom increases", async () => {
  const app = await change({ zoom: 2 });
  const radius = () => screen.getByLabelText("Alpha").querySelector("circle")?.getAttribute("r");
  const initial = Number(radius());
  await app.change();
  expect(Number(radius())).toBe(initial * 2);
});

it("shallow-merges spec overrides into both graph renderings", async () => {
  const app = await change({
    spec: { nodeOverrides: { a: { fill: ink("rose", 3), radius: 12 } } },
  });
  const circle = (label: string) => screen.getByLabelText(label).querySelector("circle");
  const alphaBefore = circle("Alpha")?.getAttribute("r");
  const betaBefore = circle("Beta")?.getAttribute("r");
  await app.change();
  expect(circle("Alpha")).toHaveAttribute("fill", ink("rose", 3));
  expect(circle("Alpha")?.getAttribute("r")).not.toBe(alphaBefore);
  expect(circle("Beta")?.getAttribute("r")).toBe(betaBefore);
});

it("shows categories and counts when legend is enabled", async () => {
  const app = await change({ legend: true });
  expect(screen.queryByRole("list", { name: "Graph categories" })).not.toBeInTheDocument();
  await app.change();
  const legend = screen.getByRole("list", { name: "Graph categories" });
  expect(within(legend).getByText("First (1)")).toBeVisible();
  expect(within(legend).getByText("Second (1)")).toBeVisible();
});

it("omits counts when legend.counts is false", async () => {
  const app = await change({ legend: { counts: false, interactive: false } });
  await app.change();
  expect(
    within(screen.getByRole("list", { name: "Graph categories" })).getByText("First"),
  ).toBeVisible();
});

it("counts the color categories when clustering is overridden", async () => {
  const app = await change({ legend: true, spec: { layout: { type: "force" } } });
  await app.change();
  const legend = screen.getByRole("list", { name: "Graph categories" });
  expect(within(legend).getByText("First (1)")).toBeVisible();
  expect(within(legend).getByText("Second (1)")).toBeVisible();
});

it("does not orbit a still even when orbit is true", async () => {
  const app = await change({ orbit: false });
  const node = screen.getByLabelText("Alpha").querySelector("circle");
  const x = node?.getAttribute("cx");
  await advanceFrames();
  expect(node).toHaveAttribute("cx", x);
  await app.change();
  await advanceFrames();
  expect(node).toHaveAttribute("cx", x);
});

it("truncates above the WebGL ceiling to the first nodes and drops dangling edges in the still", async () => {
  // Well above the ceiling (2000 today); if the ceiling is ever raised past this, nothing is
  // truncated and the first assertion says so.
  const count = 5000;
  const many = Array.from({ length: count }, (_, i) => ({
    id: String(i),
    label: `Node ${i}`,
    category: "First",
  }));
  const app = await change({ nodes: many, edges: [{ source: "0", target: String(count - 1) }] });
  await app.change();
  const drawn = screen
    .getAllByLabelText(/^Node \d+$/)
    .map((node) => node.getAttribute("aria-label"));
  expect(drawn.length).toBeLessThan(count);
  expect(drawn).toEqual(many.slice(0, drawn.length).map((node) => node.label));
  expect(
    screen.getByRole("img", { name: "Similarity graph" }).querySelectorAll("path"),
  ).toHaveLength(0);
});

function Inactive() {
  const { isActive } = useSlide();
  return isActive ? null : <Subject />;
}

it("keeps an inactive slide static without attempting WebGL in jsdom", async () => {
  const app = await setup(Inactive);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  expect(screen.getByLabelText("Similarity graph")).toBeInTheDocument();
  expect(screen.getByLabelText("Alpha")).toBeInTheDocument();
  expect(app.container.querySelector("canvas")).toBeNull();
  await advanceFrames();
  expect(app.container.querySelector("canvas")).toBeNull();
});
