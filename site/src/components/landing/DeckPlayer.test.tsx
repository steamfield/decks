import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Example } from "../../lib/player/example";
import { PICK_EVENT } from "../../lib/player/pick";
import type { Command, DeckState } from "../../lib/player/protocol";
import { BOOT_TIMEOUT_MS, DeckPlayer } from "./DeckPlayer";

const example = (name: string, title: string, extra: Partial<Example> = {}): Example => ({
  name,
  title,
  href: `/demo/${name}/`,
  slides: 3,
  slideTitles: ["Cover", "", "Close"],
  startSlide: 2,
  startBeat: 0,
  states: [
    { slide: 2, beat: 0, beats: 1, lead: "Recorded lead.", body: "Recorded body." },
    { slide: 2, beat: 1, beats: 1, lead: "Recorded second lead.", body: "" },
  ],
  provenance: { kind: "template", label: "Template deck" },
  poster: { base: `/posters/${name}`, width: 1280, height: 720 },
  loop: null,
  run: null,
  edits: null,
  ...extra,
});

const hero = example("tides", "Tides run on the Moon's clock", {
  provenance: { kind: "agent", label: "Drafted by Claude Code, then edited by hand" },
  run: { prompt: "make a deck", setup: "repo", turns: 87, minutes: "8.3", cost: "$3.17" },
  edits: {
    by: "hand",
    files: 6,
    insertions: 49,
    deletions: 11,
    pairs: [{ file: "a.vue", before: "Old caption.", after: "New caption." }],
  },
});
const examples = [hero, example("other", "Another deck")];

const base: DeckState = {
  slide: 2,
  slides: 3,
  beat: 0,
  beats: 1,
  lead: "Live lead.",
  body: "Live body.",
  settled: true,
  direction: null,
};

/** The deck's side of the contract: answer as the iframe, record what the page sends. */
function deck() {
  const sent: Command[] = [];
  // happy-dom doesn't load iframe pages, so the deck's window is a stand-in.
  const win = { postMessage: (message: Command) => sent.push(message) };
  const frame = () => {
    const element = document.querySelector("iframe") as HTMLIFrameElement;
    if (element.contentWindow !== (win as unknown as Window)) {
      Object.defineProperty(element, "contentWindow", { value: win, configurable: true });
    }
    return element;
  };
  // The deck's window, not whatever iframe is mounted now, so a test can speak
  // as a deck the player has already dropped.
  const say = (data: unknown) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data,
          origin: window.location.origin,
          source: win as unknown as Window,
        }),
      );
    });
  const state = (patch: Partial<DeckState>) => say({ type: "decks:state", ...base, ...patch });
  frame();
  return { sent, say, state };
}

const caption = () => document.querySelector(".caption-lead")?.textContent;

/**
 * Stubs matchMedia so motion is allowed (or reduced) for the next render. The
 * returned function changes the setting later, as the system setting would.
 */
function motion(allowed: boolean) {
  let now = allowed;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return query.includes("no-preference") ? now : !now;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
  return (next: boolean) =>
    act(() => {
      now = next;
      for (const listener of listeners) listener();
    });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  motion(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "hidden");
});

describe("DeckPlayer", () => {
  it("keeps a sharp poster and the start caption while the live deck loads", () => {
    render(<DeckPlayer examples={examples} />);
    expect(document.querySelector("iframe")).toHaveStyle({ visibility: "hidden" });
    expect(document.querySelector("video")).toBeNull();
    expect(
      screen.getByRole("img", { name: "Tides run on the Moon's clock, slide 2 of 3" }),
    ).toHaveAttribute("fetchpriority", "high");
    expect(caption()).toBe("Recorded lead.");
    expect(document.querySelector(".caption-body")).toHaveTextContent("Recorded body.");
    expect(screen.getByText("Slide 2 of 3, step 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Slide 2 · Step 1 of 2")).toBeInTheDocument();
  });

  it("keeps agent provenance in the supporting note", () => {
    render(<DeckPlayer examples={examples} />);
    expect(
      screen.getByText(
        "Drafted in 8 minutes from this prompt with this repository's agent setup, then edited by hand (+49/−11 in 6 files).",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open deck" })).toHaveAttribute(
      "href",
      "/demo/tides/#/2",
    );
  });

  it("automatically opens a titled interactive deck and stays paused under reduced motion", () => {
    render(<DeckPlayer examples={examples} />);
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("src")).toBe("/demo/tides/index.html?decks-bridge=1#/2");
    expect(frame?.hasAttribute("inert")).toBe(false);
    expect(frame?.getAttribute("tabindex")).not.toBe("-1");
    expect(frame?.getAttribute("title")).toMatch(/Tides run on the Moon's clock/);
    const d = deck();
    d.state({});
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([]);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("steers a deck that opened elsewhere to the start step, then sends the queued step", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    const d = deck();
    d.say({ type: "decks:ready" });
    d.say({ type: "decks:meta", title: "Tides", slides: 3, slideTitles: ["Cover", "", "Close"] });
    d.state({ slide: 1, beats: 0, lead: "", body: "" });
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 0, requestId: 1 }]);
    d.state({});
    expect(d.sent.at(-1)).toEqual({
      type: "decks:cmd",
      cmd: "go",
      slide: 2,
      beat: 1,
      requestId: 2,
    });
    d.state({ beat: 1, lead: "Second lead.", settled: false, direction: "forward" });
    expect(caption()).toBe("Second lead.");
    d.state({ beat: 1, lead: "Second lead." });
    expect(screen.getByText("Slide 2 of 3, step 2 of 2. Second lead.")).toBeInTheDocument();
  });

  it("starts on a later step when the example's start step is not the first", () => {
    const later = { ...hero, startBeat: 1 };
    render(<DeckPlayer examples={[later]} />);
    expect(caption()).toBe("Recorded second lead.");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(document.querySelector("iframe")?.getAttribute("src")).toBe(
      "/demo/tides/index.html?decks-bridge=1#/2?clicks=1",
    );
    const d = deck();
    d.state({});
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
  });

  it("falls back to the slide title when a slide has no story card", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.say({ type: "decks:meta", title: "Tides", slides: 3, slideTitles: ["Cover", "", "Close"] });
    d.state({});
    d.state({ slide: 3, beat: 0, beats: 0, lead: "", body: "" });
    expect(caption()).toBe("Close");
  });

  it("plays step by step after a reading pause and stops at the end", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.state({});
    expect(d.sent).toEqual([]);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
    d.state({ beat: 1, requestId: 1 });
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent.at(-1)).toEqual({
      type: "decks:cmd",
      cmd: "go",
      slide: 3,
      beat: 0,
      requestId: 2,
    });
    d.state({ slide: 3, beat: 0, beats: 0, lead: "", body: "", requestId: 2 });
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
  });

  it("pauses", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.state({});
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([]);
  });

  it("steps with the arrow keys only from inside the player", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.state({});
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(d.sent).toEqual([]);
    const player = screen.getByRole("group", { name: /^Deck player/ });
    expect(player).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(player, { key: "ArrowRight" });
    fireEvent.keyDown(player, { key: "ArrowLeft", shiftKey: true });
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
    d.state({ beat: 1, requestId: 1 });
    expect(d.sent.at(-1)).toEqual({
      type: "decks:cmd",
      cmd: "go",
      slide: 1,
      beat: 0,
      requestId: 2,
    });
  });

  it("ignores messages from anything but its own iframe", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "decks:state", ...base, lead: "Spoofed." },
          origin: window.location.origin,
          source: window,
        }),
      );
    });
    expect(screen.queryByText("Spoofed.")).toBeNull();
  });

  it("gives up on a deck that never answers, links to it, and boots again on a press", () => {
    render(<DeckPlayer examples={examples} />);
    const player = screen.getByRole("group", { name: /^Deck player/ });
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    act(() => vi.advanceTimersByTime(BOOT_TIMEOUT_MS + 1));
    expect(player).toHaveAttribute("data-phase", "failed");
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: "Open deck" })).toHaveAttribute(
      "href",
      "/demo/tides/#/2",
    );
    // The dropped deck answering late changes nothing.
    d.state({ lead: "Too late." });
    expect(player).toHaveAttribute("data-phase", "failed");
    expect(screen.queryByText("Too late.")).toBeNull();
    // A control press tries again.
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(player).toHaveAttribute("data-phase", "booting");
    expect(document.querySelector("iframe")).not.toBeNull();
  });

  it("keeps the last step pressed while the deck boots and sends it once it is there", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    fireEvent.keyDown(screen.getByRole("group", { name: /^Deck player/ }), {
      key: "ArrowRight",
      shiftKey: true,
    });
    const d = deck();
    d.state({});
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 3, beat: 0, requestId: 1 }]);
  });

  it("leaves Alt, Cmd and Ctrl arrows to the browser", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.state({});
    const player = screen.getByRole("group", { name: /^Deck player/ });
    for (const modifier of ["altKey", "metaKey", "ctrlKey"]) {
      // fireEvent returns false when the handler called preventDefault.
      expect(fireEvent.keyDown(player, { key: "ArrowLeft", [modifier]: true }), modifier).toBe(
        true,
      );
    }
    expect(d.sent).toEqual([]);
    expect(fireEvent.keyDown(player, { key: "ArrowRight" })).toBe(false);
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
  });

  it("marks full screen with aria-pressed and keeps its state when the browser refuses", async () => {
    Object.defineProperty(document, "fullscreenEnabled", { value: true, configurable: true });
    const refuse = vi.fn(() => Promise.reject(new Error("denied")));
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      value: refuse,
      configurable: true,
    });
    try {
      render(<DeckPlayer examples={examples} />);
      const button = screen.getByRole("button", { name: "Full screen" });
      expect(button).toHaveAttribute("aria-pressed", "false");
      await act(async () => {
        fireEvent.click(button);
      });
      expect(refuse).toHaveBeenCalled();
      expect(button).toHaveAttribute("aria-pressed", "false");
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
      Reflect.deleteProperty(document, "fullscreenEnabled");
    }
  });

  it("automatically opens the selected gallery deck paused at its start", () => {
    render(<DeckPlayer examples={examples} />);
    act(() => {
      window.dispatchEvent(new CustomEvent(PICK_EVENT, { detail: "other" }));
    });
    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      "/demo/other/index.html?decks-bridge=1#/2",
    );
    expect(screen.getByRole("button", { name: "Another deck" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // A deck without a recorded run has no draft line.
    expect(screen.queryByText(/^Drafted in/)).toBeNull();
  });

  it("takes a pick made before it hydrated", () => {
    window.__decksPick = "other";
    render(<DeckPlayer examples={examples} />);
    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      "/demo/other/index.html?decks-bridge=1#/2",
    );
    expect(screen.getByRole("button", { name: "Another deck" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(window.__decksPick).toBeUndefined();
  });

  it("keeps the loading poster until the first queued Next has actually settled", () => {
    render(<DeckPlayer examples={examples} />);
    const iframe = document.querySelector("iframe");
    const d = deck();
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    d.state({});
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
    expect(iframe).toHaveStyle({ visibility: "hidden" });
    expect(screen.getByRole("img", { name: /Tides run/ })).toBeInTheDocument();
    d.state({ beat: 1, settled: false, requestId: 1 });
    expect(iframe).toHaveStyle({ visibility: "hidden" });
    d.state({ beat: 1, requestId: 1, lead: "The next live step." });
    expect(iframe).toHaveStyle({ visibility: "visible" });
    expect(screen.queryByRole("img", { name: /Tides run/ })).toBeNull();
    expect(caption()).toBe("The next live step.");
    expect(d.sent).toHaveLength(1);
  });

  it("waits for the live story card before revealing the deck or starting the opening hold", () => {
    motion(true);
    render(<DeckPlayer examples={examples} />);
    const iframe = document.querySelector("iframe");
    const d = deck();
    d.state({ lead: "", body: "" });
    act(() => vi.advanceTimersByTime(2000));
    expect(iframe).toHaveStyle({ visibility: "hidden" });
    expect(screen.getByRole("img", { name: /Tides run/ })).toBeInTheDocument();
    expect(d.sent).toEqual([]);
    d.state({ lead: "The real live card.", body: "Its live body." });
    expect(iframe).toHaveStyle({ visibility: "visible" });
    expect(caption()).toBe("The real live card.");
    act(() => vi.advanceTimersByTime(1499));
    expect(d.sent).toEqual([]);
    act(() => vi.advanceTimersByTime(1));
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
  });

  it("reveals conventional slides that have no story card", () => {
    const conventional = example("conventional", "Conventional", {
      slideTitles: ["Cover", "Conventional title", "Close"],
      states: [{ slide: 2, beat: 0, beats: 0, lead: "", body: "" }],
    });
    render(<DeckPlayer examples={[conventional]} />);
    const d = deck();
    d.state({ beats: 0, lead: "", body: "" });
    expect(document.querySelector("iframe")).toHaveStyle({ visibility: "visible" });
    expect(caption()).toBe("Conventional title");
    expect(screen.queryByRole("img", { name: /Conventional, slide/ })).toBeNull();
  });

  it("autoplays the actual deck after the opening hold and waits for each settled state", () => {
    motion(true);
    render(<DeckPlayer examples={examples} />);
    const d = deck();
    d.state({});
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
    act(() => vi.advanceTimersByTime(1499));
    expect(d.sent).toEqual([]);
    act(() => vi.advanceTimersByTime(1));
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
    d.state({ beat: 1, settled: false, requestId: 1 });
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toHaveLength(1);
    d.state({ beat: 1, requestId: 1 });
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent.at(-1)).toEqual({
      type: "decks:cmd",
      cmd: "go",
      slide: 3,
      beat: 0,
      requestId: 2,
    });
  });

  it("pauses live playback when reduced motion is enabled without replacing the deck", () => {
    const change = motion(true);
    render(<DeckPlayer examples={examples} />);
    const d = deck();
    d.state({});
    const iframe = document.querySelector("iframe");
    change(false);
    expect(document.querySelector("iframe")).toBe(iframe);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([]);
  });

  it("coalesces rapid alternating intent and ignores stale settled acknowledgements", () => {
    render(<DeckPlayer examples={examples} />);
    const d = deck();
    d.state({});
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    fireEvent.click(screen.getByRole("button", { name: "Step back" }));
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
    d.state({ beat: 1, requestId: 99, lead: "Wrong acknowledgement." });
    expect(caption()).not.toBe("Wrong acknowledgement.");
    expect(d.sent).toHaveLength(1);
    d.state({ beat: 1, requestId: 1 });
    expect(d.sent).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Step back" }));
    expect(d.sent.at(-1)).toEqual({
      type: "decks:cmd",
      cmd: "go",
      slide: 2,
      beat: 0,
      requestId: 2,
    });
    d.state({ beat: 0, requestId: 2 });
    expect(screen.getByText("Slide 2 of 3, step 1 of 2. Live lead.")).toBeInTheDocument();
  });

  it("sends the latest accumulated target once the first request settles", () => {
    render(<DeckPlayer examples={examples} />);
    const d = deck();
    d.state({});
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    expect(d.sent).toHaveLength(1);
    d.state({ beat: 1, requestId: 1 });
    expect(d.sent).toEqual([
      { type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 },
      { type: "decks:cmd", cmd: "go", slide: 3, beat: 0, requestId: 2 },
    ]);
    d.state({ slide: 3, beat: 0, beats: 0, requestId: 2, lead: "Final destination." });
    d.state({ beat: 1, requestId: 1, lead: "Stale completed request." });
    expect(caption()).toBe("Final destination.");
    expect(d.sent).toHaveLength(2);
  });

  it("drops an old deck session's state after another example is selected", () => {
    render(<DeckPlayer examples={examples} />);
    const old = deck();
    old.state({});
    fireEvent.click(screen.getByRole("button", { name: "Another deck" }));
    old.state({ lead: "Old session." });
    expect(screen.queryByText("Old session.")).toBeNull();
    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      "/demo/other/index.html?decks-bridge=1#/2",
    );
    const next = deck();
    next.state({ lead: "New session." });
    expect(caption()).toBe("New session.");
    old.state({ lead: "Still old." });
    expect(caption()).toBe("New session.");
  });

  it("pauses when offscreen and waits for explicit Play when visible again", () => {
    let visibility: (visible: boolean) => void = () => {
      throw new Error("observer not installed");
    };
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          visibility = (visible) => callback([{ isIntersecting: visible }]);
        }
        observe() {}
        disconnect() {}
      },
    );
    motion(true);
    render(<DeckPlayer examples={examples} />);
    const d = deck();
    d.state({});
    act(() => visibility(false));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([]);
    act(() => visibility(true));
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
  });

  it("leaves editable controls' arrow keys alone", () => {
    render(<DeckPlayer examples={examples} />);
    const d = deck();
    d.state({});
    const player = screen.getByRole("group", { name: /^Deck player/ });
    const input = document.createElement("input");
    player.append(input);
    expect(fireEvent.keyDown(input, { key: "ArrowRight" })).toBe(true);
    expect(d.sent).toEqual([]);
    expect(fireEvent.keyDown(player, { key: "ArrowRight" })).toBe(false);
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 1 }]);
  });

  it("pauses live playback on iframe interaction and document hiding", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.state({});
    d.say({ type: "decks:interaction" });
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([]);
    Reflect.deleteProperty(document, "hidden");
  });

  it.each(["error", "timeout"] as const)(
    "remounts after navigation %s and retries the latest desired step",
    (failure) => {
      render(<DeckPlayer examples={examples} />);
      const old = deck();
      old.state({});
      const frame = document.querySelector("iframe");
      fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
      old.state({ beat: 1, settled: false, requestId: 1 });
      if (failure === "error")
        old.say({ type: "decks:error", message: "The deck could not navigate.", requestId: 1 });
      else act(() => vi.advanceTimersByTime(BOOT_TIMEOUT_MS + 1));
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      expect(document.querySelector("iframe")).not.toBeNull();
      expect(document.querySelector("iframe")).not.toBe(frame);
      expect(document.querySelector("iframe")).toHaveAttribute(
        "src",
        "/demo/tides/index.html?decks-bridge=1#/2?clicks=1",
      );
      const retried = deck();
      old.state({ beat: 1, requestId: 1, lead: "Dropped session." });
      expect(caption()).not.toBe("Dropped session.");
      retried.state({});
      expect(retried.sent).toEqual([
        { type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 2 },
      ]);
      retried.state({ beat: 1, requestId: 2 });
      expect(screen.getByRole("status")).toHaveTextContent("Interactive");
      expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    },
  );

  it("keeps the latest live target when an arrow restarts a timed-out navigation", () => {
    render(<DeckPlayer examples={examples} />);
    const old = deck();
    old.state({});
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    old.state({ beat: 1, requestId: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    expect(old.sent.at(-1)).toEqual({
      type: "decks:cmd",
      cmd: "go",
      slide: 3,
      beat: 0,
      requestId: 2,
    });
    act(() => vi.advanceTimersByTime(BOOT_TIMEOUT_MS + 1));
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    const previousFrame = document.querySelector("iframe");
    fireEvent.keyDown(screen.getByRole("group", { name: /^Deck player/ }), { key: "ArrowLeft" });
    expect(document.querySelector("iframe")).not.toBe(previousFrame);
    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      "/demo/tides/index.html?decks-bridge=1#/3",
    );
    const restarted = deck();
    restarted.state({ slide: 3, beat: 0, beats: 0 });
    expect(restarted.sent).toEqual([
      { type: "decks:cmd", cmd: "go", slide: 2, beat: 1, requestId: 3 },
    ]);
    restarted.state({ beat: 1, requestId: 3, lead: "Back one live step." });
    expect(caption()).toBe("Back one live step.");
    expect(restarted.sent).toHaveLength(1);
  });

  it("server-renders the poster, the caption and a link to the deck, no controls needed", async () => {
    const { renderToString } = await import("react-dom/server");
    const html = renderToString(<DeckPlayer examples={examples} />);
    expect(html).toContain('href="/demo/tides/#/2"');
    expect(html).toContain("Recorded lead.");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<video");
  });
});
