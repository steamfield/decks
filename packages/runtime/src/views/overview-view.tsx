import { type ReactElement, useLayoutEffect, useRef } from "react";
import { tinykeys } from "tinykeys";
import { SlideFrame } from "../canvas/slide-frame";
import { useDeckContext, useDeckSelector, usePresentation } from "../hooks";
import { SlideHost } from "../slides/slide-host";
import "./overview-view.css";

export function OverviewView(): ReactElement {
  const { source, store } = useDeckContext();
  const slide = useDeckSelector((state) => state.nav.slide);
  const { home } = usePresentation();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const grid = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    function focus(index: number) {
      const button = buttons.current[Math.max(0, Math.min(buttons.current.length - 1, index))];
      button?.focus();
      button?.scrollIntoView?.({ block: "nearest" });
    }
    focus(store.getState().nav.slide - 1);
    const element = grid.current;
    if (!element) return;
    const move = (offset: number) => (event: KeyboardEvent) => {
      event.preventDefault();
      const active = document.activeElement;
      focus((active instanceof HTMLButtonElement ? buttons.current.indexOf(active) : -1) + offset);
    };
    return tinykeys(element, {
      ArrowRight: move(1),
      ArrowDown: move(1),
      ArrowLeft: move(-1),
      ArrowUp: move(-1),
      Home(event) {
        event.preventDefault();
        focus(0);
      },
      End(event) {
        event.preventDefault();
        focus(buttons.current.length - 1);
      },
    });
  }, [store]);
  return (
    <section ref={grid} aria-label="Slide overview" className="rd-overview-view">
      {source.manifest.slides.map((meta, index) => (
        <button
          key={meta.id}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          className="rd-overview-tile"
          aria-label={`Slide ${meta.no}: ${meta.title}`}
          aria-current={meta.no === slide ? "true" : undefined}
          onClick={() =>
            store.setView(
              home.current,
              meta.no === slide ? undefined : { slide: meta.no, click: 0 },
            )
          }
        >
          <div
            inert
            className="rd-overview-box"
            style={{ aspectRatio: source.manifest.canvas.width / source.manifest.canvas.height }}
          >
            <SlideFrame>
              <SlideHost no={meta.no} clicks={meta.clicks} context="overview" />
            </SlideFrame>
          </div>
          <span>{`${meta.no}: ${meta.title}`}</span>
        </button>
      ))}
    </section>
  );
}
