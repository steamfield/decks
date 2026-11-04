// @vitest-environment node
// What the server sends for a copy block: the commands as text and a hidden copy button,
// which src/scripts/site.ts wires (site.test.ts covers the wiring).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import CopyBlock from "./CopyBlock.astro";

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  const window = new Window();
  window.document.body.innerHTML = await container.renderToString(CopyBlock, { props });
  return window.document;
}

const lines = ["bun add -d slidev-addon-decks", "bunx -p slidev-addon-decks decks init talk"];

describe("CopyBlock", () => {
  it("renders every command line with a hidden, labelled copy button", async () => {
    const doc = await render({ lines, label: "Copy the install commands" });
    const button = doc.querySelector("button");
    expect(button?.hidden).toBe(true);
    expect(button?.getAttribute("aria-label")).toBe("Copy the install commands");
    expect(button?.textContent?.trim()).toBe("Copy");
    const shown = doc.querySelector("pre")?.textContent ?? "";
    // The "$ " prompts are drawn but never copied; the screenshots cover how they look.
    expect(shown).toContain(lines[0]);
    expect(shown).toContain(lines[1]);
  });

  it("keeps each word of a command unbroken", async () => {
    const doc = await render({ lines: ["bunx -p slidev-addon-decks"], label: "Copy" });
    const words = [...doc.querySelectorAll("pre .whitespace-nowrap")].map((n) => n.textContent);
    expect(words).toEqual(["bunx", "-p", "slidev-addon-decks"]);
  });
});
