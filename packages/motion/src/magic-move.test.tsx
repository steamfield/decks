import { toKeyedTokens } from "@shikijs/magic-move/core";
import { screen } from "@testing-library/react";
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

  it.each(["slide", "presenter", "preview", "overview", "print"] as const)(
    "renders the initial %s instance at its click without animation",
    async (context) => {
      await setupMotion(Subject, { click: 3, context });
      const figure = screen.getByRole("figure");
      expect(figure.textContent).toBe("example.tssecondextra");
      // The real renderer writes --smm-duration only when animate=true invokes render().
      expect(figure.querySelector("pre")?.style.getPropertyValue("--smm-duration")).toBe("");
    },
  );
});
