// Characterization of the page script: reveals, the TOC highlight, copy buttons, copy page
// and the theme toggle. site.ts sets everything up when it is imported, so each test builds
// the DOM first and then imports a fresh copy of the module.
import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

const track = vi.fn();
vi.mock("../lib/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

type Observed = { callback: IntersectionObserverCallback; targets: Set<Element> };
let observers: Observed[] = [];

class FakeObserver {
  readonly entry: Observed;
  constructor(callback: IntersectionObserverCallback) {
    this.entry = { callback, targets: new Set() };
    observers.push(this.entry);
  }
  observe(target: Element) {
    this.entry.targets.add(target);
  }
  unobserve(target: Element) {
    this.entry.targets.delete(target);
  }
  disconnect() {
    this.entry.targets.clear();
  }
  takeRecords() {
    return [];
  }
}

/** Reports `target` as intersecting (or not) to every observer watching it. */
function intersect(target: Element, isIntersecting = true) {
  for (const observer of observers) {
    if (!observer.targets.has(target)) continue;
    observer.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    );
  }
}

/** Whether matchMedia reports reduced motion. */
function stubMotion(reduce: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes(": reduce")
          ? reduce
          : query.includes(": no-preference")
            ? !reduce
            : false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        onchange: null,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

/**
 * A block waiting to rise in: data-pending before the migration; after it, the motion gate
 * on <html> with no data-revealed on the block.
 */
const hidden = (el: Element) =>
  el.hasAttribute("data-pending") ||
  (document.documentElement.hasAttribute("data-motion-ready") && !el.hasAttribute("data-revealed"));

/** Puts `el` below the fold (its top past the viewport's bottom). */
function belowFold(el: Element) {
  el.getBoundingClientRect = () =>
    ({ top: window.innerHeight + 200, bottom: window.innerHeight + 400 }) as DOMRect;
}

async function load(html: string, before?: () => void) {
  document.body.innerHTML = html;
  before?.();
  vi.resetModules();
  await import("./site");
}

beforeEach(() => {
  observers = [];
  track.mockClear();
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  stubMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  document.documentElement.className = "";
  for (const name of [...document.documentElement.getAttributeNames()]) {
    if (name.startsWith("data-")) document.documentElement.removeAttribute(name);
  }
  localStorage.clear();
});

describe("scroll reveals", () => {
  it("hide a block below the fold until it scrolls in", async () => {
    await load('<div id="a" data-reveal>Hi</div>', () =>
      belowFold(document.getElementById("a") as HTMLElement),
    );
    const block = document.getElementById("a") as HTMLElement;
    expect(hidden(block)).toBe(true);
    intersect(block);
    expect(hidden(block)).toBe(false);
  });

  it("never hide a block already on screen", async () => {
    await load('<div id="a" data-reveal>Hi</div>');
    expect(hidden(document.getElementById("a") as HTMLElement)).toBe(false);
  });

  it("reveal a block when keyboard focus lands in it", async () => {
    const user = userEvent.setup();
    await load('<div id="a" data-reveal><a href="#x">Go</a></div>', () =>
      belowFold(document.getElementById("a") as HTMLElement),
    );
    const block = document.getElementById("a") as HTMLElement;
    await user.tab();
    expect(hidden(block)).toBe(false);
  });

  it("hide nothing under reduced motion", async () => {
    stubMotion(true);
    await load('<div id="a" data-reveal>Hi</div>', () =>
      belowFold(document.getElementById("a") as HTMLElement),
    );
    expect(hidden(document.getElementById("a") as HTMLElement)).toBe(false);
  });

  it("hide nothing without IntersectionObserver", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    await load('<div id="a" data-reveal>Hi</div>', () =>
      belowFold(document.getElementById("a") as HTMLElement),
    );
    expect(hidden(document.getElementById("a") as HTMLElement)).toBe(false);
  });
});

describe("table of contents", () => {
  it("marks the link of the heading being read, and only that one", async () => {
    await load(`
      <nav data-toc><a href="#one">One</a><a href="#two">Two</a></nav>
      <h2 id="one">One</h2><h2 id="two">Two</h2>`);
    const [one, two] = [...document.querySelectorAll("[data-toc] a")];
    intersect(document.getElementById("one") as HTMLElement);
    expect(one).toHaveAttribute("aria-current", "location");
    intersect(document.getElementById("one") as HTMLElement, false);
    intersect(document.getElementById("two") as HTMLElement);
    expect(two).toHaveAttribute("aria-current", "location");
    expect(one).not.toHaveAttribute("aria-current");
  });
});

/**
 * CopyBlock.astro's server output (CopyBlock.test.ts pins it). Astro components don't render
 * under happy-dom, so the markup is written out here.
 */
function copyBlock({
  lines,
  label,
  track,
  trackMethod,
}: {
  lines: string[];
  label: string;
  track?: string;
  trackMethod?: string;
}) {
  const rows = lines
    .map(
      (line) =>
        `<span class="block"><span aria-hidden="true" class="copy-prompt">$ </span>${line
          .split(" ")
          .map((word) => `<span class="whitespace-nowrap">${word}</span>`)
          .join(" ")}</span>`,
    )
    .join("\n");
  const tracking = `${track ? ` data-track="${track}"` : ""}${trackMethod ? ` data-track-method="${trackMethod}"` : ""}`;
  return `<div><pre><code>${rows}</code></pre><button type="button" hidden data-copy="${lines.join("\n")}"${tracking} aria-label="${label}">Copy</button></div>`;
}

describe("copy blocks (CopyBlock.astro)", () => {
  const lines = ["bun add -d slidev-addon-decks", "bunx -p slidev-addon-decks decks init talk"];

  it("copy every line, say Copied for 1.5s and track the method", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await load(
      copyBlock({
        lines,
        label: "Copy the install commands",
        track: "install_copied",
        trackMethod: "hero",
      }),
    );
    const button = document.querySelector("button") as HTMLButtonElement;
    expect(button.hidden).toBe(false);
    expect(button).toHaveAccessibleName("Copy the install commands");
    await user.click(button);
    expect(await navigator.clipboard.readText()).toBe(lines.join("\n"));
    expect(button).toHaveTextContent(/^\s*Copied\s*$/);
    expect(track).toHaveBeenCalledWith("install_copied", { method: "hero" });
    await act(() => vi.advanceTimersByTimeAsync(1400));
    expect(button).toHaveTextContent(/^\s*Copied\s*$/);
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(button).toHaveTextContent(/^\s*Copy\s*$/);
  });

  it("send no event without data-track", async () => {
    const user = userEvent.setup();
    await load(copyBlock({ lines, label: "Copy" }));
    await user.click(document.querySelector("button") as HTMLButtonElement);
    expect(await navigator.clipboard.readText()).toBe(lines.join("\n"));
    expect(track).not.toHaveBeenCalled();
  });

  it("stay hidden without the clipboard API", async () => {
    const real = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    onTestFinished(() => {
      if (real) Object.defineProperty(navigator, "clipboard", real);
      else Reflect.deleteProperty(navigator, "clipboard");
    });
    await load(copyBlock({ lines, label: "Copy" }));
    expect((document.querySelector("button") as HTMLButtonElement).hidden).toBe(true);
  });
});

/** A code frame as the docs Markdown and the landing theme.json render it. */
const codeFrame = (code: string) =>
  `<figure class="code-frame"><figcaption>theme.json</figcaption><pre class="astro-code"><code>${code}</code></pre></figure>`;

describe("code frames", () => {
  it("get a Copy button that copies the code", async () => {
    const user = userEvent.setup();
    await load(codeFrame('{"a": 1}'));
    const button = document.querySelector("figure button") as HTMLButtonElement;
    expect(button.hidden).toBe(false);
    expect(button).toHaveTextContent(/^\s*Copy\s*$/);
    await user.click(button);
    expect(await navigator.clipboard.readText()).toBe('{"a": 1}');
    expect(button).toHaveTextContent(/^\s*Copied\s*$/);
  });
});

describe("copy page", () => {
  const markup = '<button type="button" hidden data-copy-page="/docs/a.md">Copy page</button>';

  it("fetches the page's Markdown and copies it", async () => {
    const user = userEvent.setup();
    const fetch = vi.fn(async () => new Response("# A\n"));
    vi.stubGlobal("fetch", fetch);
    await load(markup);
    const button = document.querySelector("button") as HTMLButtonElement;
    expect(button.hidden).toBe(false);
    await user.click(button);
    expect(fetch).toHaveBeenCalledWith("/docs/a.md");
    expect(await navigator.clipboard.readText()).toBe("# A\n");
    expect(button).toHaveTextContent("Copied");
  });

  it("says Copy failed when the fetch fails, then resets", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("offline");
    });
    await load(markup);
    const button = document.querySelector("button") as HTMLButtonElement;
    await user.click(button);
    expect(button).toHaveTextContent("Copy failed");
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(button).toHaveTextContent("Copy page");
  });
});

describe("theme toggle", () => {
  const markup = '<button type="button" data-theme-toggle hidden>Dark theme</button>';

  it("shows, reflects the current theme and stores the choice", async () => {
    const user = userEvent.setup();
    document.documentElement.classList.add("light");
    await load(markup);
    const toggle = document.querySelector("button") as HTMLButtonElement;
    expect(toggle.hidden).toBe(false);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("light");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("theme")).toBe("dark");
    await user.click(toggle);
    expect(document.documentElement).toHaveClass("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
