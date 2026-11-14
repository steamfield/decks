import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CountUp, Draw, Highlight, Stagger, Step, Steps, TextReveal, useStepState } from "./index";
import { setupMotion, tick } from "./motion.test-support";

function InvalidStep({ until }: { until: number }) {
  useStepState(2, until);
  return null;
}

describe("step primitives", () => {
  it("keeps children mounted and exposes the four states, presets and hidden accessibility", async () => {
    const view = await setupMotion(() => (
      <Step at={1} until={3} enter="rise" exit="drop">
        <button type="button">Evidence</button>
      </Step>
    ));
    const button = screen.getByRole("button", { name: "Evidence", hidden: true });
    const step = button.parentElement;
    expect(step).toHaveAttribute("data-step-state", "before");
    expect(step).toHaveAttribute("data-step-enter", "rise");
    expect(step).toHaveAttribute("data-step-exit", "drop");
    expect(step).toHaveAttribute("aria-hidden", "true");
    expect(step).toHaveAttribute("inert");
    for (const state of ["current", "after", "gone"]) {
      await view.next();
      expect(step).toHaveAttribute("data-step-state", state);
      expect(button).toBeInTheDocument();
      if (state === "gone") {
        expect(step).toHaveAttribute("aria-hidden", "true");
        expect(step).toHaveAttribute("inert");
      } else {
        expect(step).not.toHaveAttribute("aria-hidden");
        expect(step).not.toHaveAttribute("inert");
      }
    }
    await view.previous();
    expect(step).toHaveAttribute("data-step-state", "after");
  });

  it("chooses the requested element and defaults both presets to fade", async () => {
    await setupMotion(() => (
      <Step at={0} as="p">
        Paragraph
      </Step>
    ));
    const step = screen.getByText("Paragraph");
    expect(step.tagName).toBe("P");
    expect(step).toHaveAttribute("data-step-enter", "fade");
    expect(step).toHaveAttribute("data-step-exit", "fade");
  });

  it.each([1, 2])(
    "rejects until %s at or before at through the public step hook",
    async (until) => {
      const view = await setupMotion(() => <InvalidStep until={until} />, { error: true });
      expect(String(view.errors[0])).toContain(String(until));
      expect(screen.getByText("Unable to render slide slide-1.")).toBeVisible();
    },
  );

  it.each(["ul", "ol", "div"] as const)("reveals one child per click in a %s", async (as) => {
    const view = await setupMotion(() => (
      <Steps from={1} as={as} enter="scale">
        {"\n"}
        <span>First</span>
        {"\n  "}
        <span>Second</span>
      </Steps>
    ));
    const first = screen.getByText("First").parentElement;
    const second = screen.getByText("Second").parentElement;
    expect(first?.tagName).toBe(as === "div" ? "DIV" : "LI");
    expect(first).toHaveAttribute("data-step-enter", "scale");
    expect(second).toHaveAttribute("data-step-state", "before");
    await view.next();
    expect(first).toHaveAttribute("data-step-state", "current");
    expect(second).toHaveAttribute("data-step-state", "before");
    await view.next();
    expect(first).toHaveAttribute("data-step-state", "after");
    expect(second).toHaveAttribute("data-step-state", "current");
  });

  it("gives a stagger group one state and an index per child", async () => {
    const view = await setupMotion(() => (
      <Stagger at={1} until={2} as="ul">
        <span>One</span>
        <span>Two</span>
      </Stagger>
    ));
    const list = screen.getByRole("list", { hidden: true });
    expect(list).toHaveAttribute("data-step-state", "before");
    const items = within(list).getAllByRole("listitem", { hidden: true });
    items.forEach((item, index) => {
      expect(item.style.getPropertyValue("--step-index")).toBe(String(index));
    });
    await view.next();
    expect(list).toHaveAttribute("data-step-state", "current");
    await view.next();
    expect(list).toHaveAttribute("data-step-state", "gone");
  });

  it("reveals top-level markdown list items without adding a wrapping list", async () => {
    const view = await setupMotion(() => (
      <Steps from={1} enter="rise">
        {"\n  "}
        <ol aria-label="Agenda" start={3}>
          <li>
            <span>First</span>
            <ul>
              <li>Nested evidence</li>
            </ul>
          </li>
          {"\n"}
          <li>Second</li>
        </ol>
        {"\n"}
      </Steps>
    ));
    const list = screen.getByRole("list", { name: "Agenda" });
    expect(list).toHaveAttribute("start", "3");
    const first = screen.getByText("First").parentElement;
    const second = screen.getByText("Second");
    expect(first?.parentElement).toBe(list);
    expect(second.parentElement).toBe(list);
    expect(first).toHaveAttribute("data-step-state", "before");
    expect(second).toHaveAttribute("data-step-state", "before");
    expect(screen.getByText("Nested evidence")).not.toHaveAttribute("data-step-state");
    await view.next();
    expect(first).toHaveAttribute("data-step-state", "current");
    expect(first).toHaveAttribute("data-step-enter", "rise");
    expect(second).toHaveAttribute("data-step-state", "before");
    await view.next();
    expect(first).toHaveAttribute("data-step-state", "after");
    expect(second).toHaveAttribute("data-step-state", "current");
  });

  it("reveals a combining character and a joined emoji as whole graphemes", async () => {
    await setupMotion(
      () => (
        <TextReveal at={1} by="char">
          {"e\u0301👩‍👩‍👧‍👦"}
        </TextReveal>
      ),
      { click: 1 },
    );
    expect(screen.getByText("e\u0301", { exact: true })).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("👩‍👩‍👧‍👦", { exact: true })).toHaveAttribute("aria-hidden", "true");
  });

  it.each(["word", "char"] as const)(
    "preserves whitespace and exposes the whole text once when revealing by %s",
    async (by) => {
      const text = "Read  this\nnow";
      const view = await setupMotion(() => (
        <TextReveal at={1} by={by}>
          {text}
        </TextReveal>
      ));
      const accessible = screen.getByText(text, { normalizer: (value) => value });
      const root = accessible.parentElement;
      const animated = accessible.nextElementSibling;
      expect(animated?.textContent).toBe(text);
      await view.next();
      expect(root).not.toHaveAttribute("aria-hidden");
      expect(animated).toHaveAttribute("aria-hidden", "true");
      expect(animated?.children).toHaveLength(by === "word" ? 3 : Array.from(text).length);
      Array.from(animated?.children ?? []).forEach((piece, index) => {
        expect(piece).toHaveAttribute("aria-hidden", "true");
        expect(piece).toHaveStyle({ "--step-index": String(index) });
      });
    },
  );

  it("keeps highlighted text accessible before, during and after its sweep", async () => {
    const view = await setupMotion(() => (
      <Highlight at={1} until={2}>
        Essential
      </Highlight>
    ));
    const mark = screen.getByText("Essential");
    expect(mark.tagName).toBe("MARK");
    for (const state of ["before", "current", "gone"]) {
      expect(mark).toHaveAttribute("data-step-state", state);
      expect(mark).not.toHaveAttribute("inert");
      expect(mark).not.toHaveAttribute("aria-hidden");
      if (state !== "gone") await view.next();
    }
  });

  it("normalizes only direct SVG shape children and keeps the group step attributes", async () => {
    await setupMotion(() => (
      <svg role="img" aria-label="Drawing">
        <Draw at={1}>
          <path d="M0 0L1 1" />
          <line />
          <polyline />
          <polygon />
          <circle />
          <ellipse />
          <rect />
          <g>
            <path />
          </g>
          <text>Label</text>
        </Draw>
      </svg>
    ));
    const group = screen.getByRole("img", { name: "Drawing" }).firstElementChild;
    expect(group).toHaveAttribute("data-step-state", "before");
    expect(
      Array.from(group?.children ?? []).map((child) => child.getAttribute("pathLength")),
    ).toEqual(["1", "1", "1", "1", "1", "1", "1", null, null]);
  });

  it("counts live from the initial value and resets immediately backward", async () => {
    const view = await setupMotion(() => <CountUp at={1} to={1200} />);
    const accessible = screen.getAllByText("0").find((node) => !node.hasAttribute("aria-hidden"));
    const root = accessible?.parentElement;
    const animated = accessible?.nextElementSibling;
    expect(root).not.toHaveAttribute("aria-hidden");
    expect(root).not.toHaveAttribute("inert");
    await view.next();
    expect(accessible).toHaveTextContent("1,200");
    await tick(0.15);
    const middle = Number(animated?.textContent?.replaceAll(",", ""));
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(1200);
    await tick(1);
    expect(animated).toHaveTextContent("1,200");
    await view.previous();
    expect(animated).toHaveTextContent("0");
  });

  it.each(["instant", "preview", "presenter", "overview", "print"] as const)(
    "sets formatted count endpoints immediately in %s",
    async (mode) => {
      const view = await setupMotion(
        () => <CountUp at={1} from={10} to={20} format={(n) => `$${Math.round(n)}`} />,
        { context: mode === "instant" ? "slide" : mode },
      );
      if (mode === "instant") document.documentElement.setAttribute("data-deck-motion", "instant");
      await view.next();
      await tick();
      expect(screen.getAllByText("$20")).toHaveLength(2);
      await view.previous();
      expect(screen.getAllByText("$10")).toHaveLength(2);
    },
  );

  it("seeks a directly loaded count to its final value without replaying entry", async () => {
    await setupMotion(() => <CountUp at={1} to={1200} />, { click: 1 });
    expect(screen.getAllByText("1,200")).toHaveLength(2);
  });

  it("throws when a step is rendered outside a SlideHost", () => {
    expect(() => render(<Step at={1}>Orphan</Step>)).toThrow(/SlideHost/);
  });
});
