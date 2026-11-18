import type { Page } from "playwright-core";
import { DeckError } from "./errors";

interface LayoutFinding {
  kind: "outside" | "clipped";
  pixels: number;
  side: "left" | "right" | "top" | "bottom";
  selector: string;
  excerpt: string;
}

export async function layoutFindings(
  page: Page,
  slideNo: number,
  expectedHash: string,
): Promise<LayoutFinding[]> {
  const result = await page.evaluate<LayoutFinding[] | string>(String.raw`(() => {
    const expectedHash = ${JSON.stringify(expectedHash)};
    if (location.hash !== expectedHash)
      return "Expected " + expectedHash + ", but the deck settled at " + (location.hash || "an empty hash") + ".";
    const canvas = document.querySelector("#deck-frame");
    const slide = canvas?.querySelector('[data-deck-slide="${slideNo}"][data-deck-active]');
    if (!canvas || !slide) return "The requested slide is missing from the canvas.";
    const frame = canvas.getBoundingClientRect();
    const findings = [];

    function hasEmptyClip(element, clip, bounds) {
      if (!clip.startsWith("rect(")) return false;
      const [top, right, bottom, left] = clip.slice(5, -1).split(/,\s*/);
      // Legacy clip resolves auto to the corresponding border-box edge.
      const xStart = left === "auto" ? 0 : parseFloat(left);
      const yStart = top === "auto" ? 0 : parseFloat(top);
      const xEnd = right === "auto" ? (element.offsetWidth ?? bounds.width) : parseFloat(right);
      const yEnd = bottom === "auto" ? (element.offsetHeight ?? bounds.height) : parseFloat(bottom);
      return xEnd <= xStart || yEnd <= yStart;
    }

    function visit(element, ancestorReported) {
      if (element.matches('[data-deck-layer="above"], [data-deck-layer="credit"]')) return;
      if (element.getAttribute("aria-hidden") === "true" && !element.textContent?.trim()) return;
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      const tinyClippedBox =
        style.display !== "contents" &&
        bounds.width <= 1 && bounds.height <= 1 &&
        (style.overflowX !== "visible" || style.overflowY !== "visible");
      if (tinyClippedBox || style.clipPath === "inset(50%)" || hasEmptyClip(element, style.clip, bounds))
        return;

      let reported = ancestorReported;
      if (element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
        let outside;
        if (!ancestorReported && bounds.width > 0 && bounds.height > 0) {
          const edges = [
            { side: "left", pixels: frame.left - bounds.left },
            { side: "right", pixels: bounds.right - frame.right },
            { side: "top", pixels: frame.top - bounds.top },
            { side: "bottom", pixels: bounds.bottom - frame.bottom },
          ];
          outside = edges.reduce((largest, edge) =>
            edge.pixels > largest.pixels ? edge : largest,
          );
        }
        const extendsCanvas = outside && outside.pixels > 1;
        const horizontal =
          style.overflowX === "visible" ? 0 : element.scrollWidth - element.clientWidth;
        const bottom =
          style.overflowY === "visible" ? 0 : element.scrollHeight - element.clientHeight;
        const clipped = Math.max(horizontal, bottom);

        if (extendsCanvas || clipped > 1) {
          const text = (element instanceof HTMLElement ? element.innerText : element.textContent)
            ?.trim()
            .replace(/\s+/g, " ") ?? "";
          const characters = [...text];
          const excerpt = characters.length > 40 ? characters.slice(0, 39).join("") + "…" : text;
          const tag = element.localName;
          const firstClass = element.classList.item(0);
          const selector = firstClass ? tag + "." + CSS.escape(firstClass) : tag;
          if (extendsCanvas) {
            findings.push({ kind: "outside", ...outside, selector, excerpt });
            reported = true;
          }
          if (clipped > 1 && text) {
            const inlineEnd = style.direction === "rtl" ? "left" : "right";
            findings.push({
              kind: "clipped",
              pixels: clipped,
              side: horizontal > bottom ? inlineEnd : "bottom",
              selector,
              excerpt,
            });
            reported = true;
          }
        }
      }
      if (element.localName === "svg") return;
      for (const child of element.children) visit(child, reported);
    }

    visit(slide, false);
    return findings;
  })()`);
  if (typeof result === "string") throw new DeckError(result);
  return result;
}
