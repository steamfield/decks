import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Example } from "../../lib/player/example";
import type { Command, DeckState } from "../../lib/player/protocol";
import { BOOT_TIMEOUT_MS, DeckPlayer, PICK_EVENT } from "./DeckPlayer";

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
  const say = (data: unknown) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data,
          origin: window.location.origin,
          source: frame().contentWindow,
        }),
      );
    });
  const state = (patch: Partial<DeckState>) => say({ type: "decks:state", ...base, ...patch });
  frame();
  return { sent, say, state };
}

const caption = () => document.querySelector(".caption-lead")?.textContent;

/** Stubs matchMedia so motion is allowed (or reduced) for the next render. */
function motion(allowed: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("no-preference") ? allowed : !allowed,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  motion(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("DeckPlayer", () => {
  it("shows the poster and the recorded start step's caption before anything loads", () => {
    render(<DeckPlayer examples={examples} />);
    expect(document.querySelector("iframe")).toBeNull();
    expect(
      screen.getByRole("img", { name: /Tides run on the Moon's clock, slide 2/ }),
    ).toHaveAttribute("fetchpriority", "high");
    expect(caption()).toBe("Recorded lead.");
    expect(screen.getByText("Recorded body.")).toBeInTheDocument();
    expect(screen.getByText("Slide 2 of 3, step 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("2 · 1/2")).toBeInTheDocument();
  });

  it("puts the prompt and the run's figures in the title bar", () => {
    render(<DeckPlayer examples={examples} />);
    expect(screen.getByText(/claude -p "make a deck"/)).toBeInTheDocument();
    expect(screen.getByText("Claude Code · 8.3 min · 87 turns · $3.17")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Drafted in 8 minutes from this prompt with this repository's agent setup, then edited by hand (+49/−11 in 6 files).",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Old caption.").tagName).toBe("DEL");
    expect(screen.getByText("New caption.").tagName).toBe("INS");
  });

  it("boots the deck on Play, as an inert, untabbable, titled iframe", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("src")).toBe("/demo/tides/index.html#/2");
    expect(frame?.getAttribute("tabindex")).toBe("-1");
    expect(frame?.hasAttribute("inert")).toBe(true);
    expect(frame?.getAttribute("title")).toMatch(/Tides run on the Moon's clock/);
  });

  it("steers a deck that opened elsewhere to the start step, then sends the queued step", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    const d = deck();
    d.say({ type: "decks:ready" });
    d.say({ type: "decks:meta", title: "Tides", slides: 3, slideTitles: ["Cover", "", "Close"] });
    d.state({ slide: 1, beats: 0, lead: "", body: "" });
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 0 }]);
    d.state({});
    expect(d.sent.at(-1)).toEqual({ type: "decks:cmd", cmd: "next" });
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
      "/demo/tides/index.html#/2?clicks=1",
    );
    const d = deck();
    d.state({});
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 1 }]);
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
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "next" }]);
    d.state({ slide: 3, beat: 0, beats: 0, lead: "", body: "" });
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
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
    expect(d.sent).toEqual([
      { type: "decks:cmd", cmd: "next" },
      { type: "decks:cmd", cmd: "prevSlide" },
    ]);
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

  it("gives up on a deck that never answers and links to it", () => {
    render(<DeckPlayer examples={examples} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(BOOT_TIMEOUT_MS + 1));
    expect(screen.getByRole("link", { name: "Open it in a new tab" })).toHaveAttribute(
      "href",
      "/demo/tides/",
    );
  });

  it("loads a deck the gallery picks, live at its start step", () => {
    render(<DeckPlayer examples={examples} />);
    act(() => {
      window.dispatchEvent(new CustomEvent(PICK_EVENT, { detail: "other" }));
    });
    expect(document.querySelector("iframe")?.getAttribute("src")).toBe("/demo/other/index.html#/2");
    expect(screen.getByText("Another deck")).toBeInTheDocument();
    expect(screen.getByText("Template deck")).toBeInTheDocument();
    // A deck without a recorded run has no draft line.
    expect(screen.queryByText(/^Drafted in/)).toBeNull();
  });

  it("takes a pick made before it hydrated", () => {
    window.__decksPick = "other";
    render(<DeckPlayer examples={examples} />);
    expect(document.querySelector("iframe")?.getAttribute("src")).toBe("/demo/other/index.html#/2");
    expect(window.__decksPick).toBeUndefined();
  });

  describe("with a loop", () => {
    const loop = {
      base: "/loops/tides",
      width: 1280,
      height: 720,
      marks: [
        { t: 0, slide: 2, beat: 0 },
        { t: 2, slide: 2, beat: 1 },
      ],
    };
    const looped = [{ ...hero, loop }, examples[1] as Example];

    it("plays the muted loop when motion is allowed, captioned from its marks", () => {
      motion(true);
      render(<DeckPlayer examples={looped} />);
      const video = document.querySelector("video") as HTMLVideoElement;
      expect(video).not.toBeNull();
      expect(video.muted).toBe(true);
      expect([...video.querySelectorAll("source")].map((s) => s.getAttribute("src"))).toEqual([
        "/loops/tides.webm",
        "/loops/tides.mp4",
      ]);
      // The poster covers the video until its first frame plays.
      expect(document.querySelector("picture")).not.toBeNull();
      fireEvent.playing(video);
      expect(document.querySelector("picture")).toBeNull();
      Object.defineProperty(video, "currentTime", { value: 2.4, configurable: true });
      fireEvent.timeUpdate(video);
      expect(caption()).toBe("Recorded second lead.");
      // Play/pause pauses the loop without loading the deck.
      fireEvent.click(screen.getByRole("button", { name: "Pause" }));
      expect(document.querySelector("iframe")).toBeNull();
    });

    it("hands over to the live deck at the step the loop was showing", () => {
      motion(true);
      render(<DeckPlayer examples={looped} />);
      const video = document.querySelector("video") as HTMLVideoElement;
      Object.defineProperty(video, "currentTime", { value: 2.4, configurable: true });
      fireEvent.timeUpdate(video);
      fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
      expect(document.querySelector("video")).toBeNull();
      expect(document.querySelector("iframe")?.getAttribute("src")).toBe(
        "/demo/tides/index.html#/2?clicks=1",
      );
    });

    it("shows the poster instead under reduced motion", () => {
      motion(false);
      render(<DeckPlayer examples={looped} />);
      expect(document.querySelector("video")).toBeNull();
      expect(screen.getByRole("img", { name: /Tides run on the Moon's clock/ })).toBeVisible();
    });
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
