import type { ChartSpec, LayerSpec } from "@opendata-ai/openchart-react";
import { mountDeck, type RenderContext, SlideHost, useSlide } from "@react-decks/runtime";
import { act, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, onTestFinished, vi } from "vitest";
import { advance, setup } from "../kit.test-support";
import { ChartSteps } from "./chart-steps";
import { OpenChart } from "./open-chart";

function bar(value: number) {
  return {
    width: 600,
    height: 400,
    mark: { type: "bar", cornerRadius: 0 },
    data: [
      { name: "A", value },
      { name: "Low", value: 20 },
      { name: "High", value: 80 },
    ],
    encoding: {
      x: { field: "name", type: "nominal" },
      y: { field: "value", type: "quantitative", scale: { domain: [0, 100] } },
    },
    animation: { enter: false, update: { duration: 800 } },
  } satisfies ChartSpec;
}

const specs = [bar(20), bar(80), bar(50)];

class FixedSizeObserver {
  observe() {}
  disconnect() {}
}

function Content({ context, chart }: { context: RenderContext; chart: ReactNode }) {
  const slide = useSlide();
  if (slide.renderContext === "slide" && context !== "slide") {
    return <SlideHost no={1} clicks={slide.clicks} context={context} />;
  }
  return chart;
}

async function show(
  chart: ReactNode = <ChartSteps specs={specs} at={1} />,
  {
    click = 0,
    instant = false,
    context = "slide",
  }: {
    click?: number;
    instant?: boolean;
    context?: RenderContext;
  } = {},
) {
  // jsdom has no resize observer. The specs declare their own width and height.
  vi.stubGlobal("ResizeObserver", FixedSizeObserver);
  vi.useFakeTimers();
  window.history.replaceState(null, "", `/${instant ? "?motion=instant" : ""}#/1?clicks=${click}`);
  const root = document.createElement("div");
  document.body.append(root);
  let unmount = () => {};
  onTestFinished(async () => {
    await act(async () => unmount());
    root.remove();
    window.history.replaceState(null, "", "/");
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  await act(async () => {
    unmount = mountDeck(
      {
        manifest: {
          name: "steps",
          title: "Chart",
          canvas: { width: 1920, height: 1080 },
          slides: [{ no: 1, id: "chart", file: "chart.mdx", title: "Chart", clicks: 3 }],
        },
        slides: {
          chart: async () => ({ default: () => <Content context={context} chart={chart} /> }),
        },
        frontmatter: {},
        components: {},
      },
      root,
    );
  });
  return (click: number) =>
    act(async () => {
      window.history.pushState(null, "", `#/1?clicks=${click}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
}

function height(name = "A") {
  const height = screen
    .getByRole("img")
    .querySelector(`rect[data-name="${name}"]`)
    ?.getAttribute("height");
  if (!height) throw new Error(`Missing bar height for ${name}`);
  return Number(height);
}

it("shows specs[0] before click at and specs[i] from click at plus i minus 1", async () => {
  const go = await show(<ChartSteps specs={specs} at={2} />);
  for (const [click, value] of [20, 20, 80, 50].entries()) {
    await go(click);
    expect(screen.getByLabelText(`A: ${value}`)).toBeInTheDocument();
  }
});

it.each([
  [
    "one click forward in the live slide moves marks through the update phase on the same chart",
    0,
    1,
    "High",
  ],
  ["one click back animates the same way", 1, 0, "Low"],
] as const)("%s", async (_name, from, to, target) => {
  const go = await show(undefined, { click: from });
  await go(to);
  await advance(0.4);
  expect(height()).toBeGreaterThan(height("Low"));
  expect(height()).toBeLessThan(height("High"));
  await advance(0.5);
  expect(height()).toBe(height(target));
});

it("a jump of two clicks renders the target spec with no tween", async () => {
  const go = await show(<ChartSteps specs={[bar(20), bar(50), bar(80)]} at={1} />);
  await go(2);
  expect(height()).toBe(height("High"));
});

it("a jump to the same spec interrupts the in-flight update", async () => {
  const go = await show(<ChartSteps specs={[bar(20), bar(80)]} at={1} />);
  await go(1);
  await advance(0.4);
  await go(3);
  expect(height()).toBe(height("High"));
});

function compact(value: number) {
  return {
    ...bar(value),
    width: 320,
    overrides: { compact: { animation: { enter: false, update: { duration: 1200 } } } },
  };
}

it("motion instant renders the click's spec with no tween", async () => {
  const go = await show(<ChartSteps specs={[compact(20), compact(80)]} at={1} />, {
    instant: true,
  });
  await go(1);
  expect(height()).toBe(height("High"));
});

it.each(["presenter", "preview", "overview", "print"] as const)(
  "the presenter, preview, overview and print contexts render the click's spec with no tween (%s)",
  async (context) => {
    const go = await show(undefined, { context });
    await go(1);
    expect(height()).toBe(height("High"));
  },
);

it("a step during the entrance snaps to the new spec", async () => {
  const entrance = { ...bar(20), animation: { enter: { duration: 1000 } } };
  const go = await show(<ChartSteps specs={[entrance, bar(80)]} at={1} />);
  await go(1);
  expect(height()).toBe(height("High"));
});

async function invalid(input: readonly (ChartSpec | LayerSpec)[], at: number, message: string) {
  const result = await setup(() => <ChartSteps specs={input} at={at} />, { error: true });
  expect(result.errors).toEqual([new Error(message)]);
  result.unmount();
}

it("throws naming both indices when two specs differ in mark type", async () => {
  await invalid(
    [bar(20), bar(30), { ...bar(40), mark: "line" }],
    1,
    "ChartSteps specs[1] and specs[2] differ in mark type (bar vs line); a step can only morph data",
  );
});

it("throws naming both indices and the channel when an encoding field or type differs", async () => {
  for (const channel of ["x", "y", "color", "key"] as const) {
    for (const property of ["field", "type"] as const) {
      const base = bar(20);
      const encoding = { ...base.encoding, [channel]: { field: "name", type: "nominal" } };
      const from = { ...base, encoding };
      const next = property === "field" ? "group" : "ordinal";
      const to = {
        ...base,
        encoding: { ...encoding, [channel]: { field: "name", type: "nominal", [property]: next } },
      };
      await invalid(
        [{ layer: [from] }, { layer: [from] }, { layer: [to] }],
        1,
        `ChartSteps specs[1] and specs[2] differ in ${channel} encoding ${property} (${property === "field" ? "name" : "nominal"} vs ${next}); a step can only morph data`,
      );
    }
  }
});

it("lets OpenChart snap when a matching chart gains a layer", async () => {
  const layers = [{ layer: [bar(20)] }, { layer: [bar(80), bar(50)] }];
  const go = await show(<ChartSteps specs={layers} at={1} />);
  await go(1);
  expect(screen.getByLabelText("A: 80")).toBeInTheDocument();
});

it("throws on an empty specs array, on at below 1 and on a fractional at", async () => {
  await invalid([], 1, "ChartSteps specs must contain at least one spec, got []");
  await invalid(specs, 0, "ChartSteps at must be at least 1, got 0");
  await invalid(specs, 1.5, "at must be a positive whole number, got 1.5");
});

function settlement() {
  if (!window.__deck) throw new Error("Deck did not mount");
  let done = false;
  void window.__deck.settled().then(() => {
    done = true;
  });
  return () => done;
}

it("settled waits for a step's update phase", async () => {
  const go = await show(<ChartSteps specs={[compact(20), compact(80)]} at={1} />);
  await go(1);
  const done = settlement();
  await advance(1.1);
  expect(done()).toBe(false);
  await advance(0.2);
  expect(done()).toBe(true);
});

it("settled waits for the update even when the first animation frame is delayed", async () => {
  const go = await show();
  const frame = window.requestAnimationFrame;
  window.requestAnimationFrame = (fn) => window.setTimeout(() => frame(fn), 1000);
  let done: () => boolean;
  try {
    await go(1);
    done = settlement();
    await Promise.resolve();
  } finally {
    window.requestAnimationFrame = frame;
  }
  await advance(1.2);
  expect(done()).toBe(false);
  await advance(0.8);
  expect(done()).toBe(true);
});

it("settled waits for a removed bar whose exit outlasts the update", async () => {
  const first = bar(20);
  const second = {
    ...bar(80),
    data: bar(80).data.filter((row) => row.name !== "Low"),
    animation: { update: { duration: 100 }, exit: { duration: 900 } },
  };
  const go = await show(<ChartSteps specs={[first, second]} at={1} />);
  const initial = height("Low");
  await go(1);
  const done = settlement();
  await advance(0.5);
  expect(height("Low")).toBeGreaterThan(0);
  expect(height("Low")).toBeLessThan(initial);
  expect(done()).toBe(false);
  await advance(0.5);
  expect(done()).toBe(true);
  await go(0);
  await advance(0.5);
  expect(height("Low")).toBeGreaterThan(0);
  expect(height("Low")).toBeLessThan(initial);
});

it("OpenChart alone still enters on arrival and never remounts on a click", async () => {
  const go = await show(
    <OpenChart spec={{ ...bar(20), animation: { enter: { duration: 1000 } } }} />,
  );
  const chart = screen.getByRole("img");
  const done = settlement();
  await advance(0.5);
  expect(done()).toBe(false);
  await advance(0.65);
  expect(done()).toBe(true);
  document.documentElement.setAttribute("data-deck-motion", "instant");
  await go(1);
  expect(screen.getByRole("img")).toBe(chart);
});
