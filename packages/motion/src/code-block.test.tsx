import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "./index";
import { setupMotion } from "./motion.test-support";

function Block({ at = 0, steps = '[[2],[4,5],"all","none"]' }: { at?: number; steps?: string }) {
  return (
    <CodeBlock data-at={at} data-steps={steps} data-title="store.ts" data-lines={10}>
      <code>
        {[1, 2, 3, 4, 5].map((line) => (
          <span key={line} data-line={line}>
            <span style={{ color: "var(--shiki-token-keyword)" }}>Line {line}</span>
          </span>
        ))}
      </code>
    </CodeBlock>
  );
}

function states() {
  return [1, 2, 3, 4, 5].map((line) =>
    screen.getByText(`Line ${line}`).parentElement?.getAttribute("data-line-state"),
  );
}

describe("CodeBlock", () => {
  it("marks compiled lines forward and backward while preserving tokens and caption", async () => {
    const view = await setupMotion(Block);
    expect(screen.getByRole("figure")).toHaveTextContent("store.ts");
    expect(states()).toEqual(["dim", "active", "dim", "dim", "dim"]);
    expect(screen.getByText("Line 1").style.color).toBe("var(--shiki-token-keyword)");
    await view.next();
    expect(states()).toEqual(["dim", "dim", "dim", "active", "active"]);
    await view.next();
    expect(states()).toEqual(Array(5).fill("active"));
    await view.next();
    expect(states()).toEqual(Array(5).fill("dim"));
    await view.previous();
    expect(states()).toEqual(Array(5).fill("active"));
    await view.previous();
    expect(states()).toEqual(["dim", "dim", "dim", "active", "active"]);
  });

  it("leaves every line unmarked before at and when there are no steps", async () => {
    const view = await setupMotion(() => <Block at={1} />);
    expect(states()).toEqual(Array(5).fill(null));
    await view.next();
    expect(states()).toEqual(["dim", "active", "dim", "dim", "dim"]);
    await view.previous();
    expect(states()).toEqual(Array(5).fill(null));
  });

  it.each(["slide", "presenter", "preview", "overview", "print"] as const)(
    "loads the last applicable step directly in %s without ids",
    async (context) => {
      const view = await setupMotion(Block, { click: 4, context });
      expect(states()).toEqual(Array(5).fill("dim"));
      expect(view.container.querySelector("figure [id]")).toBeNull();
    },
  );

  it("keeps a block without steps fully visible at every click", async () => {
    const view = await setupMotion(() => <Block steps="[]" />);
    expect(states()).toEqual(Array(5).fill(null));
    await view.next();
    expect(states()).toEqual(Array(5).fill(null));
  });
});
