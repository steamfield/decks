import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Command, DeckState } from "../../lib/player/protocol";
import type { Tape, TapeTheme } from "../../lib/player/tape";
import { BOOT_TIMEOUT_MS, DeckPlayer } from "./DeckPlayer";

const theme: TapeTheme = {
  ink: "#09090b",
  paper: "#f7f8f8",
  stripes: ["#06b6d4", "#f59e0b", "#f43f5e"],
  brand: "Decks",
  shell: { kind: "clear" },
};

const tape = (name: string, title: string): Tape => ({
  name,
  title,
  href: `/demo/${name}/`,
  slides: 3,
  slideTitles: ["Cover", "", "Close"],
  startSlide: 2,
  states: [{ slide: 2, beat: 0, beats: 1, lead: "Recorded lead.", body: "Recorded body." }],
  theme,
  poster: { base: `/posters/${name}`, width: 1280, height: 720 },
});

const tapes = [tape("tides", "Tides run on the Moon's clock"), tape("other", "Another deck")];

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
  const spy = () => frame();
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
  return { frame, sent, spy, say, state };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("DeckPlayer", () => {
  it("shows the poster and the recorded start beat before anything loads", () => {
    render(<DeckPlayer tapes={tapes} />);
    expect(document.querySelector("iframe")).toBeNull();
    expect(
      screen.getByRole("img", { name: /Tides run on the Moon's clock, slide 2/ }),
    ).toHaveAttribute("fetchpriority", "high");
    expect(screen.getByText("Recorded lead.")).toBeInTheDocument();
    expect(screen.getByText(/^S2·B1: slide 2 of 3, step 1 of 2$/)).toBeInTheDocument();
    expect(screen.getByText("02 1/2")).toBeInTheDocument();
  });

  it("boots the deck on PLAY, as an inert, untabbable, titled iframe", async () => {
    render(<DeckPlayer tapes={tapes} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("src")).toBe("/demo/tides/index.html#/2");
    expect(frame?.getAttribute("tabindex")).toBe("-1");
    expect(frame?.hasAttribute("inert")).toBe(true);
    expect(frame?.getAttribute("title")).toMatch(/Tides run on the Moon's clock/);
    expect(screen.getByText("LOAD")).toBeInTheDocument();
  });

  it("steers a deck that opened elsewhere to the start slide, then reports position", () => {
    render(<DeckPlayer tapes={tapes} />);
    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    const d = deck();
    d.spy();
    d.say({ type: "decks:ready" });
    d.say({ type: "decks:meta", title: "Tides", slides: 3, slideTitles: ["Cover", "", "Close"] });
    d.state({ slide: 1, beats: 0, lead: "", body: "" });
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "go", slide: 2, beat: 0 }]);
    d.state({});
    // The queued step goes out once the deck stands on the poster's beat.
    expect(d.sent.at(-1)).toEqual({ type: "decks:cmd", cmd: "next" });
    d.state({ beat: 1, lead: "Second lead.", settled: false, direction: "forward" });
    expect(screen.getByText("Second lead.")).toBeInTheDocument();
    expect(document.querySelector(".hub")?.getAttribute("data-spin")).toBe("forward");
    d.state({ beat: 1, lead: "Second lead." });
    expect(document.querySelector(".hub")?.getAttribute("data-spin")).toBe("still");
    expect(screen.getByText("Slide 2 of 3, step 2 of 2. Second lead.")).toBeInTheDocument();
  });

  it("falls back to the slide title when a slide has no story card", () => {
    render(<DeckPlayer tapes={tapes} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.spy();
    d.say({ type: "decks:meta", title: "Tides", slides: 3, slideTitles: ["Cover", "", "Close"] });
    d.state({});
    d.state({ slide: 3, beat: 0, beats: 0, lead: "", body: "" });
    expect(screen.getByText("Close", { selector: ".now-playing > p" })).toBeInTheDocument();
    // The TV's on-screen display carries the slide title too.
    expect(screen.getByText("Close", { selector: ".tv-osd-title" })).toBeInTheDocument();
  });

  it("plays beat by beat after a reading pause and stops at the end", () => {
    render(<DeckPlayer tapes={tapes} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.spy();
    d.state({});
    expect(d.sent).toEqual([]);
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([{ type: "decks:cmd", cmd: "next" }]);
    d.state({ slide: 3, beat: 0, beats: 0, lead: "", body: "" });
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("End")).toHaveAttribute("data-on");
  });

  it("pauses", () => {
    render(<DeckPlayer tapes={tapes} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.spy();
    d.state({});
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(9000));
    expect(d.sent).toEqual([]);
  });

  it("steps with the arrow keys only from inside the faceplate", () => {
    render(<DeckPlayer tapes={tapes} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const d = deck();
    d.spy();
    d.state({});
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(d.sent).toEqual([]);
    const faceplate = screen.getByRole("group", { name: "Deck player" });
    fireEvent.keyDown(faceplate, { key: "ArrowRight" });
    fireEvent.keyDown(faceplate, { key: "ArrowLeft", shiftKey: true });
    expect(d.sent).toEqual([
      { type: "decks:cmd", cmd: "next" },
      { type: "decks:cmd", cmd: "prevSlide" },
    ]);
  });

  it("ignores messages from anything but its own iframe", () => {
    render(<DeckPlayer tapes={tapes} />);
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
    render(<DeckPlayer tapes={tapes} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(BOOT_TIMEOUT_MS + 1));
    expect(screen.getByRole("link", { name: "Open it in a new tab" })).toHaveAttribute(
      "href",
      "/demo/tides/",
    );
  });

  it("swaps cassettes from the rack, a group of native radios", () => {
    render(<DeckPlayer tapes={tapes} />);
    const rack = screen.getByRole("group", { name: "Load an example deck" });
    const [first, second] = within(rack).getAllByRole("radio");
    expect(first).toBeChecked();
    fireEvent.click(second as HTMLElement);
    act(() => vi.advanceTimersByTime(1500));
    expect(second).toBeChecked();
    expect(screen.getByText("Tape: other")).toBeInTheDocument();
    // The pick boots the new deck once the cassette is in.
    expect(document.querySelector("iframe")?.getAttribute("src")).toBe("/demo/other/index.html#/2");
  });

  it("renders the rack as links to each static build until it hydrates", async () => {
    const { renderToString } = await import("react-dom/server");
    const html = renderToString(<DeckPlayer tapes={tapes} />);
    expect(html).toContain('href="/demo/tides/"');
    expect(html).toContain('href="/demo/other/"');
    expect(html).not.toContain('type="radio"');
  });

  it("shows the loaded tape's J-card, its slide titles split over two sides", () => {
    render(<DeckPlayer tapes={tapes} />);
    const sideA = screen.getByRole("list", { name: "Tides run on the Moon's clock, side A" });
    const sideB = screen.getByRole("list", { name: "Tides run on the Moon's clock, side B" });
    expect(
      within(sideA)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Cover", "Slide 2"]);
    expect(
      within(sideB)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Close"]);
  });
});
