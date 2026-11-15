import { mountDeck } from "@react-decks/runtime";
import { act, screen } from "@testing-library/react";
import { expect, it, onTestFinished, vi } from "vitest";
import { advance } from "../kit.test-support";
import { useChartEntrance } from "./chart-entrance";

const ANIMATION = { enter: { duration: 900 }, annotationDelay: 350 };
// Declared in milliseconds, advanced in seconds.
const TOTAL = (ANIMATION.enter.duration + ANIMATION.annotationDelay) / 1000;

function Animated() {
  useChartEntrance(ANIMATION, true, 1);
  return <p>Animated chart</p>;
}
function Static() {
  useChartEntrance(ANIMATION, false, 1);
  return <p>Static chart</p>;
}

it.each([true, false])(
  "bounds settlement by the declared duration when enabled is %s",
  async (enabled) => {
    vi.useFakeTimers();
    const root = document.createElement("div");
    document.body.append(root);
    let unmount = () => {};
    onTestFinished(async () => {
      await act(async () => unmount());
      root.remove();
      vi.useRealTimers();
    });
    await act(async () => {
      unmount = mountDeck(
        {
          manifest: {
            name: "chart-bound",
            title: "Chart",
            canvas: { width: 1920, height: 1080 },
            slides: [{ no: 1, id: "chart", file: "chart.mdx", title: "Chart", clicks: 0 }],
          },
          slides: { chart: async () => ({ default: enabled ? Animated : Static }) },
          frontmatter: {},
          components: {},
        },
        root,
      );
    });
    expect(screen.getByText(enabled ? "Animated chart" : "Static chart")).toBeVisible();
    let complete = false;
    const completion = window.__deck?.settled().then(() => {
      complete = true;
    });
    await advance(TOTAL / 2);
    expect(complete).toBe(!enabled);
    await advance(TOTAL);
    await completion;
    expect(complete).toBe(true);
  },
);
