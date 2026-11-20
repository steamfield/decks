// Mounts the live player over each guide demo's poster (src/lib/markdown.ts renders the figure)
// once it comes within LEAD pixels of the viewport, so the deck is booting before the reader
// reaches it. At most LIVE players run at once: mounting another sends the
// earliest one that has scrolled away back to its poster, so a long page never holds more
// than a few live decks; a stage actually in the viewport may also take the place of one that is
// only inside the lead. The player itself keeps reduced motion to the poster and Play.
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DeckPlayer } from "../components/landing/DeckPlayer";
import type { DemoPlayer } from "../data/demo-examples";

const LIVE = 3;
const LEAD = 600;

type Stage = { element: HTMLElement; poster: string; root: Root | null; visible: boolean };

export function mountDeckDemos(doc: Document = document, live = LIVE) {
  const stages: Stage[] = Array.from(
    doc.querySelectorAll<HTMLElement>("[data-deck-demo-player]"),
    (element) => ({ element, poster: element.innerHTML, root: null, visible: false }),
  );
  const mounted: Stage[] = [];
  const unmount = (stage: Stage) => {
    // Keep the player's height so the page above the reader does not shift when it goes.
    stage.element.style.minHeight = `${stage.element.offsetHeight}px`;
    stage.root?.unmount();
    stage.root = null;
    stage.element.innerHTML = stage.poster;
    mounted.splice(mounted.indexOf(stage), 1);
  };
  const mount = (stage: Stage) => {
    if (stage.root) return;
    if (mounted.length >= live) {
      // Players that left the lead go first; a stage in the viewport may also take one that sits
      // only in the lead margin, so margin-only players never hold out a stage the reader sees.
      const away =
        mounted.find((other) => !other.visible) ??
        (inViewport(stage.element)
          ? mounted.find((other) => !inViewport(other.element))
          : undefined);
      if (!away) return;
      unmount(away);
    }
    const props = JSON.parse(stage.element.dataset.deckDemoPlayer ?? "") as DemoPlayer;
    stage.element.replaceChildren();
    stage.root = createRoot(stage.element);
    // A reel waits for Play; a framed demo replays its slides once it is on screen.
    stage.root.render(
      createElement(DeckPlayer, {
        examples: [props.example],
        range: props.kind === "range" ? props.range : undefined,
        autoplay: props.kind === "range",
      }),
    );
    mounted.push(stage);
  };
  const view = doc.defaultView ?? window;
  const near = (element: HTMLElement, lead: number) => {
    const { top, bottom } = element.getBoundingClientRect();
    return bottom > -lead && top < view.innerHeight + lead;
  };
  const onScreen = (element: HTMLElement) => near(element, LEAD);
  const inViewport = (element: HTMLElement) => near(element, 0);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const stage = stages.find((item) => item.element === entry.target);
        if (stage) stage.visible = entry.isIntersecting;
      }
      // Entries arrive in batches; measure the live ones again so one that left in a batch
      // not yet delivered can still make room.
      for (const stage of mounted) stage.visible = onScreen(stage.element);
      // A demo that came into view while three others were live gets its turn once one leaves.
      for (const stage of stages) if (stage.visible) mount(stage);
    },
    { rootMargin: `${LEAD}px 0px` },
  );
  for (const stage of stages) observer.observe(stage.element);
  return () => {
    observer.disconnect();
    for (const stage of [...mounted]) unmount(stage);
  };
}
