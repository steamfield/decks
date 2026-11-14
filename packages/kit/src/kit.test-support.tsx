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
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { onTestFinished } from "vitest";

gsap.ticker.remove(gsap.updateRoot);
let clock = gsap.globalTimeline.time();
export async function tick(seconds: number) {
  await act(async () => {
    clock += seconds;
    gsap.updateRoot(clock);
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
          Next
        </button>
        <button type="button" onClick={deck.prev}>
          Previous
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
  else await screen.findByRole("button", { name: "Next" });
  const user = userEvent.setup();
  return {
    ...view,
    store,
    user,
    errors,
    next: () => user.click(screen.getByRole("button", { name: "Next" })),
    previous: () => user.click(screen.getByRole("button", { name: "Previous" })),
  };
}
