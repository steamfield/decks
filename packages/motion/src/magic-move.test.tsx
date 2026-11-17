import type { RenderContext } from "@react-decks/runtime";
import { toKeyedTokens } from "@shikijs/magic-move/core";
import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MagicMove } from "./magic-move";
import { setupMotion } from "./motion.test-support";

function Subject() {
  const steps = ["first", "second\nextra", "third"].map((code) =>
    toKeyedTokens(
      code,
      code.split("\n").map((content, offset) => [{ content, offset }]),
    ),
  );
  return (
    <MagicMove
      steps={JSON.stringify(steps)}
      ranges={JSON.stringify([[[1]], [[1], [2], "all"], []])}
      at="1"
      title="example.ts"
    />
  );
}

describe("magic move", () => {
  it("shows each click's code and range, before at, forward and back", async () => {
    const app = await setupMotion(Subject);
    document.documentElement.setAttribute("data-deck-motion", "instant");
    const figure = screen.getByRole("figure");
    const states = () =>
      Array.from(figure.querySelectorAll("[data-line]"), (node) =>
        node.getAttribute("data-line-state"),
      );
    expect(figure.textContent).toBe("example.tsfirst");
    expect(states()).toEqual([null]);
    await app.next();
    expect(states()).toEqual(["active"]);
    await app.next();
    expect(figure.textContent).toBe("example.tssecondextra");
    expect(states()).toEqual(["active", "dim"]);
    await app.next();
    expect(states()).toEqual(["dim", "active"]);
    await app.next();
    expect(states()).toEqual(["active", "active"]);
    await app.next();
    expect(figure.textContent).toBe("example.tsthird");
    expect(states()).toEqual([null]);
    await app.previous();
    expect(figure.textContent).toBe("example.tssecondextra");
    expect(states()).toEqual(["active", "active"]);
  });

  // The real renderer writes --smm-duration only when a step change goes through its animated
  // render(); the instant path leaves it unset, so it is the duration a viewer would get.
  async function stepForward(context: RenderContext, motion?: "instant") {
    const app = await setupMotion(Subject, { click: 1, context });
    const figure = screen.getByRole("figure");
    expect(figure.textContent).toBe("example.tsfirst");
    // After mount: the deck sets the attribute itself on mount, and setupMotion restores it.
    if (motion) document.documentElement.setAttribute("data-deck-motion", motion);
    await act(async () => app.store.dispatch({ type: "next" }));
    return figure;
  }
  const duration = (figure: HTMLElement) =>
    figure.querySelector("pre")?.style.getPropertyValue("--smm-duration");

  it("a forward click in the live slide takes the animated path", async () => {
    const figure = await stepForward("slide");
    await waitFor(() => expect(duration(figure)).not.toBe(""));
  });

  it("a forward click with motion instant shows the next step without animating", async () => {
    const figure = await stepForward("slide", "instant");
    await waitFor(() => expect(figure.textContent).toBe("example.tssecondextra"));
    expect(duration(figure)).toBe("");
  });

  it.each(["presenter", "preview", "overview", "print"] as const)(
    "a forward click in the %s context shows the next step without animating",
    async (context) => {
      const figure = await stepForward(context);
      await waitFor(() => expect(figure.textContent).toBe("example.tssecondextra"));
      expect(duration(figure)).toBe("");
    },
  );
});
