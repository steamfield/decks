import { act, screen } from "@testing-library/react";
import { type Ref, useImperativeHandle, useRef } from "react";
import { describe, expect, it } from "vitest";
import { type gsap, useTimeline, useTween } from "./index";
import { setupMotion, tick } from "./motion.test-support";

function TimelineProbe({
  extent = 100,
  built,
}: {
  extent?: number;
  built?: (value: { x: number }) => void;
}) {
  const value = useTween({ x: 0 });
  useTimeline(
    (tl, beat) => {
      built?.(value);
      beat(0);
      for (let n = 1; n <= 3; n++) {
        tl.to(value, { x: extent * n, duration: 0.6, ease: "none" });
        beat(n);
      }
    },
    [extent, value],
  );
  return <output>{value.x.toFixed(1)}</output>;
}

function Handle({ ref }: { ref: Ref<{ x: number }> }) {
  useImperativeHandle(ref, () => ({ x: 0 }), []);
  return null;
}
function RefProbe() {
  const ref = useRef<{ x: number }>(null);
  const value = useTween({ x: 0 });
  useTimeline((tl, beat) => {
    if (!ref.current) throw new Error("Missing child handle");
    beat(0);
    tl.to(value, { x: ref.current.x + 100, duration: 0.6 });
    beat(1);
  });
  return (
    <>
      <Handle ref={ref} />
      <output>{value.x}</output>
    </>
  );
}

function InvalidTimeline({
  build,
}: {
  build: (tl: gsap.core.Timeline, beat: (n: number) => void) => void;
}) {
  useTimeline(build);
  return null;
}
function number() {
  return Number(screen.getByRole("status").textContent);
}

describe("useTimeline", () => {
  it("builds after child imperative handles exist and seeks the initial click", async () => {
    await setupMotion(RefProbe, { click: 1 });
    await tick();
    expect(number()).toBe(100);
  });

  it.each([
    ["beat1", (_tl: gsap.core.Timeline, beat: (n: number) => void) => beat(1)],
    [
      "beat2",
      (_tl: gsap.core.Timeline, beat: (n: number) => void) => {
        beat(0);
        beat(2);
      },
    ],
    [
      "beat0",
      (_tl: gsap.core.Timeline, beat: (n: number) => void) => {
        beat(0);
        beat(0);
      },
    ],
    ["beat0", () => {}],
    [
      "beat0",
      (tl: gsap.core.Timeline, beat: (n: number) => void) => {
        tl.to({ x: 0 }, { x: 1 });
        beat(0);
      },
    ],
  ] as const)("rejects an invalid build naming %s", async (label, build) => {
    const view = await setupMotion(() => <InvalidTimeline build={build} />, { error: true });
    expect(view.errors.length).toBeGreaterThan(0);
    expect(String(view.errors[0])).toContain(label);
    expect(screen.getByText("Unable to render slide slide-1.")).toBeVisible();
  });

  it("seeks jumps and clamps clicks beyond the final label", async () => {
    const view = await setupMotion(TimelineProbe);
    act(() => view.store.dispatch({ type: "go", slide: 1, click: 2 }));
    await tick();
    expect(number()).toBe(200);
    act(() => view.store.dispatch({ type: "go", slide: 1, click: 5 }));
    await tick();
    expect(number()).toBe(300);
  });

  it.each(["preview", "presenter", "overview", "print", "instant"] as const)(
    "seeks adjacent clicks in %s",
    async (mode) => {
      const view = await setupMotion(TimelineProbe, {
        context: mode === "instant" ? "slide" : mode,
      });
      if (mode === "instant") document.documentElement.setAttribute("data-deck-motion", "instant");
      await view.next();
      await tick();
      expect(number()).toBe(100);
    },
  );

  it("tweens adjacent clicks forward and backward on the active slide", async () => {
    const view = await setupMotion(TimelineProbe);
    await view.next();
    await tick(0.3);
    expect(number()).toBeGreaterThan(0);
    expect(number()).toBeLessThan(100);
    await tick(0.4);
    expect(number()).toBe(100);
    await view.previous();
    await tick(0.3);
    expect(number()).toBeGreaterThan(0);
    expect(number()).toBeLessThan(100);
    await tick(0.4);
    expect(number()).toBe(0);
  });

  it.each(["forward", "backward"] as const)(
    "retargets interrupted %s travel from the visible pose within one beat",
    async (direction) => {
      const view = await setupMotion(TimelineProbe, { click: direction === "forward" ? 0 : 3 });
      await tick();
      const move = direction === "forward" ? view.next : view.previous;
      await move();
      await tick(0.06);
      const visible = number();
      await move();
      await tick();
      expect(number()).toBe(visible);
      await tick(0.61);
      expect(number()).toBe(direction === "forward" ? 200 : 100);
    },
  );

  it("seeks when the slide becomes inactive while travel is running", async () => {
    const view = await setupMotion(TimelineProbe);
    await view.next();
    await tick(0.1);
    act(() => view.store.dispatch({ type: "nextSlide" }));
    await tick();
    expect(screen.getByRole("status", { hidden: true })).toHaveTextContent("300.0");
  });

  it("kills and rebuilds on changed deps and seeks after the rebuild", async () => {
    let extent = 100;
    const builds: { x: number }[] = [];
    const view = await setupMotion(() => (
      <TimelineProbe extent={extent} built={(value) => builds.push(value)} />
    ));
    await view.next();
    await tick(0.1);
    extent = 200;
    await view.next();
    await tick();
    expect(number()).toBe(400);
    expect(builds).toHaveLength(2);
    await tick(1);
    expect(number()).toBe(400);
  });

  it("kills travel and its timeline when the owning slide unmounts", async () => {
    const values: { x: number }[] = [];
    const view = await setupMotion(() => <TimelineProbe built={(value) => values.push(value)} />);
    await view.next();
    await tick(0.1);
    view.unmount();
    const stopped = values[0]?.x;
    await tick(2);
    expect(values[0]?.x).toBe(stopped);
  });
});
