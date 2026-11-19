// Mounts the live player over each guide demo's poster (src/lib/markdown.ts renders the figure)
// once it scrolls into view. At most LIVE players run at once: mounting another sends the
// earliest one that has scrolled away back to its poster, so a long page never holds more
// than a few live decks. The player itself keeps reduced motion to the poster and Play.
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DeckPlayer } from "../components/landing/DeckPlayer";
import type { DemoPlayer } from "../data/demo-examples";

const LIVE = 3;

type Stage = { element: HTMLElement; poster: string; root: Root | null; visible: boolean };

export function mountDeckDemos(doc: Document = document, live = LIVE) {
  const stages: Stage[] = Array.from(
    doc.querySelectorAll<HTMLElement>("[data-deck-demo-player]"),
    (element) => ({ element, poster: element.innerHTML, root: null, visible: false }),
  );
  const mounted: Stage[] = [];
  const unmount = (stage: Stage) => {
    stage.root?.unmount();
    stage.root = null;
    stage.element.innerHTML = stage.poster;
    mounted.splice(mounted.indexOf(stage), 1);
  };
  const mount = (stage: Stage) => {
    if (stage.root) return;
    if (mounted.length >= live) {
      const away = mounted.find((other) => !other.visible);
      if (!away) return;
      unmount(away);
    }
    const props = JSON.parse(stage.element.dataset.deckDemoPlayer ?? "") as DemoPlayer;
    stage.element.replaceChildren();
    stage.root = createRoot(stage.element);
    stage.root.render(
      createElement(DeckPlayer, { examples: [props.example], range: props.range }),
    );
    mounted.push(stage);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const stage = stages.find((item) => item.element === entry.target);
      if (!stage) continue;
      stage.visible = entry.isIntersecting;
    }
    // A demo that came into view while three others were live gets its turn once one leaves.
    for (const stage of stages) if (stage.visible) mount(stage);
  });
  for (const stage of stages) observer.observe(stage.element);
  return () => {
    observer.disconnect();
    for (const stage of [...mounted]) unmount(stage);
  };
}
