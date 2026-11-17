import {
  createDeckStore,
  Deck,
  type DeckSource,
  type RenderContext,
  SlideHost,
  useDeck,
  useSlide,
} from "@react-decks/runtime";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { onTestFinished, vi } from "vitest";
import { gsap } from "./index";

export async function setupMotion(
  Subject: ComponentType,
  options: { click?: number; context?: RenderContext; error?: boolean } = {},
) {
  const previousMotion = document.documentElement.getAttribute("data-deck-motion");
  window.history.replaceState(null, "", `/#/1${options.click ? `?clicks=${options.click}` : ""}`);
  function Content() {
    const slide = useSlide();
    const deck = useDeck();
    if (options.context && options.context !== "slide" && slide.renderContext === "slide") {
      return <SlideHost no={1} context={options.context} />;
    }
    return (
      <>
        <button type="button" onClick={deck.next}>
          Next click
        </button>
        <button type="button" onClick={deck.prev}>
          Previous click
        </button>
        <Subject />
      </>
    );
  }
  const slides = [1, 2].map((no) => ({
    no,
    id: `slide-${no}`,
    file: `${no}.mdx`,
    title: `Slide ${no}`,
    clicks: 5,
  }));
  const source: DeckSource = {
    manifest: {
      name: "motion-test",
      title: "Motion test",
      canvas: { width: 1920, height: 1080 },
      slides,
    },
    slides: {
      "slide-1": async () => ({ default: Content }),
      "slide-2": async () => ({ default: () => null }),
    },
    frontmatter: {},
    components: {},
  };
  const store = createDeckStore(source.manifest);
  const errors: unknown[] = [];
  const result = render(<Deck source={source} store={store} />, {
    onCaughtError: (error) => {
      errors.push(error);
    },
  });
  onTestFinished(() => {
    result.unmount();
    store.destroy();
    if (previousMotion === null) document.documentElement.removeAttribute("data-deck-motion");
    else document.documentElement.setAttribute("data-deck-motion", previousMotion);
    window.history.replaceState(null, "", "/");
  });
  if (options.error) await screen.findByText(/^Slide slide-1 \(1.mdx\) failed to render:/);
  else await screen.findByRole("button", { name: "Next click" });
  const user = userEvent.setup();
  return {
    ...result,
    store,
    errors,
    user,
    next: () => user.click(screen.getByRole("button", { name: "Next click" })),
    previous: () => user.click(screen.getByRole("button", { name: "Previous click" })),
  };
}

// gsap's root timeline normally follows the wall clock, which made mid-tween assertions
// depend on how fast the machine was. Tests own the clock: only tick() moves it.
gsap.ticker.remove(gsap.updateRoot);
let clock = gsap.globalTimeline.time();

export async function tick(seconds = 0) {
  await act(async () => {
    clock += seconds;
    gsap.updateRoot(clock);
    await Promise.resolve();
  });
}

export async function advance(seconds: number) {
  await act(async () => {
    clock += seconds;
    gsap.updateRoot(clock);
    await vi.advanceTimersByTimeAsync(seconds * 1000);
  });
}
