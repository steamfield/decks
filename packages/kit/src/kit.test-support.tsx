import { gsap } from "@react-decks/motion";
import {
  createDeckStore,
  Deck,
  type DeckSource,
  type RenderContext,
  SlideHost,
  useDeck,
  useSlide,
} from "@react-decks/runtime";
import { act, isInaccessible, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { onTestFinished, vi } from "vitest";

/**
 * The split glyphs a viewer can read under `root`, in order: every single-character box that is
 * fully opaque, with its ancestors. SplitText's glyph boxes carry no role, label or text of their
 * own to query by, so this is the one place a test walks the markup for them.
 */
export function readableGlyphs(root: Element) {
  const opacity = (element: Element) => {
    let value = 1;
    for (let part: Element | null = element; part; part = part.parentElement)
      value *= Number(getComputedStyle(part).opacity || 1);
    return value;
  };
  return Array.from(root.querySelectorAll("*"))
    .filter((el) => !el.children.length && el.textContent?.length === 1 && opacity(el) === 1)
    .map((el) => el.textContent)
    .join("");
}

/** The text a screen reader reads out under `root`: every text outside a hidden subtree. */
export function accessibleText(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let text = "";
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    if (node.parentElement && !isInaccessible(node.parentElement)) text += node.textContent;
  return text;
}

gsap.ticker.remove(gsap.updateRoot);
let clock = gsap.globalTimeline.time();
export async function tick(seconds: number) {
  await act(async () => {
    clock += seconds;
    gsap.updateRoot(clock);
  });
}

export async function advance(seconds: number) {
  await act(async () => {
    clock += seconds;
    gsap.updateRoot(clock);
    await vi.advanceTimersByTimeAsync(seconds * 1000);
  });
}

export async function setup(
  Subject: ComponentType,
  {
    click = 0,
    context = "slide",
    instant = false,
    error = false,
  }: { click?: number; context?: RenderContext; instant?: boolean; error?: boolean } = {},
) {
  window.history.replaceState(null, "", `/${instant ? "?motion=instant" : ""}#/1?clicks=${click}`);
  function Content() {
    const slide = useSlide();
    const deck = useDeck();
    if (slide.renderContext === "slide" && context !== "slide")
      return <SlideHost no={1} context={context} clicks={click} />;
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
    id: `s${no}`,
    file: `${no}.mdx`,
    title: `Slide ${no}`,
    clicks: no === 1 ? 3 : 0,
  }));
  const source: DeckSource = {
    manifest: { name: "kit-test", title: "Kit", canvas: { width: 1920, height: 1080 }, slides },
    slides: {
      s1: async () => ({ default: Content }),
      s2: async () => ({ default: () => <h1>Second slide</h1> }),
    },
    frontmatter: {},
    components: {},
  };
  const store = createDeckStore(source.manifest);
  const errors: unknown[] = [];
  const view = render(<Deck source={source} store={store} />, {
    onCaughtError: (value) => {
      errors.push(value);
    },
  });
  onTestFinished(() => {
    view.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
    document.documentElement.removeAttribute("data-deck-transition");
  });
  if (error) await screen.findByText(/^Slide s1 .*failed to render/);
  else await screen.findByRole("button", { name: "Next click" });
  const user = userEvent.setup();
  return {
    ...view,
    store,
    user,
    errors,
    next: () => user.click(screen.getByRole("button", { name: "Next click" })),
    previous: () => user.click(screen.getByRole("button", { name: "Previous click" })),
  };
}
