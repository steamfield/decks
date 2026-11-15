import { render, screen } from "@testing-library/react";
import { StrictMode, useLayoutEffect } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { gsap, motionMode, useTween } from "./index";
import { advance, tick } from "./motion.test-support";

function TweenProbe({
  initial,
  commit,
}: {
  initial: { x: number; y: number };
  commit: (value: { x: number; y: number }) => void;
}) {
  const value = useTween(initial);
  useLayoutEffect(() => {
    commit(value);
  });
  return (
    <output>
      {value.x}/{value.y}
    </output>
  );
}

function LayoutWriteProbe() {
  const value = useTween({ x: 0 });
  useLayoutEffect(() => {
    value.x = 100;
  }, [value]);
  return <output>{value.x}</output>;
}

describe("useTween", () => {
  it("renders a layout-effect write before yielding to async publication", () => {
    render(<LayoutWriteProbe />);
    expect(screen.getByRole("status")).toHaveTextContent("100");
  });
  it("keeps a mount's layout write through StrictMode's subscription cleanup", async () => {
    render(
      <StrictMode>
        <LayoutWriteProbe />
      </StrictMode>,
    );
    await tick();
    expect(screen.getByRole("status")).toHaveTextContent("100");
  });
  it("copies initial fields and preserves object identity across renders", async () => {
    const initial = { x: 0, y: 0 };
    const values: { x: number; y: number }[] = [];
    const commit = (value: { x: number; y: number }) => {
      values.push(value);
    };
    const view = render(<TweenProbe initial={initial} commit={commit} />);
    view.rerender(<TweenProbe initial={{ x: 7, y: 8 }} commit={commit} />);
    expect(values[0]).toBe(values[1]);
    expect(values[0]).not.toBe(initial);
    expect(screen.getByRole("status")).toHaveTextContent("0/0");
  });

  it("publishes several changed numeric fields once on the real ticker and stays idle when unchanged", async () => {
    const commits: string[] = [];
    const values: { x: number; y: number }[] = [];
    render(
      <TweenProbe
        initial={{ x: 0, y: 0 }}
        commit={(value) => {
          values.push(value);
          commits.push(`${value.x}/${value.y}`);
        }}
      />,
    );
    const value = values[0];
    if (!value) throw new Error("Missing tween value");
    value.x = 1;
    value.y = 2;
    expect(screen.getByRole("status")).toHaveTextContent("0/0");
    await tick();
    expect(screen.getByRole("status")).toHaveTextContent("1/2");
    expect(commits).toEqual(["0/0", "1/2"]);
    value.x = 1;
    await tick();
    await tick();
    expect(commits).toEqual(["0/0", "1/2"]);
    value.x = 3;
    value.y = 4;
    await tick();
    expect(screen.getByRole("status")).toHaveTextContent("3/4");
    expect(commits).toEqual(["0/0", "1/2", "3/4"]);
  });

  it("ignores added fields and publishes real GSAP tween updates", async () => {
    const commits: number[] = [];
    const values: { x: number; y: number }[] = [];
    render(
      <TweenProbe
        initial={{ x: 0, y: 0 }}
        commit={(value) => {
          values.push(value);
          commits.push(value.x);
        }}
      />,
    );
    const value = values[0];
    if (!value) throw new Error("Missing tween value");
    Reflect.set(value, "extra", 99);
    await tick();
    expect(commits).toEqual([0]);
    const tween = gsap.to(value, { x: 100, duration: 1, ease: "none" });
    onTestFinished(() => {
      tween.kill();
    });
    await tick(0.5);
    expect(Number(screen.getByRole("status").textContent?.split("/")[0])).toBe(50);
    await tick(0.6);
    expect(screen.getByRole("status")).toHaveTextContent("100/0");
  });

  it("publishes timer writes together with the tween's halfway pose", async () => {
    const values: { x: number; y: number }[] = [];
    render(<TweenProbe initial={{ x: 0, y: 0 }} commit={(value) => values.push(value)} />);
    const value = values[0];
    if (!value) throw new Error("Missing tween value");
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const tween = gsap.to(value, { x: 100, duration: 1, ease: "none" });
    onTestFinished(() => {
      tween.kill();
    });
    setTimeout(() => {
      value.y = 7;
    }, 500);
    await advance(0.5);
    expect(screen.getByRole("status")).toHaveTextContent("50/7");
    await advance(0.5);
    expect(screen.getByRole("status")).toHaveTextContent("100/7");
  });

  it("keeps pending writes safe when its owner unmounts", async () => {
    const commits: number[] = [];
    const values: { x: number; y: number }[] = [];
    const view = render(
      <TweenProbe
        initial={{ x: 0, y: 0 }}
        commit={(value) => {
          values.push(value);
          commits.push(value.x);
        }}
      />,
    );
    const value = values[0];
    if (!value) throw new Error("Missing tween value");
    value.x = 1;
    view.unmount();
    await tick();
    expect(commits).toEqual([0]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("reads live only from an explicit live DOM setting", async () => {
    const previous = document.documentElement.getAttribute("data-deck-motion");
    onTestFinished(() => {
      if (previous === null) document.documentElement.removeAttribute("data-deck-motion");
      else document.documentElement.setAttribute("data-deck-motion", previous);
    });
    document.documentElement.removeAttribute("data-deck-motion");
    expect(motionMode()).toBe("instant");
    document.documentElement.setAttribute("data-deck-motion", "live");
    expect(motionMode()).toBe("live");
    document.documentElement.setAttribute("data-deck-motion", "instant");
    expect(motionMode()).toBe("instant");
    document.documentElement.removeAttribute("data-deck-motion");
  });
});
