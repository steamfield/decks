import { screen } from "@testing-library/react";
import { cloneElement } from "react";
import { describe, expect, it } from "vitest";
import { Mark, type MarkKind } from "./index";
import { setupMotion } from "./motion.test-support";

const kinds: MarkKind[] = ["underline", "circle", "box", "strike", "cross", "bracket"];

describe("Mark", () => {
  it("keeps text accessible through all four click states and backward navigation", async () => {
    const view = await setupMotion(() => (
      <Mark at={1} until={3}>
        <button type="button">Evidence</button>
      </Mark>
    ));
    for (const state of ["before", "current", "after", "gone"]) {
      const text = screen.getByRole("button", { name: "Evidence" });
      const root = text.parentElement;
      expect(text).toBeVisible();
      expect(root).toHaveAttribute("data-step-state", state);
      expect(root).toHaveAttribute("data-step-enter", "fade");
      expect(root).toHaveAttribute("data-step-exit", "fade");
      expect(root).not.toHaveAttribute("aria-hidden");
      expect(root).not.toHaveAttribute("inert");
      if (state !== "gone") await view.next();
    }
    await view.previous();
    expect(screen.getByRole("button", { name: "Evidence" }).parentElement).toHaveAttribute(
      "data-step-state",
      "after",
    );
  });

  it("every kind, and the default, leaves text readable without paths before measurement", async () => {
    await setupMotion(() => (
      <>
        <Mark at={1}>Default</Mark>
        {kinds.map((kind) => (
          <Mark key={kind} kind={kind} at={1}>
            {`Evidence ${kind}`}
          </Mark>
        ))}
      </>
    ));
    for (const name of ["Default", ...kinds.map((kind) => `Evidence ${kind}`)]) {
      const root = screen.getByText(name);
      expect(root).toBeVisible();
      expect(root.querySelectorAll("path")).toHaveLength(0);
    }
  });

  it("rejects an unknown kind naming the offending value", async () => {
    const view = await setupMotion(
      () => cloneElement<{ kind: string }>(<Mark at={1} />, { kind: "squiggle" }),
      { error: true },
    );
    expect(view.errors[0]).toBeInstanceOf(Error);
    expect(view.errors[0]).toHaveProperty("message", 'Unknown Mark kind "squiggle"');
  });
});
